import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qaixpzbbqocssdznztev.supabase.co',
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

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
        .select('user_id, email, last_daily_reset, mood_checkins_today, ai_splits_today')
        .eq('user_id', userId)
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
        .select('user_id, email, last_daily_reset, mood_checkins_today, ai_splits_today')
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
        // Get user's tasks before clearing them
        const { data: userTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, completed, "createdAt"')
          .eq('"userId"', user.user_id)
          .order('"createdAt"', { ascending: true })

        if (tasksError) {
          console.error(`Error fetching tasks for user ${user.user_id}:`, tasksError)
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
        
        await supabase
          .from('user_stats')
          .update(updateData)
          .eq('user_id', user.user_id)

        // Delete all tasks for this user
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('"userId"', user.user_id)
        if (!deleteError) tasksCleared++

        // Send reset email with task summary
        if (user.email) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                name: 'there',
                type: 'daily_reset',
                taskSummary: taskSummary
              }),
            })

            if (response.ok) {
              console.log(`✅ Sent daily reset email to ${user.email}`)
              emailsSent++
            } else {
              console.error(`❌ Failed to send reset email to ${user.email}`)
            }
          } catch (emailError) {
            console.error(`❌ Error sending reset email to ${user.email}:`, emailError)
          }
        }

        resetsCompleted++
        console.log(`✅ Reset completed for user ${user.user_id}: ${completedTasks.length} completed, ${notCompletedTasks.length} not completed tasks`)
      } catch (error) {
        errors++
        console.error(`❌ Error resetting user ${user.user_id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      resetsCompleted,
      emailsSent,
      tasksCleared,
      errors,
      totalUsers: users.length,
      message: `Reset daily limits, cleared tasks, and sent emails for ${resetsCompleted} users`,
      testInfo: {
        twentyFourHoursAgo,
        usersProcessed: users.map(u => ({
          userId: u.user_id,
          email: u.email
        }))
      }
    })

  } catch (error) {
    console.error('Daily reset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 