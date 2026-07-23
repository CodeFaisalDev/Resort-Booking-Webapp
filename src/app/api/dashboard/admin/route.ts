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

    // Calculate occupancy, stats, financials, rooms, staff & reservations in parallel
    const [
      totalRooms,
      occupiedRooms,
      dirtyRooms,
      maintenanceRooms,
      availableRooms,
      payments,
      rooms,
      staffList,
      reservations
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: 'OCCUPIED' } }),
      prisma.room.count({ where: { status: 'DIRTY' } }),
      prisma.room.count({ where: { status: 'MAINTENANCE' } }),
      prisma.room.count({ where: { status: 'AVAILABLE' } }),
      prisma.payment.findMany({
        include: { guest: true },
        orderBy: { paidAt: 'desc' },
        take: 20
      }),
      prisma.room.findMany({
        include: { roomType: true, resort: true },
        orderBy: { roomNum: 'asc' }
      }),
      prisma.staff.findMany({
        include: { department: true }
      }),
      prisma.reservation.findMany({
        include: { guest: true, room: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const totalRevenue = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);

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
    console.error('API Dashboard Admin Error:', error);
    return NextResponse.json({ error: error.message || 'Database fetch error' }, { status: 500 });
  }
}
