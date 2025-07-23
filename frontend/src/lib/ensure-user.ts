import { db } from './db';
import { userProgress } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Ensures a user exists in the database
 * This function should be called at the beginning of API routes that require user data
 */
export async function ensureUserExists(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    console.log(`Ensuring user exists: ${userId}`);
    
    // Check if user already exists
    const existingUser = await db()
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    
    if (existingUser && existingUser.length > 0) {
      console.log(`User ${userId} already exists`);
      return existingUser[0];
    }
    
    // Create new user if not exists
    console.log(`Creating new user: ${userId}`);
    const [newUser] = await db()
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
    
    console.log(`User ${userId} created successfully`);
    return newUser;
  } catch (error) {
    console.error(`Error ensuring user exists: ${error}`);
    throw error;
  }
}