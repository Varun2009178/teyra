import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing service key...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEW_SUPABASE_SERVICE_KEY!
    );
    
    // Test 1: Try to select from user_stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .limit(1);
    
    console.log('Service key stats test:', { data: stats, error: statsError });
    
    // Test 2: Try to select from tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);
    
    console.log('Service key tasks test:', { data: tasks, error: tasksError });
    
    // Test 3: Try to insert a test record
    const { data: insertData, error: insertError } = await supabase
      .from('user_stats')
      .insert([{
        userId: 'test_user_' + Date.now(),
        all_time_completed: 0,
        current_streak: 0,
        completed_today: 0,
        user_mood: 'neutral',
        ai_splits_today: 0,
        daily_limit: 10,
        timezone: 'UTC'
      }])
      .select()
      .single();
    
    console.log('Service key insert test:', { data: insertData, error: insertError });
    
    return NextResponse.json({
      success: true,
      stats: { data: stats, error: statsError },
      tasks: { data: tasks, error: tasksError },
      insert: { data: insertData, error: insertError }
    });
    
  } catch (error) {
    console.error('Service key test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 