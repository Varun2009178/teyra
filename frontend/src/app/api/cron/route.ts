import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qaixpzbbqocssdznztev.supabase.co',
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
      .select('user_id, email, last_daily_reset, mood_checkins_today, ai_splits_today')
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
          await supabase
            .from('user_stats')
            .update({ 
              mood_checkins_today: 0,
              ai_splits_today: 0,
              last_daily_reset: new Date().toISOString()
            })
            .eq('user_id', user.user_id)
          
          // Delete all tasks for this user
          const { error: deleteError } = await supabase
            .from('tasks')
            .delete()
            .eq('user_id', user.user_id)
          if (!deleteError) tasksCleared++

          // Send reset email (pseudo-code)
          if (user.email) {
            // await resend.emails.send({
            //   to: user.email,
            //   subject: 'Your daily mood and AI task limits have reset!',
            //   html: `<p>Your mood check-in and AI-powered task split limits have been refreshed. Come back and start fresh!</p>`
            // })
            console.log(`✅ Would send reset email to ${user.email}`)
            emailsSent++
          }

          resetsCompleted++
        } catch (error) {
          console.error(`❌ Error resetting user ${user.user_id}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      resetsCompleted,
      emailsSent,
      tasksCleared,
      message: `Daily reset completed for ${resetsCompleted} users, ${emailsSent} reset emails sent, ${tasksCleared} users' tasks cleared`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 