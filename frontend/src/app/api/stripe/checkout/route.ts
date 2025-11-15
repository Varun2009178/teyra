import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      console.error('Stripe secret key missing; cannot create checkout session');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get referral code from request body
    const body = await req.json().catch(() => ({}));
    const referralCode = body.referralCode || null;

    // Create metadata object
    const metadata: { userId: string; referralCode?: string } = {
      userId,
    };

    // Add referral code if present
    if (referralCode) {
      metadata.referralCode = referralCode;
      console.log('🎯 Creating checkout with referral code:', referralCode);
    }

    // Determine base URL based on environment
    // Use localhost for development/sandbox, production URL otherwise
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment
      ? (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
      : process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL must be configured in production' },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Stripe redirect URLs using base:', baseUrl, '(development:', isDevelopment, ')');
    }

    // Create Stripe checkout session
    // Use dedicated callback route to handle auth properly
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!, // Your Stripe Price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/api/stripe/callback?pro_welcome=true&session_id={CHECKOUT_SESSION_ID}&upgrade=success`,
      cancel_url: `${baseUrl}/api/stripe/callback?upgrade=cancelled`,
      metadata,
      client_reference_id: userId,
      // Enable test clock for easier testing
      allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}
