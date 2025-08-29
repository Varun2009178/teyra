import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'

// Service role client for admin operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Task-related operations
export async function getUserTasks(userId: string) {
  try {
    const { data, error } = await serviceSupabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user tasks:', error)
    throw error
  }
}

export async function createTask(userId: string, title: string, limit?: string) {
  try {
    // Check if user already has tasks (if not, this is their first action)
    const existingTasks = await getUserTasks(userId)
    const isFirstTask = existingTasks.length === 0

    // Check daily task limit (10 tasks per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tasksCreatedToday = existingTasks.filter(task => {
      const taskDate = new Date(task.created_at)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() === today.getTime()
    }).length

    if (tasksCreatedToday >= 10) {
      throw new Error('Daily task limit of 10 tasks reached. Please try again tomorrow.')
    }

    // Create the task using service role client to bypass RLS
    const { data, error } = await serviceSupabase
      .from('tasks')
      .insert({
        user_id: userId,
        title,
        completed: false,
        limit,
      })
      .select()
      .single()

    if (error) throw error

    // If this is their first task, lock them for 24 hours
    if (isFirstTask) {
      console.log(`🔒 Locking user ${userId} after first task creation`)
      
      await serviceSupabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          is_locked: true,
          daily_start_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }
    
    return data
  } catch (error) {
    console.error('Error creating task:', error)
    throw error
  }
}

export async function updateTask(taskId: number, data: { completed?: boolean; title?: string; has_been_split?: boolean }) {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (typeof data.completed === 'boolean') {
      updateData.completed = data.completed
    }
    if (typeof data.title === 'string') {
      updateData.title = data.title
    }
    if (typeof data.has_been_split === 'boolean') {
      updateData.has_been_split = data.has_been_split
    }

    const { data: updatedTask, error } = await serviceSupabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    if (!updatedTask) throw new Error(`Task with ID ${taskId} not found`)
    
    return updatedTask
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error)
    throw error
  }
}

export async function deleteTask(taskId: number) {
  try {
    console.log(`🗑️ Attempting to delete task with ID: ${taskId}`)
    
    // First check if the task exists and get its user_id
    const { data: existingTask, error: fetchError } = await serviceSupabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.warn(`⚠️ Task ${taskId} not found`)
        throw new Error(`Task with ID ${taskId} not found`)
      }
      console.error('Error checking if task exists:', fetchError)
      throw fetchError
    }
    
    if (!existingTask) {
      console.warn(`⚠️ Task ${taskId} not found, might already be deleted`)
      throw new Error(`Task with ID ${taskId} not found`)
    }
    
    console.log(`📋 Found task to delete:`, existingTask)

    // Delete using service client to bypass RLS
    const { data, error } = await serviceSupabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      console.error('Supabase delete error:', error)
      // If RLS is blocking, provide more specific error
      if (error.code === 'PGRST116') {
        throw new Error(`Permission denied: Cannot delete task ${taskId}`)
      }
      throw error
    }
    
    if (data) {
      console.log(`✅ Successfully deleted task ${taskId}:`, data)
    } else {
      console.warn(`⚠️ Delete operation succeeded but no data returned for task ${taskId}`)
    }
    
    return data || existingTask // Return original task data if delete doesn't return data
  } catch (error) {
    console.error(`❌ Error deleting task ${taskId}:`, error)
    throw error
  }
}

// Progress calculation functions with milestone system
export async function calculateUserProgress(userId: string) {
  try {
    const userTasks = await getUserTasks(userId)
    
    // Get user progress data from database for daily_start_time and lock status
    const { data: userProgressData } = await serviceSupabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    const totalTasks = userTasks.length
    const completedTasks = userTasks.filter(task => task.completed).length
    
    // Calculate daily completed tasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dailyCompletedTasks = userTasks.filter(task => 
      task.completed && 
      task.updated_at && 
      new Date(task.updated_at) >= today
    ).length
    
    // Calculate all-time completed - count current completed + archived tasks
    const currentCompletedTasks = userTasks.filter(task => task.completed && !task.title.startsWith('[ARCHIVED')).length
    const archivedTasks = userTasks.filter(task => task.title.startsWith('[ARCHIVED')).length
    
    const allTimeCompleted = currentCompletedTasks + archivedTasks
    
    // Milestone system: 0→10→15→20 with progress bar reset
    let currentMilestone = 1
    let maxValue = 10
    let displayCompleted = allTimeCompleted
    let mood = 'sad' // Default sad cactus
    
    if (allTimeCompleted >= 20) {
      // Happy cactus - maxed out at 20
      currentMilestone = 4
      maxValue = 20
      displayCompleted = allTimeCompleted // Show full count for maxed out
      mood = 'happy'
    } else if (allTimeCompleted >= 15) {
      // Working towards happy (15→20) - reset progress bar and show out of 20
      currentMilestone = 3
      maxValue = 20
      displayCompleted = allTimeCompleted - 15 // Reset: 0-4 progress within this milestone
      mood = 'neutral'
    } else if (allTimeCompleted >= 10) {
      // Medium cactus achieved! Working towards next milestone (10→15) - reset progress bar
      currentMilestone = 2  
      maxValue = 15
      displayCompleted = allTimeCompleted - 10 // Reset: 0-4 progress within this milestone
      mood = 'neutral'
    } else {
      // Working towards first milestone (0→10)
      currentMilestone = 1
      maxValue = 10
      displayCompleted = allTimeCompleted // 0-9 progress towards first milestone
      mood = allTimeCompleted >= 10 ? 'neutral' : 'sad' // Neutral when reaching first milestone
    }
    
    return {
      id: userId,
      totalTasks,
      completedTasks,
      dailyCompletedTasks,
      allTimeCompleted,
      displayCompleted,
      maxValue,
      currentMilestone,
      mood,
      // Database fields for daily reset system
      dailyStartTime: userProgressData?.daily_start_time || null,
      isLocked: userProgressData?.is_locked || false,
      dailyMoodChecks: userProgressData?.daily_mood_checks || 0,
      lastResetDate: userProgressData?.created_at || new Date().toISOString(),
      updatedAt: userProgressData?.updated_at || new Date().toISOString(),
      // Add raw stored count for real-time calculations
      storedTasksCompleted: archivedTasks // Count of archived tasks
    }
  } catch (error) {
    console.error('Error calculating user progress:', error)
    throw error
  }
}

// User Progress Management Functions
export async function getUserProgress(userId: string) {
  try {
    const { data, error } = await serviceSupabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data
  } catch (error) {
    console.error('Error fetching user progress:', error)
    throw error
  }
}

export async function createUserProgress(userId: string) {
  try {
    console.log(`👤 Creating user progress for ${userId}`)

    const { data, error } = await serviceSupabase
      .from('user_progress')
      .insert({
        user_id: userId,
        current_mood: 'neutral',
        daily_mood_checks: 0,
        last_mood_update: new Date().toISOString(),
        last_reset_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error(`Failed to create user progress for ${userId} - no record returned`)

    console.log(`✅ Created user progress for ${userId}`)
    return data
  } catch (error) {
    console.error(`❌ Error creating user progress for ${userId}:`, error)
    
    // Check for duplicate key error (user already exists)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      // Try to fetch existing user progress instead
      try {
        const existingProgress = await getUserProgress(userId)
        if (existingProgress) {
          console.log(`✅ Found existing user progress for ${userId}`)
          return existingProgress
        }
      } catch (fetchError) {
        console.error(`❌ Could not fetch existing user progress:`, fetchError)
      }
    }
    
    throw error
  }
}

export async function updateUserMood(userId: string, mood: string) {
  try {
    // First ensure user progress exists
    let userProgressData = await getUserProgress(userId)
    
    if (!userProgressData) {
      userProgressData = await createUserProgress(userId)
    }

    // Check if we need to reset daily counters (new day)
    const today = new Date().toDateString()
    const lastResetDate = new Date(userProgressData.last_reset_date).toDateString()
    const isNewDay = today !== lastResetDate
    
    // If it's a new day, reset everything and allow mood updates
    if (isNewDay) {
      console.log(`🔄 New day detected for user ${userId}, resetting counters and unlocking`)
      userProgressData.is_locked = false
      userProgressData.daily_start_time = null
      userProgressData.daily_mood_checks = 0
    }
    
    // Check if user is locked (only if it's the same day)
    if (!isNewDay && userProgressData.is_locked && userProgressData.daily_start_time) {
      throw new Error('User is locked and cannot change mood until next reset')
    }
    
    let dailyMoodChecks = userProgressData.daily_mood_checks
    
    // Increment daily mood checks
    dailyMoodChecks += 1
    
    // If this is their first mood check of the day and they're not locked yet, lock them
    const isFirstMoodCheck = dailyMoodChecks === 1 && !userProgressData.is_locked

    const updateData: any = {
      current_mood: mood,
      daily_mood_checks: dailyMoodChecks,
      last_mood_update: new Date().toISOString(),
      last_reset_date: new Date().toISOString(), // Always update to current time
      updated_at: new Date().toISOString()
    }

    // Lock user if this is their first mood check of the day
    if (isFirstMoodCheck) {
      console.log(`🔒 Locking user ${userId} after first mood update of the day`)
      updateData.is_locked = true
      updateData.daily_start_time = new Date().toISOString()
    }

    const { data, error } = await serviceSupabase
      .from('user_progress')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user mood:', error)
    throw error
  }
}


// Daily check-in functions
export async function getTodaysCheckin(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await serviceSupabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  } catch (error) {
    console.error('Error fetching today\'s check-in:', error);
    throw error;
  }
}

export async function createDailyCheckin(userId: string, emotionalState: string, message?: string) {
  try {
    // Generate a simple Mike response based on emotional state
    const mikeResponses = {
      happy: "🌵 Awesome! I love seeing you happy! Let's tackle those tasks with enthusiasm!",
      good: "🌵 Great vibes! I'm here to help you make today productive!",
      neutral: "🌵 Thanks for checking in! Let's take things one step at a time.",
      tired: "🌵 I hear you. Let's focus on smaller, manageable tasks today. You've got this!",
      stressed: "🌵 Take a deep breath. We'll break things down into bite-sized pieces.",
      sad: "🌵 Sending you virtual hugs! Sometimes the best thing is to start with just one small task."
    };

    const mikeResponse = mikeResponses[emotionalState as keyof typeof mikeResponses] || 
                       "🌵 Thanks for sharing! I'm here to support you today.";

    const { data, error } = await serviceSupabase
      .from('daily_checkins')
      .insert({
        user_id: userId,
        emotional_state: emotionalState,
        message: message || null,
        mike_response: mikeResponse
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, mikeResponse };
  } catch (error) {
    console.error('Error creating daily check-in:', error);
    throw error;
  }
}