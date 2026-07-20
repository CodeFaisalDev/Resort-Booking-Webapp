import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import crypto from 'crypto';

/**
 * Manually verify Svix HMAC-SHA256 signature.
 * Dodo Payments uses Svix under the hood, requiring base64-encoded signatures.
 */
function verifySvixSignature(
  rawBody: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  webhookSecret: string
): boolean {
  try {
    if (!webhookId || !webhookTimestamp || !webhookSignature || !webhookSecret) {
      return false;
    }

    // Svix keys can be prefixed with "whsec_". Strip the prefix and decode the base64 payload.
    let secretKey: Buffer;
    if (webhookSecret.startsWith('whsec_')) {
      secretKey = Buffer.from(webhookSecret.split('_')[1], 'base64');
    } else {
      secretKey = Buffer.from(webhookSecret, 'base64');
    }

    // Construct the signed content
    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;

    // Generate expected HMAC SHA256 base64 digest
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signedContent)
      .digest('base64');

    // Webhook signature header contains space-delimited list of signatures (e.g. "v1,sig1 v1,sig2")
    const signatures = webhookSignature.split(' ').map(s => {
      const parts = s.split(',');
      return parts[1] || parts[0];
    });

    // Check for match
    return signatures.includes(expectedSignature);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // 1. Retrieve the raw body string (required for exact cryptographic signature match)
    const rawBody = await req.text();

    // 2. Fetch webhook headers
    const webhookId = req.headers.get('webhook-id') || '';
    const webhookSignature = req.headers.get('webhook-signature') || '';
    const webhookTimestamp = req.headers.get('webhook-timestamp') || '';
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

    // 3. Perform signature verification (only if secret is configured in env)
    if (webhookSecret) {
      const isVerified = verifySvixSignature(
        rawBody,
        webhookId,
        webhookTimestamp,
        webhookSignature,
        webhookSecret
      );

      if (!isVerified) {
        console.warn('Webhook signature check failed.');
        return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
      }
    } else {
      console.warn(
        'DODO_PAYMENTS_WEBHOOK_SECRET is not configured in .env. Webhook signature verification bypassed (SANDBOX/DEVELOPMENT ONLY).'
      );
    }

    // 4. Parse the verified payload
    const event = JSON.parse(rawBody);
    const eventType = event.event_type || event.type;
    const eventData = event.data;

    if (!eventType || !eventData) {
      return NextResponse.json({ error: 'Malformed webhook payload.' }, { status: 400 });
    }

    console.log(`Received webhook event: ${eventType}`);

    // Retrieve reservation ID from metadata
    const reservationId = eventData.metadata?.reservationId;

    if (!reservationId) {
      console.warn('No reservationId found in event metadata. Skipping processing.');
      return NextResponse.json({ message: 'Webhook ignored: missing reservationId in metadata.' });
    }

    // 5. Query the reservation from DB
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
        reservationServices: {
          include: { service: true }
        }
      }
    });

    if (!reservation) {
      console.error(`Reservation ${reservationId} not found.`);
      return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });
    }

    // 6. Handle successful payment
    if (eventType === 'payment.succeeded') {
      const amountInCents = eventData.total_amount || eventData.amount || Math.round(Number(reservation.totalAmount) * 100);
      const paidAmount = amountInCents / 100;
      const paymentId = eventData.payment_id || 'unknown';

      // Update reservation status to CONFIRMED
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'CONFIRMED' }
      });

      // Create Payment record
      await prisma.payment.create({
        data: {
          reservationId,
          guestId: reservation.guestId,
          amount: paidAmount,
          method: `Dodo Payments (ID: ${paymentId})`,
          status: 'COMPLETED',
          paidAt: new Date()
        }
      });

      // Assemble confirmation email
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
            <p style="margin: 5px 0;"><strong>Resort Location:</strong> ${reservation.room.resort.name} (${reservation.room.resort.location})</p>
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
            <span style="color: #a8a29e;">Grand Total Paid:</span>
            <span style="color: #fbbf24;">\$${paidAmount.toFixed(2)}</span>
          </div>

          <hr style="border: 0; border-top: 1px solid #292524; margin: 30px 0;" />
          <p style="font-size: 12px; color: #78716c; text-align: center;">
            Thank you for choosing Luxury Horizon. Please contact concierge@luxuryhorizon.com for pre-arrival assistance.
          </p>
        </div>
      `;

      // Dispatch Nodemailer emails
      console.log('Sending receipt email to guest:', reservation.guest.email);
      await sendMail({
        to: reservation.guest.email,
        subject: 'Reservation Confirmed - Luxury Horizon Resort',
        html: htmlBody,
      });

      const staffEmail = process.env.TO_EMAIL || 'code.faisal.dev@gmail.com';
      console.log('Forwarding confirmation copy to staff:', staffEmail);
      await sendMail({
        to: staffEmail,
        subject: `[Staff Notification] New Reservation Confirmed - ${reservation.guest.fullName}`,
        html: htmlBody,
      });

      console.log('Reservation payment processed successfully.');
    }

    // 7. Handle successful refund
    else if (eventType === 'refund.succeeded') {
      // Update reservation status to CANCELED
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'CANCELED' }
      });

      // Update associated payments to REFUNDED
      await prisma.payment.updateMany({
        where: { reservationId },
        data: { status: 'REFUNDED' }
      });

      console.log(`Reservation ${reservationId} marked canceled and refunded via webhook.`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
