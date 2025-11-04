import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

// Using shared singleton

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔄 Syncing user profile for: ${user.id.slice(-8)}`);

    // Check if user already exists in user_progress
    const { data: existingUser, error: checkError } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user existence:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingUser) {
      console.log(`✅ User ${user.id.slice(-8)} already exists in Supabase`);
      return NextResponse.json({
        success: true,
        message: 'User already synced',
        isNewUser: false
      });
    }

    // User doesn't exist - create them in all tables
    console.log(`🆕 Creating new user ${user.id.slice(-8)} in Supabase`);

    // 1. Create in user_progress
    const { error: progressError } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        daily_start_time: new Date().toISOString(),
        total_points: 0,
        tasks_completed: 0,
        mood_selections: 0,
        ai_splits_used: 0,
        notifications_enabled: true,
        email_notifications_enabled: true
      });

    if (progressError) {
      console.error('Error creating user_progress:', progressError);
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    // 2. Create in user_ai_patterns
    try {
      const { error: aiError } = await supabase
        .from('user_ai_patterns')
        .insert({
          user_id: user.id,
          patterns: {},
          consistency_score: 0,
          productivity_peaks: [],
          mood_patterns: {},
          task_preferences: {}
        });

      if (aiError) {
        console.warn('Could not create user_ai_patterns:', aiError.message);
      }
    } catch (e) {
      console.warn('user_ai_patterns table might not exist');
    }

    // 3. Create in user_behavior (if table exists)
    try {
      const { error: behaviorError } = await supabase
        .from('user_behavior')
        .insert({
          user_id: user.id,
          action: 'user_created',
          data: { email: user.emailAddresses[0]?.emailAddress },
          timestamp: new Date().toISOString()
        });

      if (behaviorError) {
        console.warn('Could not create user_behavior:', behaviorError.message);
      }
    } catch (e) {
      console.warn('user_behavior table might not exist');
    }

    console.log(`✅ Successfully synced new user ${user.id.slice(-8)} to Supabase`);

    return NextResponse.json({
      success: true,
      message: 'User profile created successfully',
      isNewUser: true,
      userId: user.id
    });

  } catch (error) {
    console.error('❌ Error syncing user profile:', error);
    return NextResponse.json({ 
      error: 'Failed to sync user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



