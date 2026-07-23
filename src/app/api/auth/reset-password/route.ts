import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[@$!%*?&]/.test(password)) {
    return 'Password must contain at least one special character (@$!%*?&).';
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, reset code, and new password are required.' }, { status: 400 });
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      return NextResponse.json({ error: pwdError }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user is Guest or Staff
    let guest = await prisma.guest.findUnique({ where: { email: cleanEmail } });
    let staff = null;

    if (!guest) {
      staff = await prisma.staff.findUnique({ where: { email: cleanEmail } });
    }

    if (!guest && !staff) {
      return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 });
    }

    const targetUser = guest || staff;
    const isGuest = !!guest;

    if (!targetUser?.resetCode || targetUser.resetCode !== code.trim()) {
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 400 });
    }

    if (!targetUser.resetExpires || new Date() > new Date(targetUser.resetExpires)) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (isGuest) {
      await prisma.guest.update({
        where: { id: guest!.id },
        data: {
          password: hashedPassword,
          isVerified: true, // Resetting password verifies email automatically
          resetCode: null,
          resetExpires: null
        }
      });
    } else {
      await prisma.staff.update({
        where: { id: staff!.id },
        data: {
          password: hashedPassword,
          resetCode: null,
          resetExpires: null
        }
      });
    }

    return NextResponse.json({
      message: 'Your password has been updated successfully. You can now sign in with your new password.'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
