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
          <h2 style="color: #fbbf24; font-family: serif; text-align: center; font-size: 26px; letter-spacing: 2px;">LUXURY HORIZON RESORT</h2>
          <p style="text-align: center; color: #a8a29e; font-size: 13px; text-transform: uppercase;">Provisional Stay Reservation</p>
          <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
          
          <p>Dear <strong>${reservation.guest.fullName}</strong>,</p>
          <p>Your stay stay at Luxury Horizon Resort has been provisionally reserved. Please complete your payment details using the checkout link below to guarantee your accommodation.</p>
          
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
        subject: 'Stay Reservation Pending - Luxury Horizon Resort',
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

    // Retrieve completed payments
    const completedPayment = reservation.payments.find(p => p.status === 'COMPLETED');
    let refundSuccessful = false;
    let refundErrorMsg = '';

    if (reservation.status === 'CONFIRMED') {
      if (completedPayment) {
        // Extract payment ID from `method` string: e.g. "Dodo Payments (ID: pay_abc123)"
        let dodoPaymentId = '';
        if (completedPayment.method.includes('ID: ')) {
          dodoPaymentId = completedPayment.method.split('ID: ')[1].replace(')', '').trim();
        }

        if (dodoPaymentId && process.env.DODO_PAYMENTS_API_KEY) {
          try {
            const amountInCents = Math.round(Number(reservation.totalAmount) * 100);
            const refundRes = await fetch('https://test.dodopayments.com/refunds', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY.trim()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                payment_id: dodoPaymentId,
                amount: amountInCents,
                reason: 'Customer requested cancellation'
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
          return NextResponse.json({ 
            error: `Unable to process automated refund via Dodo Payments: ${refundErrorMsg}. Please contact support.` 
          }, { status: 500 });
        }
      } else {
        // If it's a seed or bypass booking without payment, allow cancellation anyway
        console.warn('Canceled reservation marked CONFIRMED but no COMPLETED payment record was found in DB.');
      }
    }

    // Update reservation status and associated payments to REFUNDED
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

      // Update associated payments to REFUNDED
      await tx.payment.updateMany({
        where: { reservationId },
        data: { status: 'REFUNDED' }
      });

      return res;
    });

    // Send Cancellation Email
    try {
      const checkInFormatted = new Date(updated.checkIn).toLocaleDateString();
      const checkOutFormatted = new Date(updated.checkOut).toLocaleDateString();

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; border-radius: 16px; border: 1px solid #f87171; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f87171; font-family: serif; text-align: center; font-size: 26px; letter-spacing: 2px;">LUXURY HORIZON RESORT</h2>
          <p style="text-align: center; color: #a8a29e; font-size: 13px; text-transform: uppercase;">Reservation Canceled & Refund Confirmation</p>
          <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
          
          <p>Dear <strong>${updated.guest.fullName}</strong>,</p>
          <p>We are writing to confirm that your stay reservation has been successfully **canceled**. Any payments made have been flagged for refund processing back to your original source card.</p>
          
          <div style="background-color: #1c1917; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #292524;">
            <p style="margin: 5px 0;"><strong>Reservation ID:</strong> ${updated.id}</p>
            <p style="margin: 5px 0;"><strong>Resort:</strong> ${updated.room.resort.name} (${updated.room.resort.location})</p>
            <p style="margin: 5px 0;"><strong>Suite Category:</strong> ${updated.room.roomType.name}</p>
            <p style="margin: 5px 0;"><strong>Stay Schedule:</strong> ${checkInFormatted} - ${checkOutFormatted}</p>
          </div>

          <div style="border-top: 1px solid #292524; padding-top: 15px; margin-top: 25px; display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
            <span style="color: #a8a29e;">Amount Refunded:</span>
            <span style="color: #f87171;">\$${Number(updated.totalAmount).toFixed(2)}</span>
          </div>

          <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
          <p style="font-size: 12px; color: #78716c; text-align: center;">
            Refund processing times can vary depending on your bank (usually 5-10 business days). If you have questions, please reach out to reservations@luxuryhorizon.com.
          </p>
        </div>
      `;

      await sendMail({
        to: updated.guest.email,
        subject: 'Stay Canceled & Refunded - Luxury Horizon Resort',
        html: htmlBody,
      });

      const staffEmail = process.env.TO_EMAIL || 'code.faisal.dev@gmail.com';
      await sendMail({
        to: staffEmail,
        subject: `[Staff Notification] Stay CANCELED & Refunded - ${updated.guest.fullName}`,
        html: htmlBody,
      });
    } catch (err) {
      console.error('Failed to send reservation cancellation email:', err);
    }

    return NextResponse.json({
      message: 'Reservation canceled and refunded successfully.',
      reservation: updated
    });
  } catch (error: any) {
    console.error('Cancel Reservation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
