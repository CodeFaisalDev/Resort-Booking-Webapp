import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const resort = await prisma.resort.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            roomType: true
          }
        },
        reviews: {
          include: {
            guest: {
              select: {
                fullName: true,
                nationality: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!resort) {
      return NextResponse.json({ error: 'Resort not found.' }, { status: 404 });
    }

    const services = await prisma.service.findMany();

    const serializedResort = {
      ...resort,
      rooms: resort.rooms.map(room => ({
        ...room,
        roomType: {
          ...room.roomType,
          basePrice: Number(room.roomType.basePrice)
        }
      })),
      reviews: resort.reviews.map(rev => ({
        id: rev.id,
        rating: rev.rating,
        title: rev.title,
        comment: rev.comment,
        createdAt: rev.createdAt,
        guestName: rev.guest.fullName,
        guestNationality: rev.guest.nationality
      }))
    };

    const serializedServices = services.map(s => ({
      ...s,
      price: Number(s.price)
    }));

    return NextResponse.json({
      resort: serializedResort,
      services: serializedServices
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch resort details.' }, { status: 500 });
  }
}
