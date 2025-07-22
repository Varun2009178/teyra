import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

const testUserId = 'test_user_' + Date.now()
const testEmail = `test_${Date.now()}@example.com`

async function testDatabase() {
  console.log('🧪 Starting database tests...')
  console.log('📊 Test User ID:', testUserId)
  console.log('📧 Test Email:', testEmail)
  console.log('')

  try {
    // Test 1: Create User Stats
    console.log('🔄 Test 1: Creating user stats...')
    const { data: userStats, error: userStatsError } = await supabase
      .from('user_stats')
      .insert([{
        userId: testUserId,
        email: testEmail,
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
        mood_checkins_today: 0,
        ai_splits_today: 0,
        last_daily_reset: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        timezone: 'UTC'
      }])
      .select()
      .single()

    if (userStatsError) {
      console.error('❌ Error creating user stats:', userStatsError)
      return
    }
    console.log('✅ User stats created successfully:', userStats)
    console.log('')

    // Test 2: Create Task
    console.log('🔄 Test 2: Creating task...')
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert([{
        userId: testUserId,
        title: 'Test task ' + new Date().toISOString(),
        completed: false,
        has_been_split: false,
        createdAt: new Date().toISOString(),
        expired: false
      }])
      .select()
      .single()

    if (taskError) {
      console.error('❌ Error creating task:', taskError)
      return
    }
    console.log('✅ Task created successfully:', task)
    console.log('')

    // Test 3: Get User Stats
    console.log('🔄 Test 3: Fetching user stats...')
    const { data: fetchedUserStats, error: fetchUserError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('userId', testUserId)
      .single()

    if (fetchUserError) {
      console.error('❌ Error fetching user stats:', fetchUserError)
      return
    }
    console.log('✅ User stats fetched successfully:', fetchedUserStats)
    console.log('')

    // Test 4: Get Tasks
    console.log('🔄 Test 4: Fetching tasks...')
    const { data: tasks, error: fetchTasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('userId', testUserId)
      .order('createdAt', { ascending: false })

    if (fetchTasksError) {
      console.error('❌ Error fetching tasks:', fetchTasksError)
      return
    }
    console.log('✅ Tasks fetched successfully:', tasks)
    console.log('')

    // Test 5: Update User Stats
    console.log('🔄 Test 5: Updating user stats...')
    const { data: updatedUserStats, error: updateError } = await supabase
      .from('user_stats')
      .update({
        all_time_completed: 5,
        current_streak: 3,
        user_mood: 'energized',
        last_activity_at: new Date().toISOString()
      })
      .eq('userId', testUserId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating user stats:', updateError)
      return
    }
    console.log('✅ User stats updated successfully:', updatedUserStats)
    console.log('')

    // Test 6: Cleanup
    console.log('🔄 Test 6: Cleaning up test data...')
    
    // Delete tasks
    const { error: deleteTasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('userId', testUserId)

    if (deleteTasksError) {
      console.error('❌ Error deleting tasks:', deleteTasksError)
    } else {
      console.log('✅ Tasks deleted successfully')
    }

    // Delete user stats
    const { error: deleteUserError } = await supabase
      .from('user_stats')
      .delete()
      .eq('userId', testUserId)

    if (deleteUserError) {
      console.error('❌ Error deleting user stats:', deleteUserError)
    } else {
      console.log('✅ User stats deleted successfully')
    }

    console.log('')
    console.log('🎉 All database tests completed successfully!')
    console.log('✅ User stats operations work correctly')
    console.log('✅ Task operations work correctly')
    console.log('✅ Database schema is compatible')

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error)
  }
}

// Run the test
testDatabase() 