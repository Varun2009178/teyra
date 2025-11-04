import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserProgress, serviceSupabase } from '@/lib/supabase-service';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

const DAILY_MOOD_CHECK_LIMIT_FREE = 1; // 1 mood check per day for free users
const DAILY_MOOD_CHECK_LIMIT_PRO = 3; // 3 mood checks per day for Pro users

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Pro status DIRECTLY from database - no HTTP call needed!
    const { data: proData } = await serviceSupabase
      .from('user_progress')
      .select('is_pro')
      .eq('user_id', user.id)
      .single();

    const isPro = proData?.is_pro || false;

    const userProgressData = await getUserProgress(user.id);
    const dailyMoodChecks = userProgressData?.daily_mood_checks || 0; // USE SNAKE_CASE - it's the DB column!
    const limit = isPro ? DAILY_MOOD_CHECK_LIMIT_PRO : DAILY_MOOD_CHECK_LIMIT_FREE;

    console.log(`🔍 [MOOD LIMIT CHECK] User ${user.id.slice(-8)}: checks=${dailyMoodChecks}, limit=${limit}, isPro=${isPro}`);

    if (dailyMoodChecks >= limit) {
      console.log(`🚫 [MOOD LIMIT CHECK] BLOCKED - User has used all ${limit} checks`);
      return NextResponse.json({
        success: false,
        message: isPro
          ? `You've used your ${DAILY_MOOD_CHECK_LIMIT_PRO} Pro AI mood tasks for today. Check back tomorrow!`
          : `You've used your daily AI mood task. Upgrade to Pro for ${DAILY_MOOD_CHECK_LIMIT_PRO} mood tasks per day!`,
        canCheckMood: false,
        dailyMoodChecks,
        limit,
        isPro,
        upgradeRequired: !isPro // Only show upgrade prompt for free users
      });
    }

    console.log(`✅ [MOOD LIMIT CHECK] ALLOWED - ${limit - dailyMoodChecks} uses remaining`);
    return NextResponse.json({
      success: true,
      message: 'Mood limit check completed',
      canCheckMood: true,
      dailyMoodChecks,
      limit,
      isPro,
      remaining: limit - dailyMoodChecks
    });
  } catch (error) {
    console.error('Error checking mood limit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 