import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

// Using shared singleton

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription in database
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Check user_progress
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('is_pro')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      userId: user.id,
      subscription: subData,
      subscriptionError: subError?.message,
      userProgressIsPro: progressData?.is_pro,
      rawData: {
        subscription: subData,
        progress: progressData
      }
    });
  } catch (error) {
    console.error('Error checking Pro status:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
