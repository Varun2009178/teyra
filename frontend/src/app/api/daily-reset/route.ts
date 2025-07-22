import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, userProgress } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔄 Starting daily reset for user: ${userId}`);

    // Get current user progress
    const [currentProgress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    if (!currentProgress) {
      return NextResponse.json({ error: 'User progress not found' }, { status: 404 });
    }

    // Get all tasks for this user
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    console.log(`📊 Found ${userTasks.length} tasks for user ${userId}`);

    // Delete all tasks for this user (this resets daily tasks)
    await db
      .delete(tasks)
      .where(eq(tasks.userId, userId));

    console.log(`🗑️ Deleted ${userTasks.length} tasks for user ${userId}`);

    // Reset daily progress but preserve all-time progress
    const [updatedProgress] = await db
      .update(userProgress)
      .set({
        completedTasks: 0, // Reset daily completed
        totalTasks: 0, // Reset daily total
        dailyCompletedTasks: 0, // Reset daily completed
        dailyMoodChecks: 0, // Reset daily mood checks
        dailyAISplits: 0, // Reset daily AI splits
        lastResetDate: new Date(), // Update reset date
        updatedAt: new Date()
        // allTimeCompleted stays the same - NOT resetting this!
      })
      .where(eq(userProgress.userId, userId))
      .returning();

    console.log(`✅ Daily reset completed for user ${userId}`);

    // Calculate completion stats for the summary
    const completedTasks = userTasks.filter(task => task.completed);
    const incompleteTasks = userTasks.filter(task => !task.completed);

    return NextResponse.json({
      success: true,
      message: 'Daily reset completed successfully',
      summary: {
        totalTasks: userTasks.length,
        completedTasks: completedTasks.length,
        incompleteTasks: incompleteTasks.length,
        completionRate: userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0,
        allTimeCompleted: currentProgress.allTimeCompleted, // Preserved
        mikeMood: currentProgress.mood // Preserved
      },
      resetData: {
        completedTasks: 0,
        totalTasks: 0,
        dailyCompletedTasks: 0,
        dailyMoodChecks: 0,
        dailyAISplits: 0,
        allTimeCompleted: currentProgress.allTimeCompleted // This stays the same
      }
    });

  } catch (error) {
    console.error('❌ Daily reset error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    
    // Just fetch progress to trigger any pending daily resets
    const progress = await getUserProgress(userId);
    
    return NextResponse.json({
      success: true,
      progress: {
        dailyCompletedTasks: progress.dailyCompletedTasks,
        streak: progress.streak,
        lastResetDate: progress.lastResetDate,
        allTimeCompleted: progress.allTimeCompleted
      }
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 