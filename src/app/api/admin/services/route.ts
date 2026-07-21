import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: {
        staff: {
          select: { fullName: true }
        }
      }
    });

    return NextResponse.json({
      services: services.map(s => ({
        ...s,
        price: Number(s.price),
        staffName: s.staff?.fullName || 'Unassigned'
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { name, category, price, staffId } = await req.json();

    if (!name || !category || price === undefined) {
      return NextResponse.json({ error: 'Name, category, and price are required.' }, { status: 400 });
    }

    const newService = await prisma.service.create({
      data: {
        name,
        category,
        price: Number(price),
        staffId: staffId || null
      }
    });

    return NextResponse.json({
      message: 'Service created successfully!',
      service: {
        ...newService,
        price: Number(newService.price)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing service identifier.' }, { status: 400 });
    }

    await prisma.service.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Service deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
