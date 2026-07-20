import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

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
      include: { 
        guest: true,
        room: { 
          include: { 
            roomType: true,
            resort: true
          } 
        }, 
        payments: true 
      }
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

      // Send Welcome/Check-in Email
      try {
        const checkInFormatted = new Date(reservation.checkIn).toLocaleDateString();
        const checkOutFormatted = new Date(reservation.checkOut).toLocaleDateString();

        const htmlBody = `
          <div style="font-family: Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; border-radius: 16px; border: 1px solid #fbbf24; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #fbbf24; font-family: serif; text-align: center; font-size: 26px; letter-spacing: 2px;">LUXURY HORIZON RESORT</h2>
            <p style="text-align: center; color: #a8a29e; font-size: 13px; text-transform: uppercase;">Check-in Confirmed & Welcome</p>
            <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
            
            <p>Dear <strong>${reservation.guest.fullName}</strong>,</p>
            <p>Welcome to **${reservation.room.resort.name}**! We are pleased to confirm that you have been checked in. Your stay with us is now active.</p>
            
            <div style="background-color: #1c1917; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #292524;">
              <p style="margin: 5px 0;"><strong>Room Allocated:</strong> Suite ${reservation.room.roomNum} (${reservation.room.roomType.name})</p>
              <p style="margin: 5px 0;"><strong>Floor:</strong> ${reservation.room.floor}</p>
              <p style="margin: 5px 0;"><strong>Stay Schedule:</strong> ${checkInFormatted} - ${checkOutFormatted}</p>
            </div>

            <p>If you require in-room dining, room cleaning, or customized experiences, please reach out to the front desk or use your dashboard services panel.</p>

            <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
            <p style="font-size: 12px; color: #78716c; text-align: center;">
              Enjoy your stay at Luxury Horizon Resort.
            </p>
          </div>
        `;

        await sendMail({
          to: reservation.guest.email,
          subject: 'Check-In Confirmed - Welcome to Luxury Horizon',
          html: htmlBody,
        });

        const staffEmail = process.env.TO_EMAIL || 'code.faisal.dev@gmail.com';
        await sendMail({
          to: staffEmail,
          subject: `[Staff Notification] Check-In Registered - ${reservation.guest.fullName} (Room ${reservation.room.roomNum})`,
          html: htmlBody,
        });
      } catch (err) {
        console.error('Failed to send check-in email:', err);
      }

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

      // Send Checkout Email
      try {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; border-radius: 16px; border: 1px solid #78716c; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #fbbf24; font-family: serif; text-align: center; font-size: 26px; letter-spacing: 2px;">LUXURY HORIZON RESORT</h2>
            <p style="text-align: center; color: #a8a29e; font-size: 13px; text-transform: uppercase;">Check-out Complete</p>
            <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
            
            <p>Dear <strong>${reservation.guest.fullName}</strong>,</p>
            <p>Thank you for choosing to stay with us at **${reservation.room.resort.name}**. Your checkout is complete, and your room has been successfully released.</p>
            
            <p>We hope you had an extraordinary stay. We wish you safe travels on your journey home and look forward to welcoming you back to our resorts soon.</p>

            <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
            <p style="font-size: 12px; color: #78716c; text-align: center;">
              Concierge services: concierge@luxuryhorizon.com. We hope to see you again soon.
            </p>
          </div>
        `;

        await sendMail({
          to: reservation.guest.email,
          subject: 'Thank You for Staying at Luxury Horizon - Checkout Complete',
          html: htmlBody,
        });

        const staffEmail = process.env.TO_EMAIL || 'code.faisal.dev@gmail.com';
        await sendMail({
          to: staffEmail,
          subject: `[Staff Notification] Checkout Completed - ${reservation.guest.fullName} (Room ${reservation.room.roomNum})`,
          html: htmlBody,
        });
      } catch (err) {
        console.error('Failed to send checkout email:', err);
      }

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

      // Process Dodo Payments partial refund
      const completedPayment = reservation.payments.find(p => p.status === 'COMPLETED');
      let refundSuccessful = false;
      let refundErrorMsg = '';

      if (completedPayment) {
        // Extract payment ID from `method` string: e.g. "Dodo Payments (ID: pay_abc123)"
        let dodoPaymentId = '';
        if (completedPayment.method.includes('ID: ')) {
          dodoPaymentId = completedPayment.method.split('ID: ')[1].replace(')', '').trim();
        }

        if (dodoPaymentId && process.env.DODO_PAYMENTS_API_KEY) {
          try {
            const refundAmountCents = Math.round(refundAmount * 100);
            const refundRes = await fetch('https://test.dodopayments.com/refunds', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY.trim()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                payment_id: dodoPaymentId,
                amount: refundAmountCents,
                reason: 'Mid-stay duration truncation refund'
              })
            });

            const refundData = await refundRes.json();
            if (refundRes.ok) {
              refundSuccessful = true;
            } else {
              console.error('Dodo Mid-stay Refund Failed:', refundData);
              refundErrorMsg = refundData.message || 'Dodo Payments Refund API rejected the request.';
            }
          } catch (e: any) {
            console.error('Dodo Mid-stay Refund Request Error:', e);
            refundErrorMsg = e.message || 'Network error connecting to Dodo Payments Refund API.';
          }
        } else {
          refundErrorMsg = 'Dodo Payments API Key or Payment ID not found.';
        }

        if (!refundSuccessful) {
          return NextResponse.json({ 
            error: `Unable to process automated mid-stay refund via Dodo Payments: ${refundErrorMsg}` 
          }, { status: 500 });
        }
      } else {
        console.warn('Mid-stay cancel requested but no COMPLETED payment record was found in DB.');
      }

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

      // Send Prorated Refund Email
      try {
        const checkInFormatted = new Date(reservation.checkIn).toLocaleDateString();
        const checkOutFormatted = new Date(newCheckOutDate).toLocaleDateString();

        const htmlBody = `
          <div style="font-family: Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; border-radius: 16px; border: 1px solid #f87171; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #fbbf24; font-family: serif; text-align: center; font-size: 26px; letter-spacing: 2px;">LUXURY HORIZON RESORT</h2>
            <p style="text-align: center; color: #a8a29e; font-size: 13px; text-transform: uppercase;">Prorated Stay & Refund Confirmation</p>
            <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
            
            <p>Dear <strong>${reservation.guest.fullName}</strong>,</p>
            <p>An administrator has updated your stay duration at **${reservation.room.resort.name}**. Your stay has been truncated, and a prorated refund has been issued.</p>
            
            <div style="background-color: #1c1917; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #292524;">
              <p style="margin: 5px 0;"><strong>Active Nights Stayed:</strong> ${nightsStayed} Night${nightsStayed > 1 ? 's' : ''}</p>
              <p style="margin: 5px 0;"><strong>Nights Refunded:</strong> ${remainingNights} Night${remainingNights > 1 ? 's' : ''}</p>
              <p style="margin: 5px 0;"><strong>Updated Schedule:</strong> ${checkInFormatted} - ${checkOutFormatted}</p>
              <p style="margin: 5px 0;"><strong>Stay Cost Charged:</strong> \$${proratedTotal.toFixed(2)}</p>
            </div>

            <div style="border-top: 1px solid #292524; padding-top: 15px; margin-top: 25px; display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
              <span style="color: #a8a29e;">Amount Refunded:</span>
              <span style="color: #f87171;">\$${refundAmount.toFixed(2)}</span>
            </div>

            <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
            <p style="font-size: 12px; color: #78716c; text-align: center;">
              Refunds typically take 5-10 business days. For concierge assistance, email concierge@luxuryhorizon.com.
            </p>
          </div>
        `;

        await sendMail({
          to: reservation.guest.email,
          subject: 'Stay Duration Truncated & Refunded - Luxury Horizon Resort',
          html: htmlBody,
        });

        const staffEmail = process.env.TO_EMAIL || 'code.faisal.dev@gmail.com';
        await sendMail({
          to: staffEmail,
          subject: `[Staff Notification] Stay Truncated & Refund Issued - ${reservation.guest.fullName}`,
          html: htmlBody,
        });
      } catch (err) {
        console.error('Failed to send mid-stay cancel email:', err);
      }

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
