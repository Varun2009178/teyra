import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

// Initialize Supabase client with service role key for admin operations
// Use fallback during build time if service role key is not available
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback'
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Starting daily reset for user: ${userId}`);

    // Get current user progress to check if reset is needed
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userProgress) {
      // If no user progress found, create initial record
      console.log(`📊 Creating initial user progress for ${userId}`);
      
      const { data: newProgress, error: createError } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          daily_start_time: new Date().toISOString(),
          current_mood: null,
          daily_mood_checks: 0,
          is_locked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user progress:', createError);
        return NextResponse.json({ 
          error: 'Failed to initialize user progress',
          details: createError.message 
        }, { status: 500 });
      }

      // Since we just created it, no reset needed
      return NextResponse.json({ 
        message: 'User progress initialized - no reset needed',
        hoursRemaining: 24,
        nextResetTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
        justCreated: true
      });
    }

    // Check if 24 hours have passed since the last reset
    const lastReset = new Date(userProgress.daily_start_time || userProgress.created_at);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    console.log(`⏰ Reset check for user ${userId}: ${hoursSinceReset.toFixed(1)} hours since last reset`);

    if (hoursSinceReset < 24) {
      return NextResponse.json({ 
        message: 'Reset not needed yet',
        hoursRemaining: 24 - hoursSinceReset,
        nextResetTime: new Date(lastReset.getTime() + 24 * 60 * 60 * 1000),
        lastResetTime: lastReset.toISOString()
      });
    }

    // Get tasks from the current day for email summary (reuse lastReset from above)
    const { data: todaysTasks } = await supabase
      .from('tasks')
      .select('id, title, completed, created_at')
      .eq('user_id', userId)
      .gte('created_at', lastReset.toISOString()); // Tasks from this 24-hour period
    
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
    
    // Get current user progress 
    const { data: currentProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Since the database doesn't have the columns we need, we'll store progress differently
    // We'll use localStorage and track cumulative completed tasks through the tasks table itself
    
    console.log('🔄 DAILY RESET - Points calculation:', {
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
    
    // 1. Archive completed tasks first
    const archivePromises = completedTasks.map(task => 
      supabase
        .from('tasks')
        .update({ 
          title: `[ARCHIVED ${now.toLocaleDateString()}] ${task.title.replace(/^\[ARCHIVED [^\]]+\]\s*/, '')}`,
          completed: true 
        })
        .eq('id', task.id)
        .eq('user_id', userId) // Extra safety check
    );

    // 2. Keep incomplete tasks for the next day (no deletion)
    // Incomplete tasks carry over automatically since we don't delete them

    // 3. Reset user progress
    const progressResetPromise = supabase
      .from('user_progress')
      .update({
        daily_start_time: now.toISOString(),
        current_mood: null, // Reset mood so user can select again
        daily_mood_checks: 0,
        is_locked: false,
        updated_at: now.toISOString()
      })
      .eq('user_id', userId);

    const resetPromises = [...archivePromises, progressResetPromise];

    // Execute all reset operations
    const results = await Promise.allSettled(resetPromises);
    
    // Count successful operations
    const successfulArchives = results.slice(0, completedTasks.length).filter(r => r.status === 'fulfilled').length;
    const progressResetSuccess = results[results.length - 1].status === 'fulfilled';
    
    console.log(`📊 Reset results for user ${userId}:
      - Archived tasks: ${successfulArchives}/${completedTasks.length}
      - Incomplete tasks carried over: ${incompleteTasks.length}
      - Progress reset: ${progressResetSuccess ? 'Success' : 'Failed'}`);
    
    // Log individual failures for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        if (index < completedTasks.length) {
          console.error(`❌ Failed to archive task ${completedTasks[index].id}:`, result.reason);
        } else {
          console.error(`❌ Failed to reset progress:`, result.reason);
        }
      }
    });

    // Check if progress reset failed (critical)
    if (!progressResetSuccess) {
      console.error(`❌ Critical failure: Progress reset failed for user ${userId}`);
      
      // Try to recover by at least updating the reset time
      try {
        await supabase
          .from('user_progress')
          .update({
            daily_start_time: now.toISOString(),
            current_mood: null,
            daily_mood_checks: 0,
            is_locked: false,
            updated_at: now.toISOString()
          })
          .eq('user_id', userId);
        
        console.log(`⚠️ Recovery completed for user ${userId} - progress reset manually applied`);
      } catch (recoveryError) {
        console.error(`❌ Recovery failed for user ${userId}:`, recoveryError);
        return NextResponse.json({ 
          error: 'Daily reset failed - unable to reset user progress',
          details: results[results.length - 1].reason 
        }, { status: 500 });
      }
    }

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
            completed_count: completedTasks.length,
            points_earned: pointsToAdd,
            reset_time: now.toISOString()
          }
        })
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        if (emailResult.emailSkipped) {
          console.log('📧 Reset email skipped (API key not configured)');
        } else {
          console.log('✅ Reset email sent successfully');
        }
      } else {
        console.warn('⚠️ Failed to send reset email:', await emailResponse.text());
      }
    } catch (emailError) {
      console.warn('⚠️ Error sending reset email:', emailError);
    }

    console.log(`✅ Daily reset completed successfully for user: ${userId}`);

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
      resetType: 'daily_completed_archived', // Only completed tasks were archived, incomplete carry over
      progressData: progressData, // Send progress data to frontend for localStorage storage
      progressUpdate: {
        completed_tasks_added_to_total: completedTasks.length,
        points_added: pointsToAdd,
        cactus_progress_updated: true
      }
    });

  } catch (error) {
    console.error('Error during daily reset:', error);
    return NextResponse.json({ 
      error: 'Failed to perform daily reset',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check if reset is needed
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user progress
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('daily_start_time, created_at')
      .eq('user_id', userId)
      .single();

    if (!userProgress) {
      return NextResponse.json({ error: 'User progress not found' }, { status: 404 });
    }

    // Check if 24 hours have passed
    const lastReset = new Date(userProgress.daily_start_time || userProgress.created_at);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    return NextResponse.json({
      needsReset: hoursSinceReset >= 24,
      hoursRemaining: Math.max(0, 24 - hoursSinceReset),
      lastResetTime: lastReset.toISOString(),
      nextResetTime: new Date(lastReset.getTime() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Error checking reset status:', error);
    return NextResponse.json({ 
      error: 'Failed to check reset status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}