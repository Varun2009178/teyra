import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaixpzbbqocssdznztev.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhaXhwemJicW9jc3Nkem56dGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDcxODIsImV4cCI6MjA2ODI4MzE4Mn0.8A4y5Xoe-kWQhCqS1kSQtBZQHHEvfK1z2xBxFDEPsD8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEmailSystem() {
  console.log('🧪 Testing email system...')
  
  try {
    // Get a test user
    const { data: users, error: userError } = await supabase
      .from('user_stats')
      .select('user_id, email, last_activity_at, notifications_enabled, mood_checkins_today, ai_splits_today')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found:', userError)
      return
    }

    const testUser = users[0]
    console.log('👤 Found test user:', {
      userId: testUser.user_id,
      email: testUser.email,
      lastActivity: testUser.last_activity_at,
      notificationsEnabled: testUser.notifications_enabled,
      moodCheckinsToday: testUser.mood_checkins_today,
      aiSplitsToday: testUser.ai_splits_today
    })

    // Set last_activity_at to 25 hours ago
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    
    console.log('🕐 Setting last_activity_at to 25 hours ago:', twentyFiveHoursAgo)
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_stats')
      .update({ 
        last_activity_at: twentyFiveHoursAgo,
        notifications_enabled: true, // Ensure notifications are enabled
        mood_checkins_today: 1, // Set to 1 to test reset
        ai_splits_today: 2 // Set to 2 to test reset
      })
      .eq('user_id', testUser.user_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to update user:', updateError)
      return
    }

    console.log('✅ User updated successfully:', {
      userId: updatedUser.user_id,
      lastActivity: updatedUser.last_activity_at,
      notificationsEnabled: updatedUser.notifications_enabled,
      moodCheckinsToday: updatedUser.mood_checkins_today,
      aiSplitsToday: updatedUser.ai_splits_today
    })

    console.log('\n🎯 Now you can test the email system:')
    console.log('1. Start your dev server: npm run dev')
    console.log('2. Visit: http://localhost:3000/api/cron/daily-emails')
    console.log('3. Check the console for email sending logs')
    console.log('4. Check your email inbox (if you have a real email set up)')
    console.log('5. Check the database to see if mood_checkins_today and ai_splits_today were reset to 0')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testEmailSystem() 