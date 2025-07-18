import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaixpzbbqocssdznztev.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhaXhwemJicW9jc3Nkem56dGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDcxODIsImV4cCI6MjA2ODI4MzE4Mn0.8A4y5Xoe-kWQhCqS1kSQtBZQHHEvfK1z2xBxFDEPsD8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCountdownTimer() {
  console.log('🧪 Testing countdown timer functionality...\n')
  
  try {
    // Get a test user
    const { data: users, error: userError } = await supabase
      .from('user_stats')
      .select('user_id, email, last_daily_reset, last_activity_at, timezone')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found:', userError)
      return
    }

    const testUser = users[0]
    console.log('👤 Found test user:', {
      userId: testUser.user_id,
      email: testUser.email,
      lastDailyReset: testUser.last_daily_reset,
      lastActivityAt: testUser.last_activity_at,
      timezone: testUser.timezone
    })

    const now = new Date()
    console.log('🕐 Current time:', now.toISOString())

    // Test 1: Check if daily reset is due (24 hours from last reset)
    if (testUser.last_daily_reset) {
      const lastReset = new Date(testUser.last_daily_reset)
      const nextResetTime = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000)
      const resetDiff = nextResetTime.getTime() - now.getTime()
      const resetSeconds = Math.max(0, Math.floor(resetDiff / 1000))
      const resetHours = Math.floor(resetSeconds / 3600)
      const resetMinutes = Math.floor((resetSeconds % 3600) / 60)
      const resetSecs = resetSeconds % 60

      console.log('\n📊 Daily Reset Timer:')
      console.log(`   Last reset: ${lastReset.toISOString()}`)
      console.log(`   Next reset: ${nextResetTime.toISOString()}`)
      console.log(`   Time until reset: ${resetHours.toString().padStart(2, '0')}:${resetMinutes.toString().padStart(2, '0')}:${resetSecs.toString().padStart(2, '0')}`)
      console.log(`   Is reset due: ${resetSeconds === 0 ? 'YES' : 'NO'}`)
    } else {
      console.log('\n📊 Daily Reset Timer: No last reset found - reset is due!')
    }

    // Test 2: Check if email is due (48 hours from last activity)
    if (testUser.last_activity_at) {
      const lastActivity = new Date(testUser.last_activity_at)
      const nextEmailTime = new Date(lastActivity.getTime() + 48 * 60 * 60 * 1000)
      const emailDiff = nextEmailTime.getTime() - now.getTime()
      const emailSeconds = Math.max(0, Math.floor(emailDiff / 1000))
      const emailHours = Math.floor(emailSeconds / 3600)
      const emailMinutes = Math.floor((emailSeconds % 3600) / 60)
      const emailSecs = emailSeconds % 60

      console.log('\n📧 Email Timer:')
      console.log(`   Last activity: ${lastActivity.toISOString()}`)
      console.log(`   Next email: ${nextEmailTime.toISOString()}`)
      console.log(`   Time until email: ${emailHours.toString().padStart(2, '0')}:${emailMinutes.toString().padStart(2, '0')}:${emailSecs.toString().padStart(2, '0')}`)
      console.log(`   Is email due: ${emailSeconds === 0 ? 'YES' : 'NO'}`)
    } else {
      console.log('\n📧 Email Timer: No last activity found - email is due!')
    }

    // Test 3: Simulate setting last_daily_reset to 25 hours ago to trigger reset
    console.log('\n🔄 Testing reset trigger...')
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString()
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_stats')
      .update({ 
        last_daily_reset: twentyFiveHoursAgo,
        mood_checkins_today: 1, // Set to 1 to show it gets reset
        ai_splits_today: 2 // Set to 2 to show it gets reset
      })
      .eq('user_id', testUser.user_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to update user:', updateError)
      return
    }

    console.log('✅ User updated successfully with 25-hour-old reset time')
    console.log('   New last_daily_reset:', updatedUser.last_daily_reset)
    console.log('   mood_checkins_today:', updatedUser.mood_checkins_today)
    console.log('   ai_splits_today:', updatedUser.ai_splits_today)

    // Test 4: Calculate the new timer values
    const newLastReset = new Date(updatedUser.last_daily_reset!)
    const newNextResetTime = new Date(newLastReset.getTime() + 24 * 60 * 60 * 1000)
    const newResetDiff = newNextResetTime.getTime() - now.getTime()
    const newResetSeconds = Math.max(0, Math.floor(newResetDiff / 1000))

    console.log('\n🎯 After update:')
    console.log(`   New next reset: ${newNextResetTime.toISOString()}`)
    console.log(`   Time until reset: ${Math.floor(newResetSeconds / 3600)}:${Math.floor((newResetSeconds % 3600) / 60)}:${newResetSeconds % 60}`)
    console.log(`   Is reset due: ${newResetSeconds === 0 ? 'YES' : 'NO'}`)

    console.log('\n🎯 Next steps:')
    console.log('1. Start your dev server: npm run dev')
    console.log('2. Visit the dashboard')
    console.log('3. Check the countdown timer - it should show reset is due!')
    console.log('4. The notification should appear automatically')
    console.log('5. Click "Test Reset" in dev mode to trigger the reset')
    console.log('6. Watch the timer reset to 24:00:00')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testCountdownTimer() 