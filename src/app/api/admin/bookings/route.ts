import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET: Retrieve all reservations for the admin panel
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'staff' || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reservations = await prisma.reservation.findMany({
      include: {
        guest: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        room: {
          include: {
            roomType: true,
            resort: true
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(reservations);
  } catch (error: any) {
    console.error('Admin Fetch Bookings API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT: Perform administrative actions (CHECK_IN, CHECK_OUT, CANCEL_MID_STAY)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'staff' || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reservationId, action } = await req.json();

    if (!reservationId || !action) {
      return NextResponse.json({ error: 'Missing reservationId or action parameter.' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: { include: { roomType: true } }, payments: true }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });
    }

    // Action 1: CHECK_IN
    if (action === 'CHECK_IN') {
      if (reservation.status === 'CANCELED') {
        return NextResponse.json({ error: 'Cannot check-in a canceled reservation.' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        // Update reservation to confirmed if pending
        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: 'CONFIRMED' }
        });

        // Set room status to OCCUPIED
        await tx.room.update({
          where: { id: reservation.roomId },
          data: { status: 'OCCUPIED' }
        });
      });

      return NextResponse.json({ message: 'Guest checked in successfully.' });
    }

    // Action 2: CHECK_OUT
    if (action === 'CHECK_OUT') {
      await prisma.$transaction(async (tx) => {
        // Set room status to DIRTY (so housekeeping will turnover)
        await tx.room.update({
          where: { id: reservation.roomId },
          data: { status: 'DIRTY' }
        });
      });

      return NextResponse.json({ message: 'Guest checked out successfully. Room released to DIRTY.' });
    }

    // Action 3: CANCEL_MID_STAY
    if (action === 'CANCEL_MID_STAY') {
      if (reservation.status !== 'CONFIRMED') {
        return NextResponse.json({ error: 'Only confirmed and active stays can be canceled mid-stay.' }, { status: 400 });
      }

      const checkInTime = new Date(reservation.checkIn).getTime();
      const checkOutTime = new Date(reservation.checkOut).getTime();
      const now = new Date();
      const nowTime = now.getTime();

      if (nowTime < checkInTime || nowTime > checkOutTime) {
        return NextResponse.json({ error: 'Current date is outside the reservation stay dates.' }, { status: 400 });
      }

      // Calculate nights stayed
      const msPerDay = 1000 * 60 * 60 * 24;
      const totalNights = Math.ceil(Math.abs(checkOutTime - checkInTime) / msPerDay);
      
      // Nights stayed is days elapsed from check-in to today, minimum 1 night
      let nightsStayed = Math.ceil(Math.abs(nowTime - checkInTime) / msPerDay);
      nightsStayed = Math.max(1, Math.min(nightsStayed, totalNights));

      const remainingNights = totalNights - nightsStayed;

      if (remainingNights <= 0) {
        return NextResponse.json({ error: 'No remaining nights left to refund. Please checkout instead.' }, { status: 400 });
      }

      // Prorate calculations
      const totalAmountNum = Number(reservation.totalAmount);
      const costPerNight = totalAmountNum / totalNights;
      const proratedTotal = costPerNight * nightsStayed;
      const refundAmount = totalAmountNum - proratedTotal;

      const newCheckOutDate = new Date(checkInTime + (nightsStayed * msPerDay));

      // Update DB in a transaction
      await prisma.$transaction(async (tx) => {
        // 1. Update reservation dates, status and amount
        await tx.reservation.update({
          where: { id: reservationId },
          data: {
            checkOut: newCheckOutDate,
            totalAmount: proratedTotal,
            status: 'CANCELED' // Set status to CANCELED representing truncated stay
          }
        });

        // 2. Set room status to DIRTY
        await tx.room.update({
          where: { id: reservation.roomId },
          data: { status: 'DIRTY' }
        });

        // 3. Process refund payments
        const primaryPayment = reservation.payments.find(p => p.status === 'COMPLETED');
        if (primaryPayment) {
          // Adjust original payment to the prorated amount
          await tx.payment.update({
            where: { id: primaryPayment.id },
            data: { amount: proratedTotal }
          });

          // Create a refund transaction log
          await tx.payment.create({
            data: {
              reservationId,
              guestId: reservation.guestId,
              amount: refundAmount,
              method: primaryPayment.method,
              status: 'REFUNDED',
              paidAt: new Date()
            }
          });
        }
      });

      return NextResponse.json({
        message: 'Mid-stay cancellation completed successfully.',
        nightsStayed,
        remainingNights,
        proratedTotal,
        refundAmount
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter.' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin Perform Action API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
