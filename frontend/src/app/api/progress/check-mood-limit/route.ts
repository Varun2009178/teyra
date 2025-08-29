import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserProgress } from '@/lib/supabase-service';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

const DAILY_MOOD_CHECK_LIMIT = 5; // Allow 5 mood checks per day

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProgressData = await getUserProgress(user.id);
    const dailyMoodChecks = userProgressData?.dailyMoodChecks || 0;
    
    if (dailyMoodChecks >= DAILY_MOOD_CHECK_LIMIT) {
      return NextResponse.json({ 
        success: false, 
        message: `You've completed ${DAILY_MOOD_CHECK_LIMIT} mood checks today. That's enough self-reflection for now!`,
        canCheckMood: false,
        dailyMoodChecks,
        limit: DAILY_MOOD_CHECK_LIMIT
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mood limit check completed',
      canCheckMood: true,
      dailyMoodChecks,
      limit: DAILY_MOOD_CHECK_LIMIT,
      remaining: DAILY_MOOD_CHECK_LIMIT - dailyMoodChecks
    });
  } catch (error) {
    console.error('Error checking mood limit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 