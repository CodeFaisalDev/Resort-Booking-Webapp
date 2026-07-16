import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const roomTypes = await prisma.roomType.findMany();
    const services = await prisma.service.findMany();
    return NextResponse.json({ roomTypes, services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
