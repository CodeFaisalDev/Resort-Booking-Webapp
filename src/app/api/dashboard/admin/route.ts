import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'staff' || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Calculate occupancy & stats
    const totalRooms = await prisma.room.count();
    const occupiedRooms = await prisma.room.count({ where: { status: 'OCCUPIED' } });
    const dirtyRooms = await prisma.room.count({ where: { status: 'DIRTY' } });
    const maintenanceRooms = await prisma.room.count({ where: { status: 'MAINTENANCE' } });
    const availableRooms = await prisma.room.count({ where: { status: 'AVAILABLE' } });

    // 2. Financials
    const payments = await prisma.payment.findMany({
      include: { guest: true },
      orderBy: { paidAt: 'desc' },
      take: 20
    });

    const totalRevenue = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // 3. Room listings
    const rooms = await prisma.room.findMany({
      include: { roomType: true, resort: true },
      orderBy: { roomNum: 'asc' }
    });

    // 4. Staff listings
    const staffList = await prisma.staff.findMany({
      include: { department: true }
    });

    // 5. Active reservations
    const reservations = await prisma.reservation.findMany({
      include: { guest: true, room: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      stats: {
        totalRooms,
        occupiedRooms,
        dirtyRooms,
        maintenanceRooms,
        availableRooms,
        totalRevenue,
      },
      payments,
      rooms,
      staffList,
      reservations
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
