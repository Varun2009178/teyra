import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qaixpzbbqocssdznztev.supabase.co',
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Manual email system test triggered')
    
    // Get users who haven't been active for 48+ hours (for emails)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    
    const { data: users, error } = await supabase
      .from('user_stats')
      .select('user_id, email, last_completed_date, all_time_completed, timezone, last_activity_at, created_at, last_daily_reset')
      .eq('notifications_enabled', true)
      .not('email', 'is', null)
      .neq('email', 'null') // Also exclude string "null" values
      .neq('email', '') // Also exclude empty strings
      .lt('last_activity_at', fortyEightHoursAgo)

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        message: 'No users to notify (all users have been active for less than 48 hours)',
        testInfo: {
          fortyEightHoursAgo,
          totalUsers: 0
        }
      })
    }

    console.log(`📧 Found ${users.length} users who haven't been active for 48+ hours`)

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
        
        console.log(`📧 Would send ${emailType} to ${user.email} (${hoursSinceActivity}h since last activity, timezone: ${userTimezone}) - 48h+ inactive`)

        // For testing, we'll just log instead of actually sending emails
        console.log(`✅ Would send email to ${user.email} (${emailType})`)
        
        emailsSent++
      } catch (error) {
        errors++
        console.error(`❌ Error processing user ${user.user_id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      errors,
      totalUsers: users.length,
      message: `Would have sent ${emailsSent} emails to users inactive for 48+ hours`,
      testInfo: {
        fortyEightHoursAgo,
        usersProcessed: users.map(u => ({
          userId: u.user_id,
          email: u.email,
          lastActivity: u.last_activity_at,
          hoursSinceActivity: Math.floor((Date.now() - new Date(u.last_activity_at).getTime()) / (1000 * 60 * 60))
        }))
      }
    })

  } catch (error) {
    console.error('Email system test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 