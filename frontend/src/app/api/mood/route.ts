import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserProgress, updateUserMood } from '@/lib/supabase-service';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Using shared singleton

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProgressData = await getUserProgress(user.id);
    const mood = userProgressData?.currentMood || 'neutral';

    return NextResponse.json({ mood });
  } catch (error) {
    console.error('Error getting mood:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mood } = await request.json();

    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    console.log(`🎭 [MOOD API] User ${user.id.slice(-8)} selecting mood: ${mood}`);

    // Update the mood first
    const updatedProgress = await updateUserMood(user.id, mood);
    console.log(`✅ [MOOD API] Mood updated to: ${mood}`);

    // Read current count
    const { data: current, error: readError } = await supabase
      .from('user_progress')
      .select('daily_mood_checks')
      .eq('user_id', user.id)
      .single();

    if (readError) {
      console.error(`❌ [MOOD API] Failed to read counter:`, readError);
      throw readError;
    }

    const currentCount = current?.daily_mood_checks || 0;
    const newCount = currentCount + 1;

    console.log(`📊 [MOOD API] Incrementing counter: ${currentCount} → ${newCount}`);

    // Increment the counter
    const { error: updateError } = await supabase
      .from('user_progress')
      .update({ daily_mood_checks: newCount })
      .eq('user_id', user.id);

    if (updateError) {
      console.error(`❌ [MOOD API] Failed to update counter:`, updateError);
      throw updateError;
    }

    console.log(`✅ [MOOD API] Counter updated successfully to: ${newCount}`);

    return NextResponse.json({
      success: true,
      mood: updatedProgress.currentMood,
      dailyMoodChecks: newCount,
      message: 'Mood updated successfully'
    });
  } catch (error) {
    console.error('❌ [MOOD API] Error updating mood:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mood } = await request.json();

    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    // Update the mood first
    const updatedProgress = await updateUserMood(user.id, mood);

    // Get CURRENT count from database (fresh read to avoid race conditions)
    const { data: currentProgress } = await supabase
      .from('user_progress')
      .select('daily_mood_checks')
      .eq('user_id', user.id)
      .single();

    const currentCount = currentProgress?.daily_mood_checks || 0;

    // Then increment the daily_mood_checks counter
    const { data: incrementedData } = await supabase
      .from('user_progress')
      .update({ daily_mood_checks: currentCount + 1 })
      .eq('user_id', user.id)
      .select()
      .single();

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Incremented daily_mood_checks: ${currentCount} → ${currentCount + 1}`);
    }

    return NextResponse.json({
      success: true,
      mood: updatedProgress.currentMood,
      dailyMoodChecks: currentCount + 1,
      message: 'Mood updated successfully'
    });
  } catch (error) {
    console.error('Error updating mood:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}