import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

// Using shared singleton

// POST /api/extension/ai-limit - Check if user can make AI request
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ allowed: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Pro status
    const { data: userData, error: userError } = await supabase
      .from('user_progress')
      .select('is_pro')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ allowed: false, error: 'User not found' }, { status: 404 });
    }

    // Pro users have UNLIMITED (limited time promotion)
    if (userData?.is_pro) {
      // Log this request (for analytics, but no limit enforcement)
      await supabase
        .from('ai_request_log')
        .insert({
          user_id: userId,
          created_at: new Date().toISOString()
        });

      // Count this month's requests for display purposes only
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthRequests } = await supabase
        .from('ai_request_log')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      const monthRequestCount = monthRequests?.length || 0;

      return NextResponse.json({
        allowed: true,
        isPro: true,
        remaining: 999999, // Unlimited
        limit: 999999, // Display as unlimited
        used: monthRequestCount,
        unlimited: true
      });
    }

    // Free users: check daily limit (5 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Check how many AI requests today
    const { data: requests, error: requestError } = await supabase
      .from('ai_request_log')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', todayISO);

    if (requestError && requestError.code !== 'PGRST116') {
      console.error('Error fetching requests:', requestError);
      return NextResponse.json({ allowed: false, error: 'Database error' }, { status: 500 });
    }

    const requestCount = requests?.length || 0;
    const DAILY_LIMIT = 5;

    if (requestCount >= DAILY_LIMIT) {
      return NextResponse.json({
        allowed: false,
        isPro: false,
        remaining: 0,
        limit: DAILY_LIMIT,
        message: 'You have reached your daily limit (5/5 today)'
      });
    }

    // Log this request
    await supabase
      .from('ai_request_log')
      .insert({
        user_id: userId,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      allowed: true,
      isPro: false,
      remaining: DAILY_LIMIT - requestCount - 1,
      limit: DAILY_LIMIT
    });

  } catch (error) {
    console.error('Error in AI limit check:', error);
    return NextResponse.json({ allowed: false, error: 'Server error' }, { status: 500 });
  }
}

// GET /api/extension/ai-limit - Check remaining requests without consuming one
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Pro status
    const { data: userData } = await supabase
      .from('user_progress')
      .select('is_pro')
      .eq('user_id', userId)
      .single();

    if (userData?.is_pro) {
      // Count this month's requests for display only
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthRequests } = await supabase
        .from('ai_request_log')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      const monthRequestCount = monthRequests?.length || 0;

      return NextResponse.json({
        isPro: true,
        remaining: 999999, // Unlimited
        limit: 999999,
        used: monthRequestCount,
        unlimited: true
      });
    }

    // Count today's requests
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: requests } = await supabase
      .from('ai_request_log')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    const requestCount = requests?.length || 0;
    const DAILY_LIMIT = 5;

    return NextResponse.json({
      isPro: false,
      remaining: Math.max(0, DAILY_LIMIT - requestCount),
      limit: DAILY_LIMIT,
      used: requestCount
    });

  } catch (error) {
    console.error('Error checking AI limit:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
