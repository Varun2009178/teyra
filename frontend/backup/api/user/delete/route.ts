import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { tasks, userProgress } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    console.log(`Deleting data for user: ${userId}`);
    
    // Delete all tasks for this user
    const deletedTasks = await db()
      .delete(tasks)
      .where(eq(tasks.userId, userId))
      .returning();
    
    console.log(`Deleted ${deletedTasks.length} tasks for user ${userId}`);
    
    // Delete user progress
    const deletedProgress = await db()
      .delete(userProgress)
      .where(eq(userProgress.userId, userId))
      .returning();
    
    console.log(`Deleted progress for user ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'User data deleted successfully',
      deletedTasks: deletedTasks.length,
      deletedProgress: deletedProgress.length > 0
    });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}