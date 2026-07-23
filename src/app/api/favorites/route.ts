import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const db = prisma as any;

// GET /api/favorites - Fetch all favorited resort IDs for current guest
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const guestId = (session?.user as any)?.id;

    if (!session || (session?.user as any)?.type !== 'guest' || !guestId) {
      return NextResponse.json({ favoriteIds: [], favorites: [] });
    }

    const favorites = await db.favorite.findMany({
      where: { guestId },
      include: {
        resort: {
          include: {
            rooms: {
              include: { roomType: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const favoriteIds = favorites.map((f: any) => f.resortId);
    return NextResponse.json({ favoriteIds, favorites });
  } catch (error: any) {
    console.error('GET /api/favorites error:', error);
    return NextResponse.json({ favoriteIds: [], favorites: [] });
  }
}

// POST /api/favorites - Toggle favorite status for a resort
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = (session?.user as any)?.id;

    if (!session || (session?.user as any)?.type !== 'guest' || !guestId) {
      return NextResponse.json(
        { error: 'Please sign in to save resorts to your favorites.', loginRequired: true },
        { status: 401 }
      );
    }

    const { resortId } = await req.json();

    if (!resortId) {
      return NextResponse.json({ error: 'Resort ID is required.' }, { status: 400 });
    }

    // Check if favorite relation already exists
    const existing = await db.favorite.findUnique({
      where: {
        guestId_resortId: {
          guestId,
          resortId
        }
      }
    });

    let favorited = false;
    if (existing) {
      // Remove from favorites
      await db.favorite.delete({
        where: { id: existing.id }
      });
      favorited = false;
    } else {
      // Add to favorites
      await db.favorite.create({
        data: {
          guestId,
          resortId
        }
      });
      favorited = true;
    }

    // Return updated list of favorite IDs
    const currentFavorites = await db.favorite.findMany({
      where: { guestId },
      select: { resortId: true }
    });

    const favoriteIds = currentFavorites.map((f: any) => f.resortId);

    return NextResponse.json({
      favorited,
      favoriteIds,
      message: favorited ? 'Added to your favorites' : 'Removed from your favorites'
    });
  } catch (error: any) {
    console.error('POST /api/favorites error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update favorites' }, { status: 400 });
  }
}
