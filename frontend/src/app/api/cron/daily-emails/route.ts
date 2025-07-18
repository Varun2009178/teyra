import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qaixpzbbqocssdznztev.supabase.co',
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron service
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users who have enabled notifications and haven't been active for 48+ hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    
    const { data: users, error } = await supabase
      .from('user_stats')
      .select('user_id, email, last_completed_date, all_time_completed, timezone, last_activity_at, created_at')
      .eq('notifications_enabled', true)
      .not('email', 'is', null)
      .neq('email', 'null') // Also exclude string "null" values
      .neq('email', '') // Also exclude empty strings
      .lt('last_activity_at', fortyEightHoursAgo)
      // Only send emails to users inactive for 48+ hours

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to notify (all users have been active for less than 48 hours)' })
    }

    console.log(`📧 Found ${users.length} users who haven't been active for 48+ hours`)

    // Disable notifications for users who haven't been active for 48+ hours
    const { data: inactiveUsers, error: disableError } = await supabase
      .from('user_stats')
      .update({ notifications_enabled: false })
      .eq('notifications_enabled', true)
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
        const userCreatedDate = new Date(user.created_at).toISOString().split('T')[0]
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
          .eq('user_id', user.user_id)

        // Send email
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: 'there', // We'll need to get the actual name from Clerk or store it
            type: emailType,
            timezone: userTimezone,
            hoursSinceActivity
          }),
        })

        if (response.ok) {
          emailsSent++
          console.log(`✅ Email sent to ${user.email} (${emailType})`)
        } else {
          errors++
          console.error(`❌ Failed to send email to ${user.email}`)
        }
      } catch (error) {
        errors++
        console.error(`❌ Error sending email to ${user.email}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      errors,
      totalUsers: users.length,
      message: `Sent ${emailsSent} emails to users inactive for 48+ hours`
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 