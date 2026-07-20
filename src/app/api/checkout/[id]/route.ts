import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await prisma.reservation.findUnique({
      where: { id },
      include: {
        room: {
          include: { roomType: true }
        }
      }
    });

    if (!res) {
      return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });
    }

    return NextResponse.json({
      id: res.id,
      checkIn: res.checkIn,
      checkOut: res.checkOut,
      totalAmount: res.totalAmount,
      roomNum: res.room.roomNum,
      roomTypeName: res.room.roomType.name,
      status: res.status,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
