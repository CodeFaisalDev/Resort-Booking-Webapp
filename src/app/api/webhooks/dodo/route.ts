import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { reservationId, status, method } = await req.json();

    if (!reservationId || !status) {
      return NextResponse.json({ error: 'Missing reservationId or status.' }, { status: 400 });
    }

    // Retrieve reservation details
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        room: {
          include: { roomType: true }
        },
        reservationServices: {
          include: { service: true }
        }
      }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });
    }

    if (status === 'COMPLETED') {
      // 1. Update Reservation status to CONFIRMED
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'CONFIRMED' },
      });

      // 2. Create Payment record
      await prisma.payment.create({
        data: {
          reservationId,
          guestId: reservation.guestId,
          amount: reservation.totalAmount,
          method: method || 'Simulated Card',
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      });

      // 3. Assemble and dispatch Nodemailer HTML receipt email
      const checkInFormatted = new Date(reservation.checkIn).toLocaleDateString();
      const checkOutFormatted = new Date(reservation.checkOut).toLocaleDateString();
      const servicesHtml = reservation.reservationServices.map(rs => 
        `<li>${rs.service.name} (${rs.service.category}): \$${Number(rs.subtotal).toFixed(2)}</li>`
      ).join('');

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; border-radius: 16px; border: 1px solid #78350f; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #fbbf24; font-family: serif; text-align: center; font-size: 28px; letter-spacing: 2px;">LUXURY HORIZON RESORT</h2>
          <p style="text-align: center; color: #a8a29e; font-size: 14px; text-transform: uppercase;">Invoice & Confirmation Receipt</p>
          <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
          
          <p>Dear <strong>${reservation.guest.fullName}</strong>,</p>
          <p>We are delighted to confirm your luxury stay at Luxury Horizon Resort. Below is your detailed reservation invoice:</p>
          
          <div style="background-color: #1c1917; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #292524;">
            <p style="margin: 5px 0;"><strong>Suite Category:</strong> ${reservation.room.roomType.name}</p>
            <p style="margin: 5px 0;"><strong>Assigned Room Number:</strong> ${reservation.room.roomNum} (Floor ${reservation.room.floor})</p>
            <p style="margin: 5px 0;"><strong>Schedule:</strong> ${checkInFormatted} - ${checkOutFormatted}</p>
            <p style="margin: 5px 0;"><strong>Guests Registered:</strong> ${reservation.numGuests}</p>
          </div>

          ${reservation.reservationServices.length > 0 ? `
            <h4 style="color: #fbbf24; margin-bottom: 5px;">Requested Add-On Services:</h4>
            <ul style="padding-left: 20px; margin-top: 0; color: #d6d3d1;">
              ${servicesHtml}
            </ul>
          ` : ''}

          <div style="border-top: 1px solid #292524; padding-top: 15px; margin-top: 25px; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
            <span style="color: #a8a29e;">Grand Total Settlement:</span>
            <span style="color: #fbbf24;">\$${Number(reservation.totalAmount).toFixed(2)}</span>
          </div>

          <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
          <p style="font-size: 12px; color: #78716c; text-align: center;">
            Thank you for choosing Luxury Horizon. Please contact concierge@luxuryhorizon.com for pre-arrival assistance.
          </p>
        </div>
      `;

      // Send to Guest AND TO_EMAIL (Faisal)
      console.log('Sending emails to guest:', reservation.guest.email);
      await sendMail({
        to: reservation.guest.email,
        subject: 'Reservation Confirmed - Luxury Horizon Resort',
        html: htmlBody,
      });

      console.log('Forwarding a copy to TO_EMAIL:', process.env.TO_EMAIL);
      await sendMail({
        to: process.env.TO_EMAIL || 'code.faisal.dev@gmail.com',
        subject: `[Staff Notification] New Reservation Confirmed - ${reservation.guest.fullName}`,
        html: htmlBody,
      });
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
