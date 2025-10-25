import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/user/pro-status - Check if user has Pro subscription
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ isPro: false }, { status: 401 });
    }

    // Get user's Pro status from database
    const { data: userData, error } = await supabase
      .from('user_progress')
      .select('is_pro')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user Pro status:', error);
      return NextResponse.json({ isPro: false }, { status: 200 });
    }

    return NextResponse.json({
      isPro: userData?.is_pro || false
    });

  } catch (error) {
    console.error('Error in Pro status check:', error);
    return NextResponse.json({ isPro: false }, { status: 500 });
  }
}
