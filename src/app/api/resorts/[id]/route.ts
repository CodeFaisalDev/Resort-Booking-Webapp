import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cache } from '@/lib/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorize session (must be admin)
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'staff' || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const { id } = await params;

    // 2. Query check if resort exists
    const resort = await prisma.resort.findUnique({
      where: { id }
    });

    if (!resort) {
      return NextResponse.json({ error: 'Resort not found.' }, { status: 404 });
    }

    // 3. Extract edit payload
    const { name, description, location, latitude, longitude, images, rating } = await req.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : [];
    if (rating !== undefined) updateData.rating = parseFloat(rating);

    // 4. Update Database
    const updatedResort = await prisma.resort.update({
      where: { id },
      data: updateData
    });

    // 5. Reset stale caches
    cache.invalidatePrefix('resorts');

    return NextResponse.json({
      message: 'Resort updated successfully.',
      resort: updatedResort
    });
  } catch (error: any) {
    console.error('Update Resort API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorize session (must be admin)
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'staff' || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const { id } = await params;

    // 2. Query check if resort exists
    const resort = await prisma.resort.findUnique({
      where: { id }
    });

    if (!resort) {
      return NextResponse.json({ error: 'Resort not found.' }, { status: 404 });
    }

    // 3. Delete from database (Cascade deletes rooms and assignments)
    await prisma.resort.delete({
      where: { id }
    });

    // 4. Reset stale caches
    cache.invalidatePrefix('resorts');

    return NextResponse.json({
      message: 'Resort deleted successfully.'
    });
  } catch (error: any) {
    console.error('Delete Resort API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
