import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user is Guest or Staff
    let userType: 'guest' | 'staff' | null = null;
    let targetUser: any = await prisma.guest.findUnique({ where: { email: cleanEmail } });

    if (targetUser) {
      userType = 'guest';
    } else {
      targetUser = await prisma.staff.findUnique({ where: { email: cleanEmail } });
      if (targetUser) {
        userType = 'staff';
      }
    }

    if (!targetUser || !userType) {
      return NextResponse.json({ error: 'No registered account found with that email address.' }, { status: 404 });
    }

    // Generate 6-digit reset code and 15-minute expiry
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Save reset code to DB
    if (userType === 'guest') {
      await prisma.guest.update({
        where: { id: targetUser.id },
        data: { resetCode, resetExpires }
      });
    } else {
      await prisma.staff.update({
        where: { id: targetUser.id },
        data: { resetCode, resetExpires }
      });
    }

    // Send password reset email
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; padding: 40px; border-radius: 16px; border: 1px solid #78350f; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #fbbf24; font-family: serif; text-align: center; font-size: 24px; letter-spacing: 2px;">LUXURY HORIZON RESORT</h2>
        <p style="text-align: center; color: #a8a29e; font-size: 12px; text-transform: uppercase;">Password Reset Request</p>
        <hr style="border: 0; border-top: 1px solid #292524; margin: 25px 0;" />
        
        <p style="font-size: 14px; line-height: 1.6;">Dear <strong>${targetUser.fullName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">We received a request to reset your password. Please enter the following 6-digit verification code to proceed:</p>
        
        <div style="background-color: #1c1917; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0; border: 1px solid #78350f;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #fbbf24;">${resetCode}</span>
        </div>
        
        <p style="font-size: 11px; color: #a8a29e; text-align: center;">
          This security code will expire in 15 minutes. If you did not request a password reset, please ignore this message.
        </p>
      </div>
    `;

    console.log(`Sending password reset code to: ${cleanEmail}`);
    await sendMail({
      to: cleanEmail,
      subject: 'Password Reset Code - Luxury Horizon Resort',
      html: htmlBody
    });

    return NextResponse.json({
      message: 'Password reset code dispatched to your email.',
      email: cleanEmail
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
