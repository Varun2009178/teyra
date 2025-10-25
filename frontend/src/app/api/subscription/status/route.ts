import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

      return NextResponse.json({ isPro: false });
    }

    if (error) {
      console.error('Error fetching subscription status:', error);
      return NextResponse.json({ isPro: false });
    }

    return NextResponse.json({
      isPro: data?.is_pro || false,
      proSince: data?.pro_since,
      subscriptionId: data?.stripe_subscription_id,
    });
  } catch (error) {
    console.error('Error in subscription status:', error);
    return NextResponse.json({ isPro: false });
  }
}
