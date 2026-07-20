import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Retrieve reservation details
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        room: {
          include: { roomType: true }
        }
      }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });
    }

    if (reservation.status === 'CONFIRMED') {
      return NextResponse.json({ error: 'This reservation is already paid and confirmed.' }, { status: 400 });
    }

    if (reservation.status === 'CANCELED') {
      return NextResponse.json({ error: 'This reservation has been canceled.' }, { status: 400 });
    }

    // 2. Extract and validate billing parameter details
    const body = await req.json().catch(() => ({}));
    const { billingAddress, billingCity, billingState, billingZip, billingCountry } = body;

    if (!billingAddress || !billingCity || !billingState || !billingZip || !billingCountry) {
      return NextResponse.json({ error: 'Missing billing details. Please complete the address form.' }, { status: 400 });
    }

    // Update billing details on reservation record
    await prisma.reservation.update({
      where: { id },
      data: {
        billingAddress,
        billingCity,
        billingState,
        billingZip,
        billingCountry
      }
    });

    // 3. Fetch credentials from environment
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const productId = process.env.DODO_PRODUCT_ID;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Dodo Payments API Key is not configured. Please add DODO_PAYMENTS_API_KEY to your env variables.' 
      }, { status: 500 });
    }

    if (!productId) {
      return NextResponse.json({ 
        error: 'Dodo Product ID is not configured. Please create a "Pay What You Want" product in the Dodo Payments dashboard and add DODO_PRODUCT_ID to your env variables.' 
      }, { status: 500 });
    }

    // 3. Translate total dynamic price to cents (integer)
    const amountInCents = Math.round(Number(reservation.totalAmount) * 100);

    if (isNaN(amountInCents) || amountInCents <= 0) {
      return NextResponse.json({ error: 'Invalid reservation amount.' }, { status: 400 });
    }

    // 4. Construct payload for Dodo Payments hosted checkout session
    const returnUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/checkout/${reservation.id}?success=true`;
    
    const dodoPayload = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
          amount: amountInCents, // Dynamically sets the dynamic website price in cents
        }
      ],
      customer: {
        email: reservation.guest.email,
        name: reservation.guest.fullName
      },
      return_url: returnUrl,
      metadata: {
        reservationId: reservation.id
      }
    };

    // 5. Send POST request to Dodo Payments checkout sessions
    // Using test environment since we are in sandbox/test mode
    const response = await fetch('https://test.dodopayments.com/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dodoPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Dodo Payments API Error:', data);
      return NextResponse.json({ 
        error: data.message || data.error || 'Failed to initialize Dodo checkout session.' 
      }, { status: response.status });
    }

    // Return the checkout URL to redirect the guest
    return NextResponse.json({ checkout_url: data.checkout_url });
  } catch (error: any) {
    console.error('Checkout Session API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
