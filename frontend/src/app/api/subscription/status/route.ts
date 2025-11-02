import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';
import Stripe from 'stripe';

// Using shared singleton

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription status from database
    const { data, error } = await supabase
      .from('user_progress')
      .select('is_pro, pro_since, stripe_subscription_id')
      .eq('user_id', userId)
      .maybeSingle(); // Allow null response if user doesn't exist

    // If user doesn't exist, create them with free tier
    if (!data) {
      console.log('Creating new user_progress row for user:', userId);
      const { error: createError } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          is_pro: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createError) {
        console.error('Error creating user_progress:', createError);
      }

      return NextResponse.json({ isPro: false, cancelAtPeriodEnd: false });
    }

    if (error) {
      console.error('Error fetching subscription status:', error);
      return NextResponse.json({ isPro: false, cancelAtPeriodEnd: false });
    }

    // If user has a subscription, check if it's set to cancel
    let cancelAtPeriodEnd = false;
    let periodEnd = null;

    if (data?.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(data.stripe_subscription_id);
        cancelAtPeriodEnd = subscription.cancel_at_period_end;
        periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError);
      }
    }

    return NextResponse.json({
      isPro: data?.is_pro || false,
      proSince: data?.pro_since,
      subscriptionId: data?.stripe_subscription_id,
      cancelAtPeriodEnd,
      periodEnd,
    });
  } catch (error) {
    console.error('Error in subscription status:', error);
    return NextResponse.json({ isPro: false, cancelAtPeriodEnd: false });
  }
}
