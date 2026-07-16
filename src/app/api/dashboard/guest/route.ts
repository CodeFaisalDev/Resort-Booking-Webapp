import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'guest') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guestId = (session.user as any).id;

    const reservations = await prisma.reservation.findMany({
      where: { guestId },
      include: {
        room: {
          include: { roomType: true }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ reservations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
