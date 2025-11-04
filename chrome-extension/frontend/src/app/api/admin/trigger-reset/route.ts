import { NextRequest, NextResponse } from 'next/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

// Using shared singleton

export async function POST(request: NextRequest) {
  try {
    // Check authorization for admin/cron access
    const cronSecret = request.headers.get('authorization');
    const userAgent = request.headers.get('user-agent');
    const isVercelCron = userAgent?.includes('vercel') || request.headers.get('x-vercel-cron') === '1';

    if (!isVercelCron && cronSecret !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log(`Admin: Starting daily reset for user: ${userId}`);

    // Get current user progress to check if reset is needed
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userProgress) {
      console.log(`📊 User ${userId} not found in user_progress`);
      return NextResponse.json({
        error: 'User not found',
        userId
      }, { status: 404 });
    }

    // Check if 24 hours have passed since the last reset
    const lastReset = new Date(userProgress.daily_start_time || userProgress.created_at);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    console.log(`⏰ Admin reset check for user ${userId}: ${hoursSinceReset.toFixed(1)} hours since last reset`);

    if (hoursSinceReset < 24) {
      return NextResponse.json({
        message: 'Reset not needed yet',
        hoursRemaining: 24 - hoursSinceReset,
        nextResetTime: new Date(lastReset.getTime() + 24 * 60 * 60 * 1000),
        lastResetTime: lastReset.toISOString()
      });
    }

    // Get tasks from the current day for email summary
    const { data: todaysTasks } = await supabase
      .from('tasks')
      .select('id, title, completed, created_at')
      .eq('user_id', userId)
      .gte('created_at', lastReset.toISOString());

    const completedTasks = todaysTasks?.filter(t => t.completed) || [];
    const incompleteTasks = todaysTasks?.filter(t => !t.completed) || [];

    // Calculate points
    const sustainableTasks = [
      '🌱 Use a reusable water bottle',
      '♻️ Put one item in recycling',
      '🚶 Take stairs instead of elevator',
      '💡 Turn off one light you\'re not using',
      '🌿 Save food scraps for composting'
    ];

    const regularCompleted = completedTasks.filter(t => !sustainableTasks.includes(t.title)).length;
    const sustainableCompleted = completedTasks.filter(t => sustainableTasks.includes(t.title)).length;
    const pointsToAdd = (regularCompleted * 10) + (sustainableCompleted * 20);

    console.log('🔄 ADMIN RESET - Points calculation:', {
      regularCompleted,
      sustainableCompleted,
      pointsToAdd,
      completedTasksCount: completedTasks.length,
      incompleteTasks: incompleteTasks.length
    });

    // Perform the daily reset - Archive completed tasks, delete incomplete ones
    const progressData = {
      completedTasks: completedTasks.length,
      pointsEarned: pointsToAdd,
      resetDate: now.toISOString()
    };

    // 1. Archive completed tasks
    const archivePromises = completedTasks.map(task =>
      supabase
        .from('tasks')
        .update({
          title: `[COMPLETED] ${task.title.replace(/^\[COMPLETED\]\s*/, '')}`,
          completed: true
        })
        .eq('id', task.id)
        .eq('user_id', userId)
    );

    // 2. Delete incomplete tasks
    const deletePromises = incompleteTasks.map(task =>
      supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)
        .eq('user_id', userId)
    );

    // 3. Reset user progress
    const progressResetPromise = supabase
      .from('user_progress')
      .update({
        daily_start_time: now.toISOString(),
        current_mood: null,
        daily_mood_checks: 0,
        is_locked: false,
        updated_at: now.toISOString()
      })
      .eq('user_id', userId);

    const resetPromises = [...archivePromises, ...deletePromises, progressResetPromise];

    // Execute all reset operations
    const results = await Promise.allSettled(resetPromises);

    const successfulArchives = results.slice(0, completedTasks.length).filter(r => r.status === 'fulfilled').length;
    const successfulDeletes = results.slice(completedTasks.length, completedTasks.length + incompleteTasks.length).filter(r => r.status === 'fulfilled').length;
    const progressResetSuccess = results[results.length - 1].status === 'fulfilled';

    console.log(`📊 Admin reset results for user ${userId}:
      - Archived tasks: ${successfulArchives}/${completedTasks.length}
      - Deleted incomplete tasks: ${successfulDeletes}/${incompleteTasks.length}
      - Progress reset: ${progressResetSuccess ? 'Success' : 'Failed'}`);

    if (!progressResetSuccess) {
      console.error(`❌ Critical failure: Progress reset failed for user ${userId}`);
      return NextResponse.json({
        error: 'Daily reset failed - unable to reset user progress',
        details: results[results.length - 1].reason
      }, { status: 500 });
    }

    console.log(`✅ Admin daily reset completed successfully for user: ${userId}`);

    return NextResponse.json({
      message: 'Daily reset completed successfully',
      resetTime: now.toISOString(),
      nextResetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      taskSummary: {
        total: todaysTasks?.length || 0,
        completed_count: completedTasks.length,
        incomplete_count: incompleteTasks.length,
        completed: completedTasks.map(t => t.title),
        incomplete: incompleteTasks.map(t => t.title)
      },
      resetType: 'admin_triggered',
      progressData: progressData,
      emailSent: false // Emails are sent separately by email cron
    });

  } catch (error) {
    console.error('Error during admin daily reset:', error);
    return NextResponse.json({
      error: 'Failed to perform daily reset',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}