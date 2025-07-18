import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🕐 Cron job triggered')
    
    // Step 1: 24-hour daily reset (regardless of activity)
    console.log('🔄 Processing 24-hour daily resets...')
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: usersForReset, error: resetError } = await supabase
      .from('user_stats')
      .select('userId, email, last_daily_reset, mood_checkins_today, ai_splits_today')
      .or(`last_daily_reset.is.null,last_daily_reset.lt.${twentyFourHoursAgo}`)

    if (resetError) {
      console.error('Error fetching users for daily reset:', resetError)
      return NextResponse.json({ error: 'Database error during reset', details: resetError }, { status: 500 })
    }

    let resetsCompleted = 0
    let emailsSent = 0
    let tasksCleared = 0

    if (usersForReset && usersForReset.length > 0) {
      console.log(`🔄 Found ${usersForReset.length} users who need daily reset`)

      for (const user of usersForReset) {
        try {
          // Reset daily limits for this user
          const { error: updateError } = await supabase
            .from('user_stats')
            .update({ 
              mood_checkins_today: 0,
              ai_splits_today: 0,
              last_daily_reset: new Date().toISOString()
            })
            .eq('userId', user.userId)

          if (updateError) {
            console.error(`❌ Error resetting user ${user.userId}:`, updateError)
            continue
          }

          resetsCompleted++
          console.log(`✅ Reset completed for user ${user.userId}`)

        } catch (error) {
          console.error(`❌ Error resetting user ${user.userId}:`, error)
        }
      }
    } else {
      console.log('✅ No users need daily reset')
    }

    // Step 2: 48-hour email notifications for inactive users
    console.log('📧 Processing 48-hour email notifications...')
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    
    const { data: usersForEmail, error: emailError } = await supabase
      .from('user_stats')
      .select('userId, email, last_activity_at, notifications_enabled')
      .eq('notifications_enabled', true)
      .lt('last_activity_at', fortyEightHoursAgo)

    if (emailError) {
      console.error('Error fetching users for email notifications:', emailError)
    } else if (usersForEmail && usersForEmail.length > 0) {
      console.log(`📧 Found ${usersForEmail.length} users who need email notifications`)

      for (const user of usersForEmail) {
        if (user.email) {
          try {
            // Send email notification
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                name: 'there',
                type: 'inactivity_reminder'
              }),
            })

            if (response.ok) {
              console.log(`✅ Sent inactivity email to ${user.email}`)
              emailsSent++
            } else {
              console.error(`❌ Failed to send inactivity email to ${user.email}`)
            }
          } catch (error) {
            console.error(`❌ Error sending inactivity email to ${user.email}:`, error)
          }
        }
      }
    } else {
      console.log('✅ No users need email notifications')
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job completed successfully',
      resetsCompleted,
      emailsSent,
      tasksCleared,
      totalUsers: (usersForReset?.length || 0) + (usersForEmail?.length || 0)
    })

  } catch (error) {
    console.error('❌ Cron job failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 