import { db } from './db';
import { tasks, userProgress } from './schema';
import { eq, and } from 'drizzle-orm';

// Task-related database operations
export async function getUserTasks(userId: string) {
  try {
    const userTasks = await db.select().from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(tasks.createdAt);
    
    return userTasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function createTask(userId: string, title: string) {
  try {
    const newTask = await db.insert(tasks).values({
      userId,
      title,
      completed: false,
      has_been_split: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Also update the user's total tasks count
    await db.update(userProgress)
      .set({ 
        totalTasks: db.raw('total_tasks + 1'),
        updatedAt: new Date()
      })
      .where(eq(userProgress.userId, userId));
    
    return newTask[0];
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTask(userId: string, taskId: number, data: { completed?: boolean }) {
  try {
    const updatedTask = await db.update(tasks)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, userId)
        )
      )
      .returning();
    
    // If task was completed, update the user's completed tasks count
    if (data.completed !== undefined) {
      const completedChange = data.completed ? 1 : -1;
      
      await db.update(userProgress)
        .set({ 
          completedTasks: db.raw(`GREATEST(0, completed_tasks + ${completedChange})`),
          updatedAt: new Date()
        })
        .where(eq(userProgress.userId, userId));
    }
    
    return updatedTask[0];
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(userId: string, taskId: number) {
  try {
    // First check if the task is completed
    const taskToDelete = await db.select({ completed: tasks.completed })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, userId)
        )
      );
    
    if (!taskToDelete || taskToDelete.length === 0) {
      throw new Error('Task not found');
    }
    
    const isCompleted = taskToDelete[0].completed;
    
    // Delete the task
    const deletedTask = await db.delete(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.userId, userId)
        )
      )
      .returning();
    
    // Update user progress
    await db.update(userProgress)
      .set({ 
        totalTasks: db.raw('GREATEST(0, total_tasks - 1)'),
        completedTasks: isCompleted ? db.raw('GREATEST(0, completed_tasks - 1)') : db.raw('completed_tasks'),
        updatedAt: new Date()
      })
      .where(eq(userProgress.userId, userId));
    
    return deletedTask[0];
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// User progress related operations
export async function getUserProgress(userId: string) {
  try {
    let userProgressData = await db.select().from(userProgress)
      .where(eq(userProgress.userId, userId));
    
    if (!userProgressData || userProgressData.length === 0) {
      // Create new progress record if it doesn't exist
      userProgressData = await db.insert(userProgress).values({
        userId,
        completedTasks: 0,
        totalTasks: 0,
        mood: 'neutral',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
    }
    
    return userProgressData[0];
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
}

export async function updateUserMood(userId: string, mood: string) {
  try {
    const updatedProgress = await db.update(userProgress)
      .set({ 
        mood,
        updatedAt: new Date()
      })
      .where(eq(userProgress.userId, userId))
      .returning();
    
    if (!updatedProgress || updatedProgress.length === 0) {
      // Create new progress record if it doesn't exist
      return db.insert(userProgress).values({
        userId,
        completedTasks: 0,
        totalTasks: 0,
        mood,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
    }
    
    return updatedProgress[0];
  } catch (error) {
    console.error('Error updating user mood:', error);
    throw error;
  }
}