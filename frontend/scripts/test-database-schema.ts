import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...')
  
  try {
    // Test 1: Check tasks table structure
    console.log('\n📋 Testing tasks table...')
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1)
    
    if (tasksError) {
      console.error('❌ Error accessing tasks table:', tasksError)
    } else {
      console.log('✅ Tasks table accessible')
      if (tasksData && tasksData.length > 0) {
        const sampleTask = tasksData[0]
        console.log('📊 Sample task columns:', Object.keys(sampleTask))
        console.log('🔍 Key columns check:')
        console.log('   - id:', typeof sampleTask.id, sampleTask.id ? '✅' : '❌')
        console.log('   - userId:', typeof sampleTask.userId, sampleTask.userId ? '✅' : '❌')
        console.log('   - title:', typeof sampleTask.title, sampleTask.title ? '✅' : '❌')
        console.log('   - createdAt:', typeof sampleTask.createdAt, sampleTask.createdAt ? '✅' : '❌')
        console.log('   - has_been_split:', typeof sampleTask.has_been_split, sampleTask.has_been_split !== undefined ? '✅' : '❌')
      }
    }

    // Test 2: Check user_stats table structure
    console.log('\n📊 Testing user_stats table...')
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .limit(1)
    
    if (statsError) {
      console.error('❌ Error accessing user_stats table:', statsError)
    } else {
      console.log('✅ User_stats table accessible')
      if (statsData && statsData.length > 0) {
        const sampleStats = statsData[0]
        console.log('📊 Sample user_stats columns:', Object.keys(sampleStats))
        console.log('🔍 Key columns check:')
        console.log('   - userId:', typeof sampleStats.userId, sampleStats.userId ? '✅' : '❌')
        console.log('   - mood_checkins_today:', typeof sampleStats.mood_checkins_today, sampleStats.mood_checkins_today !== undefined ? '✅' : '❌')
        console.log('   - ai_splits_today:', typeof sampleStats.ai_splits_today, sampleStats.ai_splits_today !== undefined ? '✅' : '❌')
        console.log('   - last_daily_reset:', typeof sampleStats.last_daily_reset, sampleStats.last_daily_reset ? '✅' : '❌')
        console.log('   - last_activity_at:', typeof sampleStats.last_activity_at, sampleStats.last_activity_at ? '✅' : '❌')
      }
    }

    // Test 3: Try to create a test task
    console.log('\n🧪 Testing task creation...')
    const testUserId = 'test-user-' + Date.now()
    const testTaskData = {
      userId: testUserId,
      title: 'Test task for schema validation',
      completed: false,
      createdAt: new Date().toISOString(),
      has_been_split: false
    }
    
    const { data: createdTask, error: createError } = await supabase
      .from('tasks')
      .insert([testTaskData])
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating test task:', createError)
    } else {
      console.log('✅ Test task created successfully:', createdTask)
      
      // Clean up test task
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', createdTask.id)
      
      if (deleteError) {
        console.error('⚠️ Error cleaning up test task:', deleteError)
      } else {
        console.log('🧹 Test task cleaned up')
      }
    }

    // Test 4: Try to create test user stats
    console.log('\n🧪 Testing user stats creation...')
    const testStatsData = {
      userId: testUserId,
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
    }
    
    const { data: createdStats, error: statsCreateError } = await supabase
      .from('user_stats')
      .insert([testStatsData])
      .select()
      .single()
    
    if (statsCreateError) {
      console.error('❌ Error creating test user stats:', statsCreateError)
    } else {
      console.log('✅ Test user stats created successfully:', createdStats)
      
      // Clean up test user stats
      const { error: statsDeleteError } = await supabase
        .from('user_stats')
        .delete()
        .eq('userId', createdStats.userId)
      
      if (statsDeleteError) {
        console.error('⚠️ Error cleaning up test user stats:', statsDeleteError)
      } else {
        console.log('🧹 Test user stats cleaned up')
      }
    }

    console.log('\n🎉 Database schema test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDatabaseSchema() 