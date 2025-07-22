import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userProgress } from '@/lib/schema'
import { lt, eq } from 'drizzle-orm'

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Daily emails cron job triggered')

    // Get all users who have been inactive for 48+ hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
    
    // Get all user progress records
    const allUsers = await db
      .select()
      .from(userProgress)
    
    // Filter users who have been inactive for 48+ hours
    const inactiveUsers = allUsers.filter(user => {
      const lastActivity = user.updatedAt || user.createdAt
      return lastActivity < fortyEightHoursAgo
    })

    if (inactiveUsers.length === 0) {
      return NextResponse.json({ 
        message: 'No users need email notifications',
        testInfo: {
          fortyEightHoursAgo,
          totalUsers: allUsers.length,
          inactiveUsers: 0
        }
      })
    }

    console.log(`📧 Found ${inactiveUsers.length} users who need email notifications`)

    let emailsSent = 0
    let errors = 0

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

        // Reset daily limits for this user
        await db
          .update(userProgress)
          .set({ 
            dailyMoodChecks: 0,
            dailyAISplits: 0,
            lastResetDate: new Date(),
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
          console.log(`✅ Email sent successfully to user ${user.userId}`)
        } else {
          errors++
          console.error(`❌ Failed to send email to user ${user.userId}:`, await response.text())
        }

      } catch (error) {
        errors++
        console.error(`❌ Error processing user ${user.userId}:`, error)
      }
    }

    console.log(`📧 Daily emails completed: ${emailsSent} sent, ${errors} errors`)

    return NextResponse.json({
      success: true,
      message: `Daily emails processed: ${emailsSent} sent, ${errors} errors`,
      stats: {
        totalUsers: allUsers.length,
        inactiveUsers: inactiveUsers.length,
        emailsSent,
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