import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required.' }, { status: 400 });
    }

    const guest = await prisma.guest.findUnique({
      where: { email }
    });

    if (!guest) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    if (guest.isVerified) {
      return NextResponse.json({ error: 'Email is already verified.' }, { status: 400 });
    }

    // Generate new 6-digit code and 15-minute expiry
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Save changes
    await prisma.guest.update({
      where: { email },
      data: {
        verificationCode: newCode,
        verificationExpires: newExpires
      }
    });

    // Send email with new code
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; border-radius: 16px; border: 1px solid #78350f; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #fbbf24; font-family: serif; text-align: center; font-size: 24px; letter-spacing: 2px;">LUXURY HORIZON RESORT</h2>
        <p style="text-align: center; color: #a8a29e; font-size: 12px; text-transform: uppercase;">Email Verification Portal</p>
        <hr style="border: 0; border-top: 1px solid #292524; margin: 25px 0;" />
        
        <p style="font-size: 14px; line-height: 1.6;">Dear <strong>${guest.fullName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">Here is your newly generated email verification code to activate your account:</p>
        
        <div style="background-color: #1c1917; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0; border: 1px solid #78350f;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #fbbf24;">${newCode}</span>
        </div>
        
        <p style="font-size: 11px; color: #a8a29e; text-align: center;">
          This code will expire in 15 minutes.
        </p>
      </div>
    `;

    console.log(`Resending verification email to: ${email}`);
    await sendMail({
      to: email,
      subject: "New Verification Code - Luxury Horizon Resort",
      html: htmlBody
    });

    return NextResponse.json({
      success: true,
      message: 'A new verification code has been dispatched to your email.'
    });
  } catch (error: any) {
    console.error('Resend verification code error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
