import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

// Using shared singleton

// GET: Check current mood counter
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_progress')
      .select('daily_mood_checks, current_mood, daily_start_time')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      userId: user.id,
      dailyMoodChecks: data?.daily_mood_checks || 0,
      currentMood: data?.current_mood,
      dailyStartTime: data?.daily_start_time
    });
  } catch (error) {
    console.error('Error checking mood counter:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE: Reset mood counter to 0
export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔄 Resetting mood counter for user: ${user.id}`);

    const { data, error } = await supabase
      .from('user_progress')
      .update({ daily_mood_checks: 0 })
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('❌ Reset failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Counter reset successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Mood counter reset to 0',
      userId: user.id,
      newCount: 0,
      updated: data
    });
  } catch (error) {
    console.error('Error resetting mood counter:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Set counter to specific value
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({ value: 0 }));
    const newValue = body.value || 0;

    console.log(`🔄 Setting mood counter to ${newValue} for user: ${user.id}`);

    const { data, error } = await supabase
      .from('user_progress')
      .update({ daily_mood_checks: newValue })
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('❌ Update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Counter updated successfully:', data);

    return NextResponse.json({
      success: true,
      message: `Mood counter set to ${newValue}`,
      userId: user.id,
      newCount: newValue,
      updated: data
    });
  } catch (error) {
    console.error('Error updating mood counter:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
