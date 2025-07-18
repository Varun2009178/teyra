import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

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
  // After migration 011, all tables use 'createdAt'
  return 'createdAt'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, forceReset } = body || {}
    
    console.log('🔄 Daily reset triggered', { userId, forceReset })
    
    let users = []
    
    if (forceReset && userId) {
      // Force reset for specific user
      console.log(`🔄 Force reset for user: ${userId}`)
      const { data: user, error: userError } = await supabase
        .from('user_stats')
        .select('userId, email, last_daily_reset, mood_checkins_today, ai_splits_today')
        .eq('userId', userId)
        .single()
      
      if (userError) {
        console.error('Error fetching user for force reset:', userError)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      users = [user]
    } else {
      // Get all users who need a daily reset (24 hours since last reset)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const { data: allUsers, error } = await supabase
        .from('user_stats')
        .select('userId, email, last_daily_reset, mood_checkins_today, ai_splits_today')
        .or(`last_daily_reset.is.null,last_daily_reset.lt.${twentyFourHoursAgo}`)
      
      if (error) {
        console.error('Error fetching users for daily reset:', error)
        return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
      }
      
      users = allUsers || []
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        message: forceReset ? 'User not found or no tasks to reset' : 'No users need daily reset',
        testInfo: {
          twentyFourHoursAgo: forceReset ? null : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          totalUsers: 0
        }
      })
    }

    console.log(`🔄 Found ${users.length} users who need daily reset`)

    let resetsCompleted = 0
    let emailsSent = 0
    let tasksCleared = 0
    let errors = 0

    for (const user of users) {
      try {
        // Get schema for this request
        const schema = getSchema()
        const userIdCol = getUserIdColumn('tasks')
        const createdAtCol = getCreatedAtColumn('tasks')
        
        console.log('🔍 Using schema:', schema, 'with columns:', { userIdCol, createdAtCol })
        
        // Get user's tasks before clearing them
        const { data: userTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, completed, ' + createdAtCol)
          .eq(userIdCol, user.userId)
          .order(createdAtCol, { ascending: true })

        if (tasksError) {
          console.error(`Error fetching tasks for user ${user.userId}:`, tasksError)
        }

        // Calculate task statistics with smarter missed task detection
        const completedTasks = userTasks?.filter(task => task.completed) || []
        const allIncompleteTasks = userTasks?.filter(task => !task.completed) || []
        const totalTasks = userTasks?.length || 0

        // Simple task counting - all incomplete tasks are "not completed"
        const notCompletedTasks = allIncompleteTasks

        // Store task summary for the popup
        const taskSummary = {
          completed: completedTasks.map(task => task.title),
          not_completed: notCompletedTasks.map(task => task.title),
          total: totalTasks,
          completed_count: completedTasks.length,
          not_completed_count: notCompletedTasks.length
        }

        // Reset daily limits for this user
        const updateData: Record<string, unknown> = {
          mood_checkins_today: 0,
          ai_splits_today: 0,
          last_daily_reset: new Date().toISOString()
        }
        
        // Try to store task summary if column exists
        try {
          updateData.last_task_summary = JSON.stringify(taskSummary)
        } catch (error) {
          console.log('⚠️ Could not store task summary (column may not exist)')
        }
        
        const { error: updateError } = await supabase
          .from('user_stats')
          .update(updateData)
          .eq('userId', user.userId)

        if (updateError) {
          console.error(`❌ Error resetting user ${user.userId}:`, updateError)
          errors++
          continue
        }

        resetsCompleted++
        console.log(`✅ Reset completed for user ${user.userId}: ${completedTasks.length} completed, ${notCompletedTasks.length} not completed tasks`)

      } catch (error) {
        console.error(`❌ Error resetting user ${user.userId}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      message: 'Daily reset completed',
      totalUsers: users.length,
      resetsCompleted,
      emailsSent,
      tasksCleared,
      errors,
      testInfo: {
        twentyFourHoursAgo: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        processedUsers: users.map(u => ({
          userId: u.userId,
          email: u.email,
          hadReset: !!u.last_daily_reset
        }))
      }
    })

  } catch (error) {
    console.error('❌ Daily reset failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 