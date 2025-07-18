import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { getUserStats, updateUserStats, canPerformMoodCheckIn } from '../src/lib/database'

// Load environment variables
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

async function testMoodCheckIn() {
  console.log('🧪 Testing mood check-in persistence...')
  
  try {
    // Get a test user (you can replace with a specific user ID)
    const { data: users, error: userError } = await supabase
      .from('user_stats')
      .select('user_id, user_mood, mood_checkins_today, subscription_level')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found:', userError)
      return
    }

    const testUser = users[0]
    console.log('👤 Testing with user:', testUser.user_id)
    console.log('📊 Current stats:', {
      user_mood: testUser.user_mood,
      mood_checkins_today: testUser.mood_checkins_today,
      subscription_level: testUser.subscription_level
    })

    // Test mood check-in limits
    console.log('\n🌵 Testing mood check-in limits...')
    const canCheckIn = await canPerformMoodCheckIn(supabase, testUser.user_id)
    console.log('Can perform mood check-in:', canCheckIn)

    // Test updating mood
    console.log('\n🔄 Testing mood update...')
    const newMood = 'energized'
    const currentCheckIns = testUser.mood_checkins_today || 0
    
    const updatedStats = await updateUserStats(supabase, testUser.user_id, {
      user_mood: newMood,
      mood_checkins_today: currentCheckIns + 1
    })
    
    console.log('✅ Updated user stats:', {
      user_mood: updatedStats?.user_mood,
      mood_checkins_today: updatedStats?.mood_checkins_today
    })

    // Test loading the updated stats
    console.log('\n📥 Testing stats loading...')
    const loadedStats = await getUserStats(supabase, testUser.user_id)
    console.log('📊 Loaded stats:', {
      user_mood: loadedStats?.user_mood,
      mood_checkins_today: loadedStats?.mood_checkins_today
    })

    // Verify the mood persisted
    if (loadedStats?.user_mood === newMood) {
      console.log('✅ Mood check-in persistence test PASSED!')
    } else {
      console.log('❌ Mood check-in persistence test FAILED!')
    }

    console.log('\n🎉 Mood check-in test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testMoodCheckIn() 