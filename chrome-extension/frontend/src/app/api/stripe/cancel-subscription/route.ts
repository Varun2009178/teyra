import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Using shared singleton

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription ID
    const { data: userData, error: userError } = await supabase
      .from('user_progress')
      .select('stripe_subscription_id, is_pro')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userData.is_pro || !userData.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Cancel subscription at period end (user keeps access until end of billing period)
    const subscription = await stripe.subscriptions.update(
      userData.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    console.log(`✅ Subscription ${subscription.id} will cancel at period end:`, new Date(subscription.current_period_end * 1000));

    return NextResponse.json({
      success: true,
      message: 'Subscription will cancel at the end of your billing period',
      cancelAt: new Date(subscription.current_period_end * 1000).toISOString(),
      accessUntil: new Date(subscription.current_period_end * 1000).toLocaleDateString()
    });

  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
