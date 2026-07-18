import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// 1. GET: Admin fetches list of all rooms and available staff to assign tasks
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await prisma.room.findMany({
      include: { roomType: true },
      orderBy: { roomNum: 'asc' }
    });

    const staffList = await prisma.staff.findMany({
      select: { id: true, fullName: true, role: true }
    });

    return NextResponse.json({ rooms, staffList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Admin assigns a task to a staff member (creates RoomAssignment)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'staff' || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, staffId, taskType } = await req.json();

    if (!roomId || !staffId || !taskType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Find if there is an active reservation for this room to link it
    const activeRes = await prisma.reservation.findFirst({
      where: { roomId, status: 'CONFIRMED' },
      orderBy: { checkIn: 'desc' }
    });

    let finalReservationId = activeRes?.id;
    if (!finalReservationId) {
      const roomRes = await prisma.reservation.findFirst({ where: { roomId } });
      finalReservationId = roomRes?.id;
    }
    if (!finalReservationId) {
      const anyRes = await prisma.reservation.findFirst();
      finalReservationId = anyRes?.id;
    }

    if (!finalReservationId) {
      return NextResponse.json({ error: 'No reservations exist in the database. Housekeeping requires at least one reservation record to bind to.' }, { status: 400 });
    }

    // Create RoomAssignment
    const assignment = await prisma.roomAssignment.create({
      data: {
        roomId,
        staffId,
        taskType,
        status: 'PENDING',
        reservationId: finalReservationId
      }
    });

    // Update Room status to DIRTY or MAINTENANCE if relevant to cleanliness or repairs
    let nextStatus = null;
    if (taskType === 'Repair') {
      nextStatus = 'MAINTENANCE';
    } else if (taskType === 'Turnover Cleaning' || taskType === 'Deep Sweep') {
      nextStatus = 'DIRTY';
    }

    if (nextStatus) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: nextStatus as any }
      });
    }

    return NextResponse.json({ message: 'Housekeeping task assigned successfully', assignment });
  } catch (error: any) {
    console.error('Assign task error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. PUT: Staff marks a task as COMPLETED (releases room to AVAILABLE)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId } = await req.json();

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 });
    }

    // Find the assignment
    const assignment = await prisma.roomAssignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Update RoomAssignment status to COMPLETED
    await prisma.roomAssignment.update({
      where: { id: assignmentId },
      data: { status: 'COMPLETED' }
    });

    // Reset Room status to AVAILABLE
    await prisma.room.update({
      where: { id: assignment.roomId },
      data: { status: 'AVAILABLE' }
    });

    return NextResponse.json({ message: 'Task completed. Room released to AVAILABLE.' });
  } catch (error: any) {
    console.error('Complete task error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
