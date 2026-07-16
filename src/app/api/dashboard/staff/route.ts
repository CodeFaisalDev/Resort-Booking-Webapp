import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'staff') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffId = (session.user as any).id;

    const assignments = await prisma.roomAssignment.findMany({
      where: { staffId },
      include: {
        room: {
          include: { roomType: true }
        },
        reservation: {
          include: { guest: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
