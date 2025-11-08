import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'

// Service role client for admin operations
export const serviceSupabase = createClient(
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

export async function createTask(userId: string, title: string, limit?: string, hasBeenSplit?: boolean) {
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
        has_been_split: hasBeenSplit || false,
      })
      .select()
      .single()

    if (error) throw error

    // If this is their first task, lock them for 24 hours
    if (isFirstTask) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔒 Locking user ${userId.slice(-8)} after first task creation`)
      }
      
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

export async function updateTask(taskId: number, data: {
  completed?: boolean;
  title?: string;
  has_been_split?: boolean;
  scheduled_time?: string;
  duration_minutes?: number;
  google_event_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
  due_date?: string | null;
  subtasks?: any[] | null;
  tags?: string[] | null;
}) {
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
    if (data.scheduled_time !== undefined) {
      updateData.scheduled_time = data.scheduled_time
    }
    if (typeof data.duration_minutes === 'number') {
      updateData.duration_minutes = data.duration_minutes
    }
    if (data.google_event_id !== undefined) {
      updateData.google_event_id = data.google_event_id
    }
    if (data.priority !== undefined) {
      updateData.priority = data.priority
    }
    if (data.due_date !== undefined) {
      updateData.due_date = data.due_date
    }
    if (data.subtasks !== undefined) {
      updateData.subtasks = data.subtasks
    }
    if (data.tags !== undefined) {
      updateData.tags = data.tags
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
    // Attempting to delete task
    
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
    
    // Milestone system: 0→100→150→200 with progress bar reset
    let currentMilestone = 1
    let maxValue = 100
    let displayCompleted = allTimeCompleted
    let mood = 'sad' // Default sad cactus
    
    if (allTimeCompleted >= 200) {
      // Happy cactus - maxed out at 200
      currentMilestone = 4
      maxValue = 200
      displayCompleted = allTimeCompleted // Show full count for maxed out
      mood = 'happy'
    } else if (allTimeCompleted >= 150) {
      // Working towards happy (150→200) - reset progress bar and show out of 200
      currentMilestone = 3
      maxValue = 200
      displayCompleted = allTimeCompleted - 150 // Reset: 0-49 progress within this milestone
      mood = 'happy'
    } else if (allTimeCompleted >= 100) {
      // Medium cactus achieved! Working towards next milestone (100→150) - reset progress bar
      currentMilestone = 2  
      maxValue = 150
      displayCompleted = allTimeCompleted - 100 // Reset: 0-49 progress within this milestone
      mood = 'neutral'
    } else {
      // Working towards first milestone (0→100)
      currentMilestone = 1
      maxValue = 100
      displayCompleted = allTimeCompleted // 0-99 progress towards first milestone
      mood = allTimeCompleted >= 100 ? 'neutral' : 'sad' // Neutral when reaching first milestone
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

    // ATOMIC CHECK: First check if user already exists to prevent duplicates
    const { data: existingUser, error: checkError } = await serviceSupabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingUser) {
      console.log(`✅ User ${userId} already exists, returning existing record`)
      return existingUser
    }

    // User doesn't exist, create them
    const { data, error } = await serviceSupabase
      .from('user_progress')
      .insert({
        user_id: userId,
        current_mood: 'sad',
        daily_mood_checks: 0,
        last_mood_update: new Date().toISOString(),
        last_reset_date: new Date().toISOString(),
        total_points: 0,
        tasks_completed: 0,
        mood_selections: 0,
        ai_splits_used: 0,
        notifications_enabled: true,
        email_notifications_enabled: true
      })
      .select()
      .single()

    if (error) {
      // Handle race condition: if another process created the user between our check and insert
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        console.log(`⚠️ Race condition detected for ${userId}, fetching existing record`)
        const { data: existingRecord } = await serviceSupabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (existingRecord) {
          console.log(`✅ Retrieved existing record for ${userId} after race condition`)
          return existingRecord
        }
      }
      throw error
    }

    if (!data) throw new Error(`Failed to create user progress for ${userId} - no record returned`)

    console.log(`✅ Created user progress for ${userId}`)
    return data
  } catch (error) {
    console.error(`❌ Error creating user progress for ${userId}:`, error)
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

    // Simply update the mood - don't increment counters or lock here
    // Counter increments happen in /api/mood endpoint after this function
    const updateData = {
      current_mood: mood,
      last_mood_update: new Date().toISOString(),
      updated_at: new Date().toISOString()
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