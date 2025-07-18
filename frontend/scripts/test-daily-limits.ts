import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { canPerformMoodCheckIn, canPerformAISplit, incrementMoodCheckIn, incrementAISplit } from '../src/lib/database'

// Load environment variables
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

async function testDailyLimits() {
  console.log('🧪 Testing daily limits system...')
  
  try {
    // Get a test user (you can replace with a specific user ID)
    const { data: users, error: userError } = await supabase
      .from('user_stats')
      .select('user_id, mood_checkins_today, ai_splits_today, subscription_level')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found:', userError)
      return
    }

    const testUser = users[0]
    console.log('👤 Testing with user:', testUser.user_id)
    console.log('📊 Current stats:', {
      mood_checkins_today: testUser.mood_checkins_today,
      ai_splits_today: testUser.ai_splits_today,
      subscription_level: testUser.subscription_level
    })

    // Test mood check-in limits
    console.log('\n🌵 Testing mood check-in limits...')
    const canMoodCheckIn = await canPerformMoodCheckIn(supabase, testUser.user_id)
    console.log('Can perform mood check-in:', canMoodCheckIn)

    if (canMoodCheckIn) {
      console.log('✅ Incrementing mood check-in...')
      await incrementMoodCheckIn(supabase, testUser.user_id)
      
      // Check again
      const canMoodCheckInAfter = await canPerformMoodCheckIn(supabase, testUser.user_id)
      console.log('Can perform mood check-in after increment:', canMoodCheckInAfter)
    }

    // Test AI split limits
    console.log('\n🤖 Testing AI split limits...')
    const canAISplit = await canPerformAISplit(supabase, testUser.user_id)
    console.log('Can perform AI split:', canAISplit)

    if (canAISplit) {
      console.log('✅ Incrementing AI split...')
      await incrementAISplit(supabase, testUser.user_id)
      
      // Check again
      const canAISplitAfter = await canPerformAISplit(supabase, testUser.user_id)
      console.log('Can perform AI split after increment:', canAISplitAfter)
    }

    // Get updated stats
    const { data: updatedUser } = await supabase
      .from('user_stats')
      .select('mood_checkins_today, ai_splits_today')
      .eq('user_id', testUser.user_id)
      .single()

    console.log('\n📊 Updated stats:', {
      mood_checkins_today: updatedUser?.mood_checkins_today,
      ai_splits_today: updatedUser?.ai_splits_today
    })

    console.log('\n🎉 Daily limits test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDailyLimits() 