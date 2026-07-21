import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'guest') {
      return NextResponse.json({ error: 'Unauthorized. Guest login required.' }, { status: 401 });
    }

    const guestId = (session.user as any).id;
    const { fullName, phone, nationality, idProofNum, password } = await req.json();

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (nationality) updateData.nationality = nationality;
    if (idProofNum) updateData.idProofNum = idProofNum;
    if (password && password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        nationality: true,
        idProofNum: true,
        isVerified: true
      }
    });

    return NextResponse.json({
      message: 'Profile updated successfully!',
      guest: updatedGuest
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update profile.' }, { status: 500 });
  }
}
