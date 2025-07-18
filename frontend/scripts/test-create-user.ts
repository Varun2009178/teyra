import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function testCreateUser() {
  console.log('🧪 Testing user creation...')
  
  const testUserId = 'user_test_' + Date.now()
  const testEmail = 'test@example.com'
  
  try {
    // Test 1: Fixed approach - using userId directly
    console.log('🔍 Test 1: Fixed approach - using userId directly')
    const userStatsData = {
      userId: testUserId, // Use userId directly without quotes
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
      timezone: 'UTC'
    }
    
    console.log('📤 Inserting data:', userStatsData)
    
    const { data, error } = await supabase
      .from('user_stats')
      .insert([userStatsData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('✅ Success:', data)
    }
    
  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

testCreateUser() 