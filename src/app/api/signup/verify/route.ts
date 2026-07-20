import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Missing required parameters (email, code).' }, { status: 400 });
    }

    // Query guest with code and expiry validity check
    const guest = await prisma.guest.findUnique({
      where: { email }
    });

    if (!guest) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    if (guest.isVerified) {
      return NextResponse.json({ error: 'Email is already verified.', alreadyVerified: true }, { status: 400 });
    }

    if (guest.verificationCode !== code) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
    }

    if (guest.verificationExpires && new Date() > new Date(guest.verificationExpires)) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    // Set verified flag and clear codes
    await prisma.guest.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpires: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
