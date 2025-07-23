import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userProgress } from '@/lib/schema'
import { lt, eq } from 'drizzle-orm'
import { tasks } from '@/lib/schema'

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Daily emails cron job triggered')

    // Get all users who have been inactive for 48+ hours (motivational emails)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
    
    // Get all user progress records
    const allUsers = await db()
      .select()
      .from(userProgress)
    
    // Filter users who have been inactive for 48+ hours (motivational emails)
    const inactiveUsers = allUsers.filter(user => {
      const lastActivity = user.updatedAt || user.createdAt
      return lastActivity < fortyEightHoursAgo
    })

    // Filter users who need 24-hour reset emails
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const usersNeedingReset = allUsers.filter(user => {
      const lastReset = user.lastResetDate || user.createdAt
      return lastReset < twentyFourHoursAgo
    })

    console.log(`📧 Found ${inactiveUsers.length} users needing motivational emails`)
    console.log(`🔄 Found ${usersNeedingReset.length} users needing 24-hour reset emails`)

    let emailsSent = 0
    let errors = 0

    // Send motivational emails to inactive users
    for (const user of inactiveUsers) {
      try {
        // Calculate time since last activity
        const lastActivity = user.updatedAt || user.createdAt
        const hoursSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60))
        
        // Determine email type based on user's activity
        const userCreatedDate = new Date(user.createdAt).toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        let emailType = 'daily_checkin'
        if (userCreatedDate === yesterday || userCreatedDate === today) {
          emailType = 'first_task_reminder'
        } else if (user.allTimeCompleted === 1) {
          emailType = 'first_task_reminder'
        }
        
        console.log(`📧 Sending ${emailType} to user ${user.userId} (${hoursSinceActivity}h since last activity)`)

        // Update last activity timestamp for this user
        await db()
          .update(userProgress)
          .set({ 
            updatedAt: new Date()
          })
          .where(eq(userProgress.userId, user.userId))

        // Send email notification
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.userId, // Using userId as email for now
            name: 'there',
            type: emailType,
            timezone: 'UTC', // Default timezone
            hoursSinceActivity: hoursSinceActivity,
            userData: {
              tasks_completed: user.allTimeCompleted,
              current_streak: 0, // No streak tracking
              longest_streak: 0
            }
          }),
        })

        if (response.ok) {
          emailsSent++
          console.log(`✅ Motivational email sent successfully to user ${user.userId}`)
        } else {
          errors++
          console.error(`❌ Failed to send motivational email to user ${user.userId}:`, await response.text())
        }

      } catch (error) {
        errors++
        console.error(`❌ Error processing motivational email for user ${user.userId}:`, error)
      }
    }

    // Send 24-hour reset emails
    for (const user of usersNeedingReset) {
      try {
        console.log(`🔄 Sending 24-hour reset email to user ${user.userId}`)

        // Get user's current tasks for the summary
        const userTasks = await db()
          .select()
          .from(tasks)
          .where(eq(tasks.userId, user.userId))

        const completedTasks = userTasks.filter(task => task.completed)
        const incompleteTasks = userTasks.filter(task => !task.completed)

        // Send reset email
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.userId,
            name: 'there',
            type: 'daily_reset_trigger',
            timezone: 'UTC',
            userData: {
              user_id: user.userId,
              tasks_completed: user.allTimeCompleted,
              current_streak: 0,
              longest_streak: 0
            },
            taskSummary: {
              total: userTasks.length,
              completed_count: completedTasks.length,
              not_completed_count: incompleteTasks.length,
              completed: completedTasks.map(t => t.title),
              not_completed: incompleteTasks.map(t => t.title)
            }
          }),
        })

        if (response.ok) {
          emailsSent++
          console.log(`✅ Reset email sent successfully to user ${user.userId}`)
        } else {
          errors++
          console.error(`❌ Failed to send reset email to user ${user.userId}:`, await response.text())
        }

      } catch (error) {
        errors++
        console.error(`❌ Error processing reset email for user ${user.userId}:`, error)
      }
    }

    console.log(`📧 Daily emails completed: ${emailsSent} sent, ${errors} errors`)

    return NextResponse.json({
      success: true,
      message: 'Daily emails completed successfully',
      stats: {
        motivationalEmailsSent: inactiveUsers.length,
        resetEmailsSent: usersNeedingReset.length,
        totalEmailsSent: emailsSent,
        errors
      }
    })

  } catch (error) {
    console.error('❌ Daily emails cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 