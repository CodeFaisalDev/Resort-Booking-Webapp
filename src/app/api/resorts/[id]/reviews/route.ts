import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reviews = await prisma.review.findMany({
      where: { resortId: id },
      include: {
        guest: {
          select: {
            fullName: true,
            nationality: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt,
        guestName: r.guest.fullName,
        guestNationality: r.guest.nationality
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).type !== 'guest') {
      return NextResponse.json({ error: 'Please sign in as a Guest to post a review.' }, { status: 401 });
    }

    const { id: resortId } = await params;
    const guestId = (session.user as any).id;

    const { rating, title, comment } = await req.json();

    if (!rating || !comment) {
      return NextResponse.json({ error: 'Rating and comment are required.' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5 stars.' }, { status: 400 });
    }

    // Create the review
    const newReview = await prisma.review.create({
      data: {
        resortId,
        guestId,
        rating: numericRating,
        title: title || 'Guest Stay Review',
        comment
      },
      include: {
        guest: {
          select: {
            fullName: true,
            nationality: true
          }
        }
      }
    });

    // Recalculate average rating for resort
    const aggregate = await prisma.review.aggregate({
      where: { resortId },
      _avg: { rating: true }
    });

    const updatedAvg = aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 5.0;

    await prisma.resort.update({
      where: { id: resortId },
      data: { rating: updatedAvg }
    });

    return NextResponse.json({
      message: 'Review posted successfully!',
      review: {
        id: newReview.id,
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
        createdAt: newReview.createdAt,
        guestName: newReview.guest.fullName,
        guestNationality: newReview.guest.nationality
      },
      newResortRating: updatedAvg
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit review.' }, { status: 500 });
  }
}
