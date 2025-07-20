import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Daily emails cron job triggered')

    // Get all users who have been inactive for 48+ hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    
    const { data: users, error } = await supabase
      .from('user_stats')
      .select('userId, email, last_completed_date, all_time_completed, timezone, last_activity_at, createdAt')
      .eq('notifications_enabled', true)
      .lt('last_activity_at', fortyEightHoursAgo)

    if (error) {
      console.error('Error fetching inactive users:', error)
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        message: 'No users need email notifications',
        testInfo: {
          fortyEightHoursAgo,
          totalUsers: 0
        }
      })
    }

    console.log(`📧 Found ${users.length} users who need email notifications`)

    // Disable notifications for users who have been inactive for too long
    const { error: disableError } = await supabase
      .from('user_stats')
      .update({ notifications_enabled: false })
      .lt('last_activity_at', fortyEightHoursAgo)

    if (disableError) {
      console.error('Error disabling notifications for inactive users:', disableError)
    } else {
      console.log(`🔕 Disabled notifications for users inactive for 48+ hours`)
    }

    let emailsSent = 0
    let errors = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    for (const user of users) {
      try {
        // Determine email type based on user's activity
        const userCreatedDate = new Date(user.createdAt).toISOString().split('T')[0]
        const isNewUser = userCreatedDate === yesterday || userCreatedDate === today
        
        let emailType = 'daily_checkin'
        if (isNewUser) {
          emailType = 'first_task_reminder'
        } else if (user.last_completed_date === yesterday && user.all_time_completed === 1) {
          emailType = 'first_task_reminder'
        }

        // Calculate time since last activity in user's timezone
        const userTimezone = user.timezone || 'UTC'
        const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : new Date()
        const hoursSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60))
        
        console.log(`📧 Sending ${emailType} to ${user.email} (${hoursSinceActivity}h since last activity, timezone: ${userTimezone}) - 48h+ inactive`)

        // Reset daily limits for this user
        await supabase
          .from('user_stats')
          .update({ 
            mood_checkins_today: 0,
            ai_splits_today: 0,
            last_daily_reset: new Date().toISOString()
          })
          .eq('userId', user.userId)

        // Send email notification
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: 'there',
            type: emailType,
            timezone: userTimezone,
            hoursInactive: hoursSinceActivity
          }),
        })

        if (response.ok) {
          console.log(`✅ Sent ${emailType} email to ${user.email}`)
          emailsSent++
        } else {
          console.error(`❌ Failed to send ${emailType} email to ${user.email}`)
          errors++
        }

      } catch (error) {
        console.error(`❌ Error processing user ${user.userId}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily emails completed',
      emailsSent,
      errors,
      totalUsers: users.length,
      testInfo: {
        fortyEightHoursAgo,
        processedUsers: users.map(u => ({
          userId: u.userId,
          email: u.email,
          lastActivity: u.last_activity_at
        }))
      }
    })

  } catch (error) {
    console.error('❌ Daily emails failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 