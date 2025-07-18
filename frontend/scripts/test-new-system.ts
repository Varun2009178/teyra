import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

async function testNewSystem() {
  console.log('🧪 Testing new 24-hour reset and 48-hour email system...\n')

  try {
    // Get all users
    const { data: allUsers, error: fetchError } = await supabase
      .from('user_stats')
      .select('user_id, email, last_daily_reset, last_activity_at, mood_checkins_today, ai_splits_today, notifications_enabled')

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError)
      return
    }

    if (!allUsers || allUsers.length === 0) {
      console.log('ℹ️ No users found in database')
      return
    }

    console.log(`📊 Found ${allUsers.length} users in database\n`)

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    console.log('⏰ Time references:')
    console.log(`   Now: ${now.toISOString()}`)
    console.log(`   24h ago: ${twentyFourHoursAgo.toISOString()}`)
    console.log(`   48h ago: ${fortyEightHoursAgo.toISOString()}\n`)

    // Analyze each user
    let needsDailyReset = 0
    let needsEmail = 0
    let activeUsers = 0

    for (const user of allUsers) {
      const lastReset = user.last_daily_reset ? new Date(user.last_daily_reset) : null
      const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null

      console.log(`👤 User: ${user.email || 'No email'} (${user.user_id})`)
      console.log(`   Last daily reset: ${lastReset ? lastReset.toISOString() : 'Never'}`)
      console.log(`   Last activity: ${lastActivity ? lastActivity.toISOString() : 'Never'}`)
      console.log(`   Mood check-ins today: ${user.mood_checkins_today}`)
      console.log(`   AI splits today: ${user.ai_splits_today}`)
      console.log(`   Notifications enabled: ${user.notifications_enabled}`)

      // Check if needs daily reset
      const needsReset = !lastReset || lastReset < twentyFourHoursAgo
      if (needsReset) {
        needsDailyReset++
        console.log(`   🔄 NEEDS DAILY RESET`)
      }

      // Check if needs email (48+ hours inactive)
      const needsEmailNotification = user.notifications_enabled && 
                                   user.email && 
                                   lastActivity && 
                                   lastActivity < fortyEightHoursAgo
      if (needsEmailNotification) {
        needsEmail++
        console.log(`   📧 NEEDS EMAIL (${Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60))}h inactive)`)
      }

      if (!needsReset && !needsEmailNotification) {
        activeUsers++
        console.log(`   ✅ Active user`)
      }

      console.log('')
    }

    console.log('📈 Summary:')
    console.log(`   Total users: ${allUsers.length}`)
    console.log(`   Need daily reset: ${needsDailyReset}`)
    console.log(`   Need email (48h+ inactive): ${needsEmail}`)
    console.log(`   Active users: ${activeUsers}`)

    // Test the daily reset endpoint
    console.log('\n🔄 Testing daily reset endpoint...')
    const resetResponse = await fetch('http://localhost:3000/api/daily-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (resetResponse.ok) {
      const resetResult = await resetResponse.json()
      console.log('✅ Daily reset test result:', resetResult)
    } else {
      console.log('❌ Daily reset test failed:', await resetResponse.text())
    }

    // Test the email system endpoint
    console.log('\n📧 Testing email system endpoint...')
    const emailResponse = await fetch('http://localhost:3000/api/test-email-system')
    
    if (emailResponse.ok) {
      const emailResult = await emailResponse.json()
      console.log('✅ Email system test result:', emailResult)
    } else {
      console.log('❌ Email system test failed:', await emailResponse.text())
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testNewSystem() 