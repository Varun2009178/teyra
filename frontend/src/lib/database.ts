import { SupabaseClient } from '@supabase/supabase-js'
import { Task, UserStats } from './types' // We'll create this file next

// Task operations
export async function getTasks(supabase: SupabaseClient, userId: string): Promise<Task[]> {
  console.log('🔄 getTasks called with userId:', userId)
  
  if (!userId) {
    console.error('❌ No userId provided to getTasks')
    return []
  }
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('"userId"', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching tasks:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status
      })
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    console.log('📊 Raw tasks data:', data)

    // Transform data to match TypeScript interface
    const transformedData = (data || []).map((task: Record<string, unknown>) => {
      if (!task) {
        console.warn('⚠️ Skipping null task in data')
        return null
      }
      
      return {
        id: task.id, // Keep the original ID, even if it's null
        userId: task.userId,
        title: task.title,
        completed: task.completed || false,
        createdAt: task.created_at, // Fixed: use created_at from database
        completedAt: task.completed_at, // Fixed: use completed_at from database
        assignedDate: task.assigned_date, // Fixed: use assigned_date from database
        expired: task.expired
      }
    }).filter(Boolean) // Remove any null entries

    console.log('✅ Transformed tasks:', transformedData)
    return transformedData
  } catch (err) {
    console.error('❌ Exception in getTasks:', err)
    throw err
  }
}

export async function createTask(supabase: SupabaseClient, userId: string, text: string, isSplitTasks: boolean = false): Promise<Task | null> {
  console.log('🗄️ createTask called with:', { userId, text, isSplitTasks })
  
  if (!userId || !text.trim()) {
    console.error('❌ Invalid userId or text provided')
    return null
  }
  
  const taskData = {
    "userId": userId,
    title: text.trim(),
    completed: false,
    has_been_split: isSplitTasks
  }
  
  console.log('📤 Inserting task data:', taskData)
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating task:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status
      })
      throw new Error(`Task creation failed: ${error.message}`)
    }

    if (!data) {
      console.error('❌ No data returned from task creation')
      throw new Error('Task creation failed: No data returned')
    }

    // Transform data to match TypeScript interface
    const transformedData = {
      id: data.id, // Keep the original ID, even if it's null
      userId: data.userId,
      title: data.title,
      completed: data.completed,
      createdAt: data.created_at, // Fixed: use created_at from database
      completedAt: data.completed_at, // Fixed: use completed_at from database
      assignedDate: data.assigned_date, // Fixed: use assigned_date from database
      expired: data.expired,
      hasBeenSplit: data.has_been_split || false
    }

    console.log('✅ Task created successfully:', transformedData)
    return transformedData
  } catch (err) {
    console.error('❌ Exception in createTask:', err)
    throw err
  }
}

export async function updateTask(supabase: SupabaseClient, taskId: string, updates: Partial<Task>): Promise<Task | null> {
  console.log('🔄 updateTask called with:', { taskId, updates })
  console.log('🔍 taskId type:', typeof taskId, 'value:', taskId)
  console.log('🔍 updates:', updates)
  
  if (!taskId) {
    console.error('❌ taskId is null or undefined')
    throw new Error('taskId is null or undefined')
  }
  
  if (!supabase) {
    console.error('❌ supabase client is null or undefined')
    throw new Error('supabase client is null or undefined')
  }
  
  try {
    // If taskId is null, we can't update by ID, so we'll need to handle this differently
    // For now, let's just return null to prevent errors
    if (taskId === null || taskId === 'null') {
      console.warn('⚠️ Cannot update task with null ID')
      throw new Error('Cannot update task with null ID')
    }
    
    // Convert field names to match database schema
    const dbUpdates: any = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed
    if (updates.userId !== undefined) dbUpdates["userId"] = updates.userId
    if (updates.hasBeenSplit !== undefined) dbUpdates.has_been_split = updates.hasBeenSplit
    
    console.log('🔄 Converted updates for database:', dbUpdates)
    
    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', taskId)
      .select()
      .single()

    console.log('📡 Supabase response:', { data, error })

    if (error) {
      console.error('❌ Error updating task:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw new Error(`Failed to update task: ${error.message}`)
    }

    // Transform data to match TypeScript interface
    const transformedData = {
      id: data.id,
      userId: data.userId,
      title: data.title,
      completed: data.completed,
      createdAt: data.created_at, // Fixed: use created_at from database
      completedAt: data.completed_at, // Fixed: use completed_at from database
      assignedDate: data.assigned_date, // Fixed: use assigned_date from database
      expired: data.expired,
      hasBeenSplit: data.has_been_split || false
    }

    console.log('✅ Task updated successfully:', transformedData)
    return transformedData
  } catch (err) {
    console.error('❌ Exception in updateTask:', err)
    throw err
  }
}

export async function deleteTask(supabase: SupabaseClient, taskId: string): Promise<boolean> {
  console.log('🗄️ deleteTask called with taskId:', taskId)
  
  if (!taskId || taskId === 'null') {
    console.error('❌ Cannot delete task with null or invalid ID')
    return false
  }
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('❌ Error deleting task from database:', error)
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    return false
  }

  console.log('✅ Task deleted from database successfully')
  return true
}

// Delete task by userId and title (for tasks with null IDs)
export async function deleteTaskByTitle(supabase: SupabaseClient, userId: string, title: string): Promise<boolean> {
  console.log('🗄️ deleteTaskByTitle called with:', { userId, title })
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('"userId"', userId)
    .eq('title', title)

  if (error) {
    console.error('❌ Error deleting task by title from database:', error)
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    return false
  }

  console.log('✅ Task deleted from database by title successfully')
  return true
}

// Update task by userId and title (for tasks with null IDs)
export async function updateTaskByTitle(supabase: SupabaseClient, userId: string, title: string, updates: Partial<Task>): Promise<Task | null> {
  console.log('🔄 updateTaskByTitle called with:', { userId, title, updates })
  
  if (!userId || !title) {
    console.error('❌ Invalid userId or title provided')
    throw new Error('Invalid userId or title provided')
  }
  
  try {
    // Convert field names to match database schema
    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed
    if (updates.userId !== undefined) dbUpdates["userId"] = updates.userId
    if (updates.hasBeenSplit !== undefined) dbUpdates.has_been_split = updates.hasBeenSplit
    
    console.log('🔄 Converted updates for database:', dbUpdates)
    
    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('"userId"', userId)
      .eq('title', title)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating task by title from database:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw new Error(`Failed to update task by title: ${error.message}`)
    }

    if (!data) {
      console.warn('⚠️ No task found to update with title:', title)
      throw new Error(`No task found with title: ${title}`)
    }

    // Transform data to match TypeScript interface
    const transformedData = {
      id: data.id, // Keep the original ID, even if it's null
      userId: data.userId,
      title: data.title,
      completed: data.completed,
      createdAt: data.createdAt,
      completedAt: data.completedAt,
      assignedDate: data.assignedDate,
      expired: data.expired,
      hasBeenSplit: data.has_been_split || false
    }

    console.log('✅ Task updated by title successfully:', transformedData)
    return transformedData
  } catch (err) {
    console.error('❌ Exception in updateTaskByTitle:', err)
    throw err
  }
}

export async function deleteAllTasks(supabase: SupabaseClient, userId: string): Promise<void> {
  if (!userId) return
  await supabase.from('tasks').delete().eq('"userId"', userId)
}

// User stats operations
export async function getUserStats(supabase: SupabaseClient, userId: string): Promise<UserStats | null> {
  console.log('📊 getUserStats called with userId:', userId)
  
  if (!userId) {
    console.error('❌ No userId provided to getUserStats')
    return null
  }
  
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('"userId"', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📝 No user stats found, returning null')
        return null // Don't auto-create, let the dashboard handle it
      }
      console.error('❌ Error fetching user stats:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status
      })
      throw new Error(`Failed to fetch user stats: ${error.message}`)
    }

    console.log('✅ User stats fetched successfully:', data)
    return data
  } catch (err) {
    console.error('❌ Exception in getUserStats:', err)
    throw err
  }
}

export async function createUserStats(supabase: SupabaseClient, userId: string, userEmail?: string): Promise<UserStats | null> {
  console.log('🗄️ createUserStats called with userId:', userId, 'email:', userEmail)
  
  if (!userId) {
    console.error('❌ No userId provided to createUserStats')
    return null
  }
  
  const userStatsData = {
    "userId": userId,
    all_time_completed: 0,
    current_streak: 0,
    completed_this_week: 0,
    completed_today: 0,
    last_completed_date: null, // Changed from empty string to null to properly trigger onboarding
    subscription_level: 'free' as const, // Changed from 'basic' to 'free'
    ai_suggestions_enabled: true,
    user_mood: 'neutral' as const,
    show_analytics: true,
    notifications_enabled: true, // Auto-enable notifications for new users
    email: userEmail, // Include email if provided
    mood_checkins_today: 0,
    ai_splits_today: 0,
    last_daily_reset: new Date().toISOString(), // Set to current time for new users
    last_activity_at: new Date().toISOString(),
    timezone: 'UTC', // Will be updated when they first visit
  }
  
  console.log('📤 Inserting user stats data:', userStatsData)
  
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .insert([userStatsData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating user stats:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status
      })
      throw new Error(`Failed to create user stats: ${error.message}`)
    }

    if (!data) {
      console.error('❌ No data returned from user stats creation')
      throw new Error('User stats creation failed: No data returned')
    }

    console.log('✅ User stats created successfully:', data)
    return data
  } catch (err) {
    console.error('❌ Exception in createUserStats:', err)
    throw err
  }
}

export async function updateUserStats(supabase: SupabaseClient, userId: string, updates: Partial<UserStats>): Promise<UserStats | null> {
  console.log('🔄 updateUserStats called with:', { userId, updates })
  
  if (!userId) {
    console.error('❌ No userId provided to updateUserStats')
    return null
  }
  
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .update(updates)
      .eq('"userId"', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating user stats:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status
      })
      throw new Error(`Failed to update user stats: ${error.message}`)
    }

    if (!data) {
      console.warn('⚠️ No user stats found to update for userId:', userId)
      throw new Error(`No user stats found for userId: ${userId}`)
    }

    console.log('✅ User stats updated successfully:', data)
    return data
  } catch (err) {
    console.error('❌ Exception in updateUserStats:', err)
    throw err
  }
}

// Check if user can perform mood check-in (once per day)
export async function canPerformMoodCheckIn(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const userStats = await getUserStats(supabase, userId)
  if (!userStats) return false
  
  // Free users can only check in once per day
  if (userStats.subscription_level === 'free') {
    return (userStats.mood_checkins_today || 0) < 1
  }
  
  // Pro users can check in unlimited times
  return true
}

// Increment mood check-in count
export async function incrementMoodCheckIn(supabase: SupabaseClient, userId: string): Promise<void> {
  const userStats = await getUserStats(supabase, userId)
  if (!userStats) return
  
  const currentCount = userStats.mood_checkins_today || 0
  await updateUserStats(supabase, userId, {
    mood_checkins_today: currentCount + 1
  })
}

// Check if user can perform AI task splitting (2 per day for free users)
export async function canPerformAISplit(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const userStats = await getUserStats(supabase, userId)
  if (!userStats) return false
  
  // Free users can only split 2 tasks per day
  if (userStats.subscription_level === 'free') {
    return (userStats.ai_splits_today || 0) < 2
  }
  
  // Pro users can split unlimited tasks
  return true
}

// Increment AI split count
export async function incrementAISplit(supabase: SupabaseClient, userId: string): Promise<void> {
  console.log('🔄 incrementAISplit called with userId:', userId)
  
  try {
    // Get current count first
    const userStats = await getUserStats(supabase, userId)
    if (!userStats) return
    
    const currentCount = userStats.ai_splits_today || 0
    await updateUserStats(supabase, userId, {
      ai_splits_today: currentCount + 1
    })

    console.log('✅ AI split count incremented successfully')
  } catch (err) {
    console.error('❌ Exception in incrementAISplit:', err)
    throw err
  }
}

export async function fixCompletedTasksCount(supabase: SupabaseClient, userId: string): Promise<{ fixed: boolean; oldCount: number; newCount: number }> {
  console.log('🔧 fixCompletedTasksCount called with userId:', userId)
  
  try {
    // Get all completed tasks for the user
    const { data: completedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('"userId"', userId)
      .eq('completed', true)

    if (tasksError) {
      console.error('❌ Error fetching completed tasks:', tasksError)
      throw new Error(`Failed to fetch completed tasks: ${tasksError.message}`)
    }

    const actualCompletedCount = completedTasks?.length || 0
    console.log('📊 Actual completed tasks count:', actualCompletedCount)

    // Get current user stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('all_time_completed')
      .eq('"userId"', userId)
      .single()

    if (statsError) {
      console.error('❌ Error fetching user stats:', statsError)
      throw new Error(`Failed to fetch user stats: ${statsError.message}`)
    }

    const currentCount = userStats?.all_time_completed || 0
    console.log('📊 Current all_time_completed count:', currentCount)

    // Only update if there's a mismatch
    if (actualCompletedCount !== currentCount) {
      console.log('🔧 Fixing completed tasks count mismatch...')
      
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({ 
          all_time_completed: actualCompletedCount,
          updated_at: new Date().toISOString()
        })
        .eq('"userId"', userId)

      if (updateError) {
        console.error('❌ Error updating completed tasks count:', updateError)
        throw new Error(`Failed to update completed tasks count: ${updateError.message}`)
      }

      console.log('✅ Completed tasks count fixed successfully')
      return {
        fixed: true,
        oldCount: currentCount,
        newCount: actualCompletedCount
      }
    } else {
      console.log('✅ Completed tasks count is already correct')
      return {
        fixed: false,
        oldCount: currentCount,
        newCount: actualCompletedCount
      }
    }
  } catch (err) {
    console.error('❌ Exception in fixCompletedTasksCount:', err)
    throw err
  }
} 