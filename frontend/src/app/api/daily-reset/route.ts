import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, userProgress } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔄 Starting daily reset for user: ${userId}`);

    // Get current user progress
    const [currentProgress] = await db()
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    if (!currentProgress) {
      return NextResponse.json({ error: 'User progress not found' }, { status: 404 });
    }

    // Get all tasks for this user
    const userTasks = await db()
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    console.log(`📊 Found ${userTasks.length} tasks for user ${userId}`);

    // Calculate completion stats for the summary
    const completedTasks = userTasks.filter(task => task.completed);
    const incompleteTasks = userTasks.filter(task => !task.completed);

    // Delete all tasks for this user (this resets daily tasks)
    await db()
      .delete(tasks)
      .where(eq(tasks.userId, userId));

    console.log(`🗑️ Deleted ${userTasks.length} tasks for user ${userId}`);

    // Reset daily progress but preserve all-time progress
    const [updatedProgress] = await db()
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

    return NextResponse.json({
      success: true,
      message: 'Daily reset completed successfully',
      summary: {
        total: userTasks.length,
        completed: completedTasks.length,
        notCompleted: incompleteTasks.length,
        completedTasks: completedTasks.map(t => t.title),
        notCompletedTasks: incompleteTasks.map(t => t.title)
      },
      userProgress: updatedProgress
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const trigger = searchParams.get('trigger');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔄 Processing daily reset trigger for user: ${userId}`);

    // Get current user progress
    const [currentProgress] = await db()
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    if (!currentProgress) {
      return NextResponse.json({ error: 'User progress not found' }, { status: 404 });
    }

    // Get all tasks for this user
    const userTasks = await db()
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    console.log(`📊 Found ${userTasks.length} tasks for user ${userId}`);

    // Calculate completion stats for the summary
    const completedTasks = userTasks.filter(task => task.completed);
    const incompleteTasks = userTasks.filter(task => !task.completed);

    if (trigger === 'true') {
      // Delete all tasks for this user (this resets daily tasks)
      await db()
        .delete(tasks)
        .where(eq(tasks.userId, userId));

      console.log(`🗑️ Deleted ${userTasks.length} tasks for user ${userId}`);

      // Reset daily progress but preserve all-time progress
      await db()
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
        .where(eq(userProgress.userId, userId));

      console.log(`✅ Daily reset completed for user ${userId}`);

      // Redirect to dashboard with success message
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?reset=success`);
    }

    // If not triggered, just return the summary data
    return NextResponse.json({
      success: true,
      summary: {
        total: userTasks.length,
        completed: completedTasks.length,
        notCompleted: incompleteTasks.length,
        completedTasks: completedTasks.map(t => t.title),
        notCompletedTasks: incompleteTasks.map(t => t.title)
      },
      userProgress: currentProgress
    });

  } catch (error) {
    console.error('❌ Daily reset error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 