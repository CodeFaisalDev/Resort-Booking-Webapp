import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

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
      include: {
        guest: true,
        room: {
          include: {
            resort: true,
            roomType: true
          }
        },
        reservationServices: {
          include: { service: true }
        }
      }
    });

    // Send Reservation Initialized Email
    try {
      const checkInFormatted = new Date(reservation.checkIn).toLocaleDateString();
      const checkOutFormatted = new Date(reservation.checkOut).toLocaleDateString();
      const servicesListHtml = reservation.reservationServices.map(rs => 
        `<li>${rs.service.name}: \$${Number(rs.subtotal).toFixed(2)}</li>`
      ).join('');

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; border-radius: 16px; border: 1px solid #78350f; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #fbbf24; font-family: serif; text-align: center; font-size: 26px; letter-spacing: 2px;">BOOKME.COM</h2>
          <p style="text-align: center; color: #a8a29e; font-size: 13px; text-transform: uppercase;">Provisional Stay Reservation</p>
          <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
          
          <p>Dear <strong>${reservation.guest.fullName}</strong>,</p>
          <p>Your stay at bookme.com has been provisionally reserved. Please complete your payment details using the checkout link below to guarantee your accommodation.</p>
          
          <div style="background-color: #1c1917; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #292524;">
            <p style="margin: 5px 0;"><strong>Resort:</strong> ${reservation.room.resort.name} (${reservation.room.resort.location})</p>
            <p style="margin: 5px 0;"><strong>Suite Category:</strong> ${reservation.room.roomType.name}</p>
            <p style="margin: 5px 0;"><strong>Assigned Room:</strong> Room ${reservation.room.roomNum}</p>
            <p style="margin: 5px 0;"><strong>Stay Schedule:</strong> ${checkInFormatted} - ${checkOutFormatted} (${nights} night${nights > 1 ? 's' : ''})</p>
          </div>

          ${reservation.reservationServices.length > 0 ? `
            <h4 style="color: #fbbf24; margin-bottom: 5px;">Provisional Services Add-Ons:</h4>
            <ul style="padding-left: 20px; margin-top: 0; color: #d6d3d1;">
              ${servicesListHtml}
            </ul>
          ` : ''}

          <div style="border-top: 1px solid #292524; padding-top: 15px; margin-top: 25px; display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
            <span style="color: #a8a29e;">Amount Due:</span>
            <span style="color: #fbbf24;">\$${Number(reservation.totalAmount).toFixed(2)}</span>
          </div>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/checkout/${reservation.id}" 
               style="background-color: #fbbf24; color: #0c0a09; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
              Proceed to Secure Checkout
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
          <p style="font-size: 12px; color: #78716c; text-align: center;">
            This draft reservation will automatically hold the room. Please complete the check-out flow to secure your booking.
          </p>
        </div>
      `;

      await sendMail({
        to: reservation.guest.email,
        subject: 'Stay Reservation Pending - bookme.com',
        html: htmlBody,
      });

      const staffEmail = process.env.TO_EMAIL || 'code.faisal.dev@gmail.com';
      await sendMail({
        to: staffEmail,
        subject: `[Staff Notification] Stay Reserved (Pending Payment) - ${reservation.guest.fullName}`,
        html: htmlBody,
      });
    } catch (err) {
      console.error('Failed to send reservation pending email:', err);
    }

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

    // Dynamic Tiered Refund Calculation
    const checkInTime = new Date(reservation.checkIn).getTime();
    const currentTime = Date.now();
    const timeDiffMs = checkInTime - currentTime;
    const daysUntilCheckIn = timeDiffMs / (1000 * 60 * 60 * 24);

    let refundPercent = 100;
    let policyTier = 'FULL_REFUND';
    let policyLabel = '100% Full Refund (Standard Notice)';

    if (reservation.status === 'CONFIRMED') {
      if (daysUntilCheckIn >= 7) {
        refundPercent = 100;
        policyTier = 'FULL_REFUND';
        policyLabel = '100% Full Refund (>= 7 Days Notice)';
      } else if (daysUntilCheckIn >= 3) {
        refundPercent = 95;
        policyTier = 'LIGHT_FEE';
        policyLabel = '95% Refund (5% Processing Fee, 3-7 Days Notice)';
      } else {
        refundPercent = 90;
        policyTier = 'MAX_10PCT_FEE';
        policyLabel = '90% Refund (10% Max Cancellation Fee Cap)';
      }
    }

    const totalPaid = Number(reservation.totalAmount);
    const refundAmount = (totalPaid * refundPercent) / 100;
    const retentionFee = totalPaid - refundAmount;

    // Retrieve completed payments
    const completedPayment = reservation.payments.find(p => p.status === 'COMPLETED');
    let refundSuccessful = false;
    let refundErrorMsg = '';

    if (reservation.status === 'CONFIRMED' && refundAmount > 0) {
      if (completedPayment) {
        let dodoPaymentId = '';
        if (completedPayment.method.includes('ID: ')) {
          dodoPaymentId = completedPayment.method.split('ID: ')[1].replace(')', '').trim();
        }

        if (dodoPaymentId && process.env.DODO_PAYMENTS_API_KEY) {
          try {
            const amountInCents = Math.round(refundAmount * 100);
            const refundRes = await fetch('https://test.dodopayments.com/refunds', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY.trim()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                payment_id: dodoPaymentId,
                amount: amountInCents,
                reason: `Tiered cancellation policy (${policyLabel})`
              })
            });

            const refundData = await refundRes.json();
            if (refundRes.ok) {
              refundSuccessful = true;
            } else {
              console.error('Dodo Refund Failed:', refundData);
              refundErrorMsg = refundData.message || 'Dodo Payments Refund API rejected the request.';
            }
          } catch (e: any) {
            console.error('Dodo Refund Request Error:', e);
            refundErrorMsg = e.message || 'Network error connecting to Dodo Payments Refund API.';
          }
        } else {
          refundErrorMsg = 'Dodo Payments API Key or Payment ID not found.';
        }

        if (!refundSuccessful) {
          console.warn(`[REFUND WARNING] Automated Dodo refund skipped/failed: ${refundErrorMsg}. Proceeding with database cancellation.`);
        }
      }
    }

    // Update reservation status and associated payments
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'CANCELED' },
        include: {
          guest: true,
          room: {
            include: {
              resort: true,
              roomType: true
            }
          }
        }
      });

      // Update associated payments status
      const paymentNextStatus = refundPercent === 0 ? 'REFUNDED' : refundPercent === 50 ? 'REFUNDED' : 'REFUNDED';
      await tx.payment.updateMany({
        where: { reservationId },
        data: { status: paymentNextStatus }
      });

      return res;
    });

    // Send Cancellation Email
    try {
      const checkInFormatted = new Date(updated.checkIn).toLocaleDateString();
      const checkOutFormatted = new Date(updated.checkOut).toLocaleDateString();

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; border-radius: 16px; border: 1px solid #f87171; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f87171; font-family: serif; text-align: center; font-size: 26px; letter-spacing: 2px;">BOOKME.COM</h2>
          <p style="text-align: center; color: #a8a29e; font-size: 13px; text-transform: uppercase;">Reservation Canceled & Policy Breakdown</p>
          <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
          
          <p>Dear <strong>${updated.guest.fullName}</strong>,</p>
          <p>Your stay reservation has been successfully <strong>canceled</strong>. Below is the breakdown according to our guest cancellation policy tier:</p>
          
          <div style="background-color: #1c1917; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #292524;">
            <p style="margin: 5px 0;"><strong>Reservation ID:</strong> ${updated.id}</p>
            <p style="margin: 5px 0;"><strong>Resort:</strong> ${updated.room.resort.name} (${updated.room.resort.location})</p>
            <p style="margin: 5px 0;"><strong>Stay Schedule:</strong> ${checkInFormatted} - ${checkOutFormatted}</p>
            <p style="margin: 5px 0; color: #fbbf24;"><strong>Policy Applied:</strong> ${policyLabel}</p>
          </div>

          <div style="background-color: #141414; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; display: flex; justify-content: space-between;"><span>Total Booking Cost:</span> <strong>\$${totalPaid.toFixed(2)}</strong></p>
            <p style="margin: 5px 0; display: flex; justify-content: space-between; color: #f87171;"><span>Cancellation Retention Fee (${100 - refundPercent}%):</span> <strong>-\$${retentionFee.toFixed(2)}</strong></p>
            <hr style="border: 0; border-top: 1px solid #292524; margin: 10px 0;" />
            <p style="margin: 5px 0; display: flex; justify-content: space-between; font-size: 16px; color: #4ade80;"><span>Net Refund Amount (${refundPercent}%):</span> <strong>\$${refundAmount.toFixed(2)}</strong></p>
          </div>

          <p style="font-size: 12px; color: #78716c; text-align: center;">
            Refund processing times vary depending on your card issuer (5-10 business days).
          </p>
        </div>
      `;

      await sendMail({
        to: updated.guest.email,
        subject: `Stay Canceled (${policyLabel}) - bookme.com`,
        html: htmlBody,
      });
    } catch (err) {
      console.error('Failed to send reservation cancellation email:', err);
    }

    return NextResponse.json({
      message: `Reservation canceled. ${policyLabel}. Net Refund: \$${refundAmount.toFixed(2)}`,
      reservation: updated,
      policyTier,
      policyLabel,
      refundPercent,
      totalPaid,
      refundAmount,
      retentionFee,
      daysUntilCheckIn: Math.round(daysUntilCheckIn)
    });
  } catch (error: any) {
    console.error('Cancel Reservation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
