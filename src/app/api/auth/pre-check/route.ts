import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, roleType } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required parameters (email, password).' }, { status: 400 });
    }

    if (roleType === 'STAFF') {
      const staff = await prisma.staff.findUnique({
        where: { email },
      });
      if (!staff || !bcrypt.compareSync(password, staff.password)) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }
      return NextResponse.json({ success: true });
    } else {
      const guest = await prisma.guest.findUnique({
        where: { email },
      });

      if (!guest || !bcrypt.compareSync(password, guest.password)) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }

      // Check if guest email is verified
      if (!guest.isVerified) {
        return NextResponse.json({ 
          error: 'EmailNotVerified', 
          email: guest.email 
        }, { status: 403 });
      }

      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error('Pre-check authentication error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
