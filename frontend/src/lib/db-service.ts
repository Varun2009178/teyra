import { db } from './db';
import { tasks, userProgress } from './schema';
import { eq, and, desc } from 'drizzle-orm';

// Milestones configuration
const MILESTONES = [
  { threshold: 0, mood: 'overwhelmed', maxValue: 10 },
  { threshold: 10, mood: 'neutral', maxValue: 15 },
  { threshold: 25, mood: 'energized', maxValue: 20 },
  { threshold: 45, mood: 'excited', maxValue: 25 }
];

export async function getUserTasks(userId: string) {
  try {
    const userTasks = await db()
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
    
    return userTasks;
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    return [];
  }
}

export async function createTask(userId: string, title: string, hasBeenSplit: boolean = false) {
  try {
    const [newTask] = await db()
      .insert(tasks)
      .values({
        userId,
        title,
        completed: false,
        hasBeenSplit: hasBeenSplit,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTask(userId: string, taskId: number, data: { completed?: boolean }) {
  try {
    // Get the task first to check if it was completed before
    const [existingTask] = await db()
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    
    if (!existingTask) {
      throw new Error(`Task not found: userId=${userId}, taskId=${taskId}`);
    }
    
    const wasCompleted = existingTask.completed;
    
    // Update the task
    const [updatedTask] = await db()
      .update(tasks)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    
    // Update progress
    const progress = await getUserProgress(userId);
    const isNowCompleted = data.completed;
    
    if (isNowCompleted && !wasCompleted) {
      progress.completedTasks += 1;
      progress.allTimeCompleted += 1;
      progress.dailyCompletedTasks += 1;
    } else if (!isNowCompleted && wasCompleted) {
      progress.completedTasks = Math.max(0, progress.completedTasks - 1);
      progress.allTimeCompleted = Math.max(0, progress.allTimeCompleted - 1);
      progress.dailyCompletedTasks = Math.max(0, progress.dailyCompletedTasks - 1);
    }
    
    // Get previous milestone to check if we just reached a new one
    const previousMilestone = getCurrentMilestone(progress.allTimeCompleted - (isNowCompleted && !wasCompleted ? 1 : 0));
    const currentMilestone = getCurrentMilestone(progress.allTimeCompleted);
    
    // Check if we just reached a new milestone
    const reachedNewMilestone = currentMilestone.threshold > previousMilestone.threshold;
    
    // Update milestone (but preserve user's manually set mood)
    // Only update mood if user hasn't manually set one today
    if (progress.dailyMoodChecks === 0) {
      progress.mood = currentMilestone.mood;
    }
    progress.maxValue = currentMilestone.maxValue;
    
    // If we reached a new milestone, reset daily completed tasks
    if (reachedNewMilestone) {
      progress.completedTasks = 0;
      progress.dailyCompletedTasks = 0;
    }
    
    await updateUserProgress(userId, progress);
    
    return {
      ...updatedTask,
      completedTasks: progress.completedTasks,
      newMood: progress.mood,
      displayCompleted: progress.completedTasks,
      maxValue: progress.maxValue,
      allTimeCompleted: progress.allTimeCompleted,
      currentMilestone: MILESTONES.findIndex(m => m.threshold <= progress.allTimeCompleted),
      reachedNewMilestone: reachedNewMilestone
    };
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(userId: string, taskId: number) {
  try {
    const [deletedTask] = await db()
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    
    if (!deletedTask) {
      throw new Error(`Task not found: userId=${userId}, taskId=${taskId}`);
    }
    
    // Update progress
    const progress = await getUserProgress(userId);
    if (deletedTask.completed) {
      progress.completedTasks = Math.max(0, progress.completedTasks - 1);
      progress.allTimeCompleted = Math.max(0, progress.allTimeCompleted - 1);
      progress.dailyCompletedTasks = Math.max(0, progress.dailyCompletedTasks - 1);
    }
    
    // Get previous milestone to check if we just reached a new one
    const previousMilestone = getCurrentMilestone(progress.allTimeCompleted + (deletedTask.completed ? 1 : 0));
    const currentMilestone = getCurrentMilestone(progress.allTimeCompleted);
    
    // Check if we just reached a new milestone
    const reachedNewMilestone = currentMilestone.threshold > previousMilestone.threshold;
    
    // Update milestone (but preserve user's manually set mood)
    // Only update mood if user hasn't manually set one today
    if (progress.dailyMoodChecks === 0) {
      progress.mood = currentMilestone.mood;
    }
    progress.maxValue = currentMilestone.maxValue;
    
    // If we reached a new milestone, reset daily completed tasks
    if (reachedNewMilestone) {
      progress.completedTasks = 0;
      progress.dailyCompletedTasks = 0;
    }
    
    await updateUserProgress(userId, progress);
    
    return {
      ...deletedTask,
      completedTasks: progress.completedTasks,
      newMood: progress.mood,
      displayCompleted: progress.completedTasks,
      maxValue: progress.maxValue,
      allTimeCompleted: progress.allTimeCompleted,
      currentMilestone: MILESTONES.findIndex(m => m.threshold <= progress.allTimeCompleted),
      reachedNewMilestone: reachedNewMilestone
    };
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

export async function getUserProgress(userId: string) {
  try {
    let [progress] = await db()
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    
    if (!progress) {
      // Create new progress for user
      [progress] = await db()
        .insert(userProgress)
        .values({
          userId,
          completedTasks: 0,
          totalTasks: 0,
          allTimeCompleted: 0,
          mood: 'overwhelmed',
          dailyCompletedTasks: 0,
          dailyMoodChecks: 0,
          dailyAISplits: 0,
          lastResetDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    }
    
    // Check for daily reset
    const now = new Date();
    const lastReset = new Date(progress.lastResetDate);
    const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceReset >= 1) {
      // Reset daily progress
      progress.dailyCompletedTasks = 0;
      progress.completedTasks = 0;
      progress.dailyMoodChecks = 0;
      progress.dailyAISplits = 0;
      progress.lastResetDate = now;
      
      await updateUserProgress(userId, progress);
    }
    
    // Calculate milestone-based values
    const currentMilestone = getCurrentMilestone(progress.allTimeCompleted);
    
    // Fix for existing accounts: if completedTasks is at or exceeds maxValue, reset to 0
    if (progress.completedTasks >= currentMilestone.maxValue) {
      progress.completedTasks = 0;
      progress.dailyCompletedTasks = 0;
      await updateUserProgress(userId, progress);
    }
    
    const displayCompleted = Math.min(progress.completedTasks, currentMilestone.maxValue);
    
    return {
      ...progress,
      displayCompleted,
      maxValue: currentMilestone.maxValue,
      currentMilestone: MILESTONES.findIndex(m => m.threshold <= progress.allTimeCompleted)
    };
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
}

export async function updateUserProgress(userId: string, data: any) {
  try {
    const [updatedProgress] = await db()
      .update(userProgress)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(userProgress.userId, userId))
      .returning();
    
    return updatedProgress;
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
}

export async function updateUserMood(userId: string, mood: string) {
  try {
    const progress = await getUserProgress(userId);
    progress.mood = mood;
    
    await updateUserProgress(userId, progress);
    
    return {
      mood,
      dailyMoodChecks: progress.dailyMoodChecks
    };
  } catch (error) {
    console.error('Error updating user mood:', error);
    throw error;
  }
}

export async function incrementDailyMoodChecks(userId: string) {
  try {
    const progress = await getUserProgress(userId);
    const currentMoodChecks = progress.dailyMoodChecks || 0;
    const limitReached = currentMoodChecks >= 1;
    
    if (!limitReached) {
      progress.dailyMoodChecks = currentMoodChecks + 1;
      await updateUserProgress(userId, progress);
    }
    
    return {
      success: !limitReached,
      dailyMoodChecks: progress.dailyMoodChecks,
      limitReached
    };
  } catch (error) {
    console.error('Error incrementing daily mood checks:', error);
    throw error;
  }
}

export async function incrementDailyAISplits(userId: string) {
  try {
    const progress = await getUserProgress(userId);
    const currentAISplits = progress.dailyAISplits || 0;
    const limitReached = currentAISplits >= 2; // Changed to 2 per day
    
    if (!limitReached) {
      progress.dailyAISplits = currentAISplits + 1;
      await updateUserProgress(userId, progress);
    }
    
    return {
      success: !limitReached,
      dailyAISplits: progress.dailyAISplits,
      limitReached
    };
  } catch (error) {
    console.error('Error incrementing daily AI splits:', error);
    throw error;
  }
}

export async function deleteUserData(userId: string) {
  try {
    // Delete all user tasks
    await db().delete(tasks).where(eq(tasks.userId, userId));
    
    // Delete user progress
    await db().delete(userProgress).where(eq(userProgress.userId, userId));
    
    console.log(`Successfully deleted all data for user: ${userId}`);
  } catch (error) {
    console.error(`Error deleting user data for ${userId}:`, error);
    throw error;
  }
}

function getCurrentMilestone(allTimeCompleted: number) {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (allTimeCompleted >= MILESTONES[i].threshold) {
      return MILESTONES[i];
    }
  }
  return MILESTONES[0];
} 