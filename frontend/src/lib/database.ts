import { SupabaseClient } from '@supabase/supabase-js'
import { Task, UserStats } from './types' // We'll create this file next

// Schema detection based on environment and actual database structure
function getSchema(): 'mixed' | 'snake_case' {
  // After migrations, all tables use camelCase column names
  return 'mixed'
}

// Get the correct column name based on schema and table
function getUserIdColumn(table?: string): string {
  // After migration 008, all tables use 'userId'
  return 'userId'
}

function getCreatedAtColumn(table?: string): string {
  // After migration 008, all tables use 'createdAt'
  return 'createdAt'
}

// Task operations
export async function getTasks(supabase: SupabaseClient, userId: string): Promise<Task[]> {
  console.log('🔄 getTasks called with userId:', userId)
  
  if (!userId) {
    console.error('❌ No userId provided to getTasks')
    return []
  }
  
  try {
    const userIdCol = getUserIdColumn('tasks')
    const createdAtCol = getCreatedAtColumn('tasks')
    
    console.log('🔍 Using schema:', getSchema(), 'with columns:', { userIdCol, createdAtCol })
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq(userIdCol, userId)
      .order(createdAtCol, { ascending: false })

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
        id: task.id || `temp_${Date.now()}_${Math.random()}`, // Ensure we always have an ID
        userId: task.userId,
        title: task.title,
        completed: task.completed || false,
        createdAt: task.createdAt || new Date().toISOString(),
        completedAt: task.completedAt || task.completedat,
        assignedDate: task.assignedDate || task.assigneddate,
        expired: task.expired || false,
        hasBeenSplit: task.has_been_split || false
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
  
  const schema = getSchema()
  
  const taskData: Record<string, unknown> = {
    title: text.trim(),
    completed: false,
    has_been_split: isSplitTasks,
    createdAt: new Date().toISOString(),
    expired: false
  }
  
  console.log('📤 Inserting task data:', taskData)
  
  try {
    // Add userId with correct column name
    const userIdCol = getUserIdColumn('tasks')
    const query = supabase.from('tasks').insert([{ ...taskData, [userIdCol]: userId }])
    
    const { data, error } = await query.select().single()

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
      id: data.id || `temp_${Date.now()}_${Math.random()}`, // Ensure we always have an ID
      userId: data.userId,
      title: data.title,
      completed: data.completed,
      createdAt: data.createdAt,
      completedAt: data.completedAt || data.completedat,
      assignedDate: data.assignedDate || data.assigneddate,
      expired: data.expired || false,
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
    
    const schema = getSchema()
    
    // Convert field names to match database schema
    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed
    if (updates.hasBeenSplit !== undefined) dbUpdates.has_been_split = updates.hasBeenSplit
    
    // Add userId with correct column name
    if (updates.userId !== undefined) {
      const userIdCol = getUserIdColumn('tasks')
      dbUpdates[userIdCol] = updates.userId
    }
    
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
      createdAt: data.createdAt,
      completedAt: data.completedAt || data.completedat,
      assignedDate: data.assignedDate || data.assigneddate,
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
  
  const schema = getSchema()
  const userIdCol = getUserIdColumn('tasks')
  
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
  
  const schema = getSchema()
  const userIdCol = getUserIdColumn('tasks')
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq(userIdCol, userId)
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
  
  const schema = getSchema()
  const userIdCol = getUserIdColumn('tasks')
  
  try {
    // First, check if the task exists
    const { data: existingTask, error: checkError } = await supabase
      .from('tasks')
      .select('*')
      .eq(userIdCol, userId)
      .eq('title', title)
      .limit(1)
      .single()

    if (checkError) {
      console.error('❌ Task not found with title:', title)
      console.error('❌ Check error details:', checkError)
      // Return null instead of throwing error - this allows the UI to continue working
      return null
    }

    if (!existingTask) {
      console.warn('⚠️ No task found to update with title:', title)
      return null
    }

    // Convert field names to match database schema
    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed
    if (updates.hasBeenSplit !== undefined) dbUpdates.has_been_split = updates.hasBeenSplit
    
    // Add userId with correct column name
    if (updates.userId !== undefined) {
      const userIdColForUpdate = getUserIdColumn('tasks')
      dbUpdates[userIdColForUpdate] = updates.userId
    }
    
    console.log('🔄 Converted updates for database:', dbUpdates)
    
    // Update the task by ID instead of title to avoid conflicts
    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', existingTask.id)
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
      return null
    }

    // Transform data to match TypeScript interface
    const transformedData = {
      id: data.id, // Keep the original ID, even if it's null
      userId: data.userId,
      title: data.title,
      completed: data.completed,
      createdAt: data.createdAt,
      completedAt: data.completedAt || data.completedat,
      assignedDate: data.assignedDate || data.assigneddate,
      expired: data.expired || false,
      hasBeenSplit: data.has_been_split || false
    }

    console.log('✅ Task updated by title successfully:', transformedData)
    return transformedData
  } catch (err) {
    console.error('❌ Exception in updateTaskByTitle:', err)
    // Return null instead of throwing error - this allows the UI to continue working
    return null
  }
}

export async function deleteAllTasks(supabase: SupabaseClient, userId: string): Promise<void> {
  if (!userId) return
  const schema = getSchema()
  const userIdCol = getUserIdColumn('tasks')
  await supabase.from('tasks').delete().eq(userIdCol, userId)
}

// User stats operations
export async function getUserStats(supabase: SupabaseClient, userId: string): Promise<UserStats | null> {
  console.log('📊 getUserStats called with userId:', userId)
  
  if (!userId) {
    console.error('❌ No userId provided to getUserStats')
    return null
  }
  
  try {
    const schema = getSchema()
    const userIdCol = getUserIdColumn('user_stats')
    
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq(userIdCol, userId)
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
  
  const schema = getSchema()
  
  // Create the base data object
  const userStatsData: Record<string, unknown> = {
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
    // Add userId with correct column name
    const userIdCol = getUserIdColumn('user_stats')
    const query = supabase.from('user_stats').insert([{ ...userStatsData, [userIdCol]: userId }])
    
    const { data, error } = await query.select().single()

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
    const schema = getSchema()
    const userIdCol = getUserIdColumn('user_stats')
    
    const { data, error } = await supabase
      .from('user_stats')
      .update(updates)
      .eq(userIdCol, userId)
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
    console.error('❌ Error incrementing AI split count:', err)
    throw err
  }
}

// Fix completed tasks count by counting actual completed tasks
export async function fixCompletedTasksCount(supabase: SupabaseClient, userId: string): Promise<{ fixed: boolean; oldCount: number; newCount: number }> {
  console.log('🔧 fixCompletedTasksCount called with userId:', userId)
  
  try {
    const userIdCol = getUserIdColumn('tasks')
    
    // Get all completed tasks for this user
    const { data: completedTasks, error } = await supabase
      .from('tasks')
      .select('id')
      .eq(userIdCol, userId)
      .eq('completed', true)

    if (error) {
      console.error('❌ Error fetching completed tasks:', error)
      throw error
    }

    const actualCompletedCount = completedTasks?.length || 0
    
    // Get current user stats
    const userStats = await getUserStats(supabase, userId)
    if (!userStats) {
      console.log('📝 No user stats found, cannot fix count')
      return { fixed: false, oldCount: 0, newCount: 0 }
    }

    const oldCount = userStats.all_time_completed || 0
    
    if (oldCount !== actualCompletedCount) {
      console.log(`🔧 Fixing completed count: ${oldCount} → ${actualCompletedCount}`)
      
      await updateUserStats(supabase, userId, {
        all_time_completed: actualCompletedCount
      })
      
      return { fixed: true, oldCount, newCount: actualCompletedCount }
    } else {
      console.log('✅ Completed count is already correct')
      return { fixed: false, oldCount, newCount: actualCompletedCount }
    }
  } catch (err) {
    console.error('❌ Error fixing completed tasks count:', err)
    throw err
  }
} 