import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'guest') {
      return NextResponse.json({ error: 'Please sign in as a Guest to book a room.' }, { status: 401 });
    }

    const guestId = (session.user as any).id;
    const { roomTypeId, checkIn, checkOut, numGuests, serviceIds } = await req.json();

    if (!roomTypeId || !checkIn || !checkOut || !numGuests) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return NextResponse.json({ error: 'Check-out date must be after check-in date.' }, { status: 400 });
    }

    // 1. Find all rooms of this type
    const rooms = await prisma.room.findMany({
      where: { roomTypeId },
    });

    if (rooms.length === 0) {
      return NextResponse.json({ error: 'No rooms available for this room type.' }, { status: 404 });
    }

    // 2. Search for a room without scheduling conflicts
    let selectedRoom = null;
    for (const r of rooms) {
      const conflicts = await prisma.reservation.findMany({
        where: {
          roomId: r.id,
          status: { in: ['CONFIRMED', 'PENDING'] },
          NOT: {
            OR: [
              { checkOut: { lte: checkInDate } },
              { checkIn: { gte: checkOutDate } },
            ],
          },
        },
      });

      if (conflicts.length === 0) {
        selectedRoom = r;
        break;
      }
    }

    if (!selectedRoom) {
      return NextResponse.json({ error: 'All rooms of this category are occupied during the selected dates.' }, { status: 409 });
    }

    // Calculate nights
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Get room type details
    const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
    if (!roomType) return NextResponse.json({ error: 'Room type not found.' }, { status: 404 });

    // Calculate base stay price
    let basePriceNum = Number(roomType.basePrice);
    let totalStayPrice = basePriceNum * nights;

    // Retrieve selected services
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds || [] } },
    });

    let addOnTotal = 0;
    const servicesPayload = services.map(s => {
      const sub = Number(s.price) * nights;
      addOnTotal += sub;
      return {
        serviceId: s.id,
        quantity: nights,
        subtotal: sub,
      };
    });

    const totalAmount = totalStayPrice + addOnTotal;

    // Create the PENDING reservation
    const reservation = await prisma.reservation.create({
      data: {
        guestId,
        roomId: selectedRoom.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        numGuests: parseInt(numGuests),
        status: 'PENDING',
        totalAmount,
        reservationServices: {
          create: servicesPayload,
        },
      },
    });

    return NextResponse.json({
      message: 'Draft reservation created successfully',
      reservationId: reservation.id,
    });
  } catch (error: any) {
    console.error('Reservation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const userType = (session.user as any).type;
    const userRole = (session.user as any).role;

    if (userType !== 'guest' && userType !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get('id');

    if (!reservationId) {
      return NextResponse.json({ error: 'Missing reservation identifier.' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { payments: true }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });
    }

    // Guest users can only delete/cancel their own reservations
    if (userType === 'guest' && reservation.guestId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this reservation.' }, { status: 403 });
    }

    if (reservation.status === 'CANCELED') {
      return NextResponse.json({ error: 'Reservation is already canceled.' }, { status: 400 });
    }

    // Check 7-day cancellation boundary only for guests and only if booking is CONFIRMED (paid)
    if (userType === 'guest' && reservation.status === 'CONFIRMED') {
      const checkInTime = new Date(reservation.checkIn).getTime();
      const currentTime = Date.now();
      const timeDiff = checkInTime - currentTime;
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      if (timeDiff < sevenDaysInMs) {
        return NextResponse.json({ 
          error: 'Cancellation window expired. Paid bookings can only be canceled at least 7 days before check-in.' 
        }, { status: 400 });
      }
    }

    // Update reservation status and associated payments to REFUNDED
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'CANCELED' }
      });

      // Update associated payments to REFUNDED
      await tx.payment.updateMany({
        where: { reservationId },
        data: { status: 'REFUNDED' }
      });

      return res;
    });

    return NextResponse.json({
      message: 'Reservation canceled and refunded successfully.',
      reservation: updated
    });
  } catch (error: any) {
    console.error('Cancel Reservation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
