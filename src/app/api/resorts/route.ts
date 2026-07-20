import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cache } from '@/lib/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '6');
  const query = searchParams.get('query') || '';
  const type = searchParams.get('type') || 'all';

  const offset = (page - 1) * limit;

  // Build filter options
  const filter: any = {};

  if (query) {
    filter.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { location: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ];
  }

  // Filter based on keywords in location/name
  if (type !== 'all') {
    let keywords: string[] = [];
    if (type === 'tropical') keywords = ['Bali', 'Hawaii', 'Fiji', 'Maldives'];
    else if (type === 'alpine') keywords = ['Alps', 'Aspen', 'Swiss'];
    else if (type === 'coastal') keywords = ['Amalfi', 'Santorini', 'Bahamas'];
    else if (type === 'forest') keywords = ['Kyoto', 'Forest', 'Eco'];

    if (keywords.length > 0) {
      filter.OR = keywords.map(kw => ({
        name: { contains: kw, mode: 'insensitive' }
      }));
    }
  }

  // Unique cache key based on query parameters
  const cacheKey = `resorts:${page}:${limit}:${query}:${type}`;

  try {
    const result = await cache.getOrSet(
      cacheKey,
      async () => {
        const [resorts, total] = await Promise.all([
          prisma.resort.findMany({
            where: filter,
            skip: offset,
            take: limit,
            orderBy: { rating: 'desc' },
            include: {
              rooms: {
                include: {
                  roomType: true
                }
              }
            }
          }),
          prisma.resort.count({ where: filter })
        ]);

        const serializedResorts = resorts.map(resort => ({
          ...resort,
          latitude: Number(resort.latitude),
          longitude: Number(resort.longitude),
          rooms: resort.rooms.map(room => ({
            ...room,
            roomType: {
              ...room.roomType,
              basePrice: Number(room.roomType.basePrice)
            }
          }))
        }));

        return {
          resorts: serializedResorts,
          total,
          page,
          totalPages: Math.ceil(total / limit)
        };
      },
      120 // Cache for 2 minutes — resort data rarely changes
    );

    // Add CDN cache headers for Vercel Edge Network
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching resorts:', error);
    return NextResponse.json({ error: 'Failed to load resorts.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Authorize session (must be admin)
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'staff' || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    // 2. Extract and validate payload parameters
    const { name, description, location, latitude, longitude, images, rating } = await req.json();

    if (!name || !description || !location || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required parameters (name, description, location, latitude, longitude).' }, { status: 400 });
    }

    // 3. Create the new resort record
    const newResort = await prisma.resort.create({
      data: {
        name,
        description,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        images: Array.isArray(images) ? images : [],
        rating: rating !== undefined ? parseFloat(rating) : 5.0
      }
    });

    // 4. Invalidate all stale resort cache entries
    cache.invalidatePrefix('resorts');

    return NextResponse.json({
      message: 'Resort registered successfully.',
      resort: newResort
    });
  } catch (error: any) {
    console.error('Create Resort API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
