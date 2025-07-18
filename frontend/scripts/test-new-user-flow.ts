import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaixpzbbqocssdznztev.supabase.co'
const supabaseKey = process.env.NEW_SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testNewUserFlow() {
  console.log('🧪 Testing New User Flow...\n')

  try {
    // 1. Check what happens when we create user stats
    console.log('1️⃣ Testing user stats creation...')
    
    const testUserId = 'test_user_' + Date.now()
    const testEmail = `test${Date.now()}@example.com`
    
    const userStatsData = {
      "userId": testUserId,
      all_time_completed: 0,
      current_streak: 0,
      completed_this_week: 0,
      completed_today: 0,
      last_completed_date: null,
      subscription_level: 'free',
      ai_suggestions_enabled: true,
      user_mood: 'neutral',
      show_analytics: true,
      notifications_enabled: true,
      email: testEmail,
      mood_checkins_today: 0,
      ai_splits_today: 0,
      last_daily_reset: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      timezone: 'UTC',
    }

    console.log('📝 Creating test user stats with data:', {
      userId: userStatsData.userId,
      last_daily_reset: userStatsData.last_daily_reset,
      all_time_completed: userStatsData.all_time_completed
    })

    const { data: createdStats, error: createError } = await supabase
      .from('user_stats')
      .insert([userStatsData])
      .select()
      .single()

    if (createError) {
      console.log('❌ Failed to create test user stats:', createError.message)
      return
    }

    console.log('✅ Test user stats created successfully')

    // 2. Check if this would trigger daily reset
    console.log('\n2️⃣ Checking daily reset logic...')
    
    const lastReset = new Date(createdStats.last_daily_reset)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    console.log('📅 Reset check:', {
      lastReset: lastReset.toISOString(),
      twentyFourHoursAgo: twentyFourHoursAgo.toISOString(),
      needsReset: lastReset < twentyFourHoursAgo,
      allTimeCompleted: createdStats.all_time_completed,
      isNewUser: createdStats.all_time_completed === 0
    })

    // 3. Simulate the dashboard logic
    console.log('\n3️⃣ Simulating dashboard logic...')
    
    const shouldShowResetPopup = lastReset < twentyFourHoursAgo && createdStats.all_time_completed > 0
    const shouldShowForNewUser = lastReset < twentyFourHoursAgo && createdStats.all_time_completed === 0
    
    console.log('🎯 Popup logic results:', {
      shouldShowResetPopup,
      shouldShowForNewUser,
      isNewUser: createdStats.all_time_completed === 0
    })

    if (shouldShowResetPopup) {
      console.log('⚠️  RESET POPUP WOULD SHOW (this is wrong for new users!)')
    } else if (shouldShowForNewUser) {
      console.log('⚠️  NEW USER RESET WOULD TRIGGER (this might be wrong!)')
    } else {
      console.log('✅ No popup would show (this is correct for new users)')
    }

    // 4. Check what the countdown timer would do
    console.log('\n4️⃣ Simulating countdown timer...')
    
    const nextResetTime = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000)
    const now = new Date()
    const resetDiff = nextResetTime.getTime() - now.getTime()
    const resetSeconds = Math.max(0, Math.floor(resetDiff / 1000))
    
    console.log('⏰ Timer calculation:', {
      nextResetTime: nextResetTime.toISOString(),
      now: now.toISOString(),
      resetDiff: resetDiff,
      resetSeconds,
      isResetDue: resetSeconds === 0
    })

    // 5. Clean up test data
    console.log('\n5️⃣ Cleaning up test data...')
    
    const { error: deleteError } = await supabase
      .from('user_stats')
      .delete()
      .eq('user_id', testUserId)

    if (deleteError) {
      console.log('⚠️  Failed to clean up test data:', deleteError.message)
    } else {
      console.log('✅ Test data cleaned up')
    }

    console.log('\n🎉 New user flow test completed!')
    console.log('\n📋 Analysis:')
    if (shouldShowResetPopup || shouldShowForNewUser) {
      console.log('❌ ISSUE FOUND: Daily reset popup would show for new user')
      console.log('🔧 This explains why new users see the reset popup!')
    } else {
      console.log('✅ No issues found in this test')
      console.log('🔍 The issue might be in the frontend logic or environment differences')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testNewUserFlow() 