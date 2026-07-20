import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        room: {
          include: { 
            roomType: true,
            resort: true
          }
        },
        reservationServices: {
          include: { service: true }
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
      resortName: res.room.resort.name,
      resortLocation: res.room.resort.location,
      resortImage: res.room.resort.images?.[0] || '',
      roomBasePrice: Number(res.room.roomType.basePrice),
      numGuests: res.numGuests,
      status: res.status,
      guest: {
        fullName: res.guest.fullName,
        email: res.guest.email,
        phone: res.guest.phone || ''
      },
      services: res.reservationServices.map(rs => ({
        id: rs.service.id,
        name: rs.service.name,
        category: rs.service.category,
        subtotal: Number(rs.subtotal)
      })),
      billingAddress: res.billingAddress || '',
      billingCity: res.billingCity || '',
      billingState: res.billingState || '',
      billingZip: res.billingZip || '',
      billingCountry: res.billingCountry || ''
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
