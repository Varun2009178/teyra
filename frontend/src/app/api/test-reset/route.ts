import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🧪 TEST RESET: Starting manual 24-hour reset for user: ${user.id}`);

    // Get current user progress to determine reset period
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get ALL tasks from current day (since last reset) for email summary
    const lastReset = userProgress?.daily_start_time ? new Date(userProgress.daily_start_time) : new Date(Date.now() - 24*60*60*1000);
    const { data: todaysTasks } = await supabase
      .from('tasks')
      .select('id, title, completed, created_at')
      .eq('user_id', user.id)
      .gte('created_at', lastReset.toISOString());
    
    const completedTasks = todaysTasks?.filter(t => t.completed) || [];
    const incompleteTasks = todaysTasks?.filter(t => !t.completed) || [];
    
    // Calculate points properly: regular = 10, sustainable = 20 points
    const sustainableTasks = [
      '🌿 Use a reusable water bottle',
      '♻️ Recycle something today', 
      '🚶 Walk or bike instead of driving',
      '💡 Turn off lights when leaving a room',
      '🌿 Save food scraps for composting'
    ];
    
    const regularCompleted = completedTasks.filter(t => !sustainableTasks.includes(t.title)).length;
    const sustainableCompleted = completedTasks.filter(t => sustainableTasks.includes(t.title)).length;
    const pointsToAdd = (regularCompleted * 10) + (sustainableCompleted * 20);
    
    // Get current time for reset operations
    const now = new Date();
    
    // Create progress data for localStorage storage
    const progressData = {
      completedTasks: completedTasks.length,
      pointsEarned: pointsToAdd,
      resetDate: now.toISOString()
    };
    
    console.log('🧪 TEST RESET - Points calculation:', {
      regularCompleted,
      sustainableCompleted, 
      pointsToAdd,
      completedTasksCount: completedTasks.length,
      progressData
    });

    // Perform TEST reset - Delete ALL tasks from today, preserve cactus progress
    const resetPromises = [
      // 1. Archive completed tasks by updating their titles to mark as archived
      ...completedTasks.map(task => supabase
        .from('tasks')
        .update({ 
          title: `[ARCHIVED ${now.toLocaleDateString()}] ${task.title.replace(/^\[ARCHIVED [^\]]+\]\s*/, '')}`,
          completed: true 
        })
        .eq('id', task.id)),
      
      // 2. Delete incomplete tasks only
      ...incompleteTasks.map(task => supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)),

      // 3. Reset daily counters - work with existing schema
      supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          daily_start_time: now.toISOString(),
          current_mood: null, // Reset mood to null so user can select again
          daily_ai_splits: 0,
          daily_mood_checks: 0,
          is_locked: false,
          updated_at: now.toISOString(),
          created_at: userProgress?.created_at || now.toISOString()
        })
    ];

    // Execute all reset operations
    const results = await Promise.allSettled(resetPromises);
    
    // Log results
    results.forEach((result, index) => {
      const operations = ['tasks deletion', 'progress reset'];
      if (result.status === 'fulfilled') {
        console.log(`✅ TEST: ${operations[index]} completed for user ${user.id}`);
      } else {
        console.error(`❌ TEST: ${operations[index]} failed for user ${user.id}:`, result.reason);
      }
    });

    // Send reset email with task summary
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-reset-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify({
          taskSummary: {
            total: todaysTasks?.length || 0,
            completed_count: completedTasks.length,
            incomplete_count: incompleteTasks.length,
            completed: completedTasks.map(t => t.title),
            incomplete: incompleteTasks.map(t => t.title)
          },
          userStats: {
            total_tasks_completed: progressData.completedTasks,
            reset_time: now.toISOString()
          }
        })
      });

      if (emailResponse.ok) {
        console.log('✅ TEST: Reset email sent successfully');
      } else {
        console.warn('⚠️ TEST: Failed to send reset email:', await emailResponse.text());
      }
    } catch (emailError) {
      console.warn('⚠️ TEST: Error sending reset email:', emailError);
    }

    console.log(`✅ TEST RESET: Manual daily reset completed successfully for user: ${user.id}`);

    return NextResponse.json({ 
      message: '🧪 TEST: Manual 24-hour reset completed successfully',
      resetTime: now.toISOString(),
      nextResetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      taskSummary: {
        total: todaysTasks?.length || 0,
        completed_count: completedTasks.length,
        incomplete_count: incompleteTasks.length,
        completed: completedTasks.map(t => t.title),
        incomplete: incompleteTasks.map(t => t.title)
      },
      progressData: progressData, // Send progress data to frontend for localStorage storage
      emailSent: true
    });

  } catch (error) {
    console.error('❌ TEST: Error during manual daily reset:', error);
    return NextResponse.json({ 
      error: 'Failed to perform test reset',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}