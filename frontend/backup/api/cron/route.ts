import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProgress, tasks } from '@/lib/schema';
import { eq, lt, or, isNull } from 'drizzle-orm';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🕐 Cron job triggered');
    
    // Step 1: 24-hour daily reset (regardless of activity)
    console.log('🔄 Processing 24-hour daily resets...');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get users who need daily reset
    const usersForReset = await db()
      .select()
      .from(userProgress)
      .where(
        or(
          isNull(userProgress.lastResetDate),
          lt(userProgress.lastResetDate, twentyFourHoursAgo)
        )
      );

    let resetsCompleted = 0;
    let tasksReset = 0;

    if (usersForReset && usersForReset.length > 0) {
      console.log(`🔄 Found ${usersForReset.length} users who need daily reset`);
      
      for (const user of usersForReset) {
        try {
          // Get current tasks for this user (for logging purposes)
          const userTasks = await db()
            .select()
            .from(tasks)
            .where(eq(tasks.userId, user.userId));
          
          const completedTasks = userTasks.filter(task => task.completed);
          console.log(`📊 User ${user.userId} has ${userTasks.length} tasks (${completedTasks.length} completed)`);
          
          // Delete all tasks for this user (this resets daily tasks)
          const deleteResult = await db()
            .delete(tasks)
            .where(eq(tasks.userId, user.userId));
          
          console.log(`🗑️ Deleted tasks for user ${user.userId}`);
          tasksReset += userTasks.length;
          
          // Reset daily limits for this user but preserve all-time completed
          await db()
            .update(userProgress)
            .set({ 
              completedTasks: 0,
              totalTasks: 0,
              dailyCompletedTasks: 0,
              dailyMoodChecks: 0,
              dailyAISplits: 0,
              lastResetDate: new Date()
            })
            .where(eq(userProgress.userId, user.userId));

          resetsCompleted++;
          console.log(`✅ Reset completed for user ${user.userId}`);

        } catch (error) {
          console.error(`❌ Error resetting user ${user.userId}:`, error);
        }
      }
    } else {
      console.log('✅ No users need daily reset');
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job completed successfully',
      resetsCompleted,
      tasksReset,
      totalUsers: usersForReset?.length || 0
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 