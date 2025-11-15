import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

// Using shared singleton

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      console.error('Stripe secret key missing; cannot verify session');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    const { userId } = await auth();
    const { sessionId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    console.log('🔍 Verifying Stripe session:', sessionId);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('📋 Session status:', session.payment_status, 'Customer:', session.customer);

    // If payment is successful, ensure user is marked as Pro
    if (session.payment_status === 'paid' || session.status === 'complete') {
      // Payment successful, updating database

      // Update user in database
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          is_pro: true,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          pro_since: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('❌ Error updating user to Pro:', error);
        return NextResponse.json({
          success: false,
          error: 'Database update failed'
        }, { status: 500 });
      }

      // User successfully upgraded to Pro

      return NextResponse.json({
        success: true,
        isPro: true,
        message: 'Successfully upgraded to Pro!'
      });
    } else {
      console.log('⚠️ Session payment not completed:', session.payment_status);
      return NextResponse.json({
        success: false,
        isPro: false,
        message: 'Payment not completed'
      });
    }

  } catch (error) {
    console.error('❌ Error verifying session:', error);
    return NextResponse.json(
      { error: 'Error verifying session' },
      { status: 500 }
    );
  }
}
