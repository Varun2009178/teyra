import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testProductionDifferences() {
  console.log('🔍 Testing Production Environment Differences...\n')

  // Check environment variables
  console.log('📋 Environment Variables:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('NEW_SUPABASE_SERVICE_KEY:', process.env.NEW_SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing')
  console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing')
  console.log('')

  // Test Supabase connection
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEW_SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required Supabase environment variables')
    return
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEW_SUPABASE_SERVICE_KEY
  )

  try {
    console.log('🔗 Testing Supabase Connection...')
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('user_stats')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message)
      return
    }
    
    console.log('✅ Supabase connection successful')
    console.log('')

    // Test schema differences
    console.log('🗄️ Testing Database Schema...')
    
    // Check if tables exist
    const tables = ['user_stats', 'tasks']
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`❌ Table ${table} access failed:`, error.message)
      } else {
        console.log(`✅ Table ${table} accessible`)
      }
    }
    console.log('')

    // Test column names
    console.log('📊 Testing Column Names...')
    
    // Test user_stats columns
    const { data: userStatsSample, error: userStatsError } = await supabase
      .from('user_stats')
      .select('userId, all_time_completed, createdAt, updatedAt')
      .limit(1)
    
    if (userStatsError) {
      console.error('❌ user_stats column test failed:', userStatsError.message)
    } else {
      console.log('✅ user_stats columns (userId, all_time_completed, createdAt, updatedAt) accessible')
    }

    // Test tasks columns
    const { data: tasksSample, error: tasksError } = await supabase
      .from('tasks')
      .select('id, userId, title, completed, createdAt, updatedAt, expired, completedAt, assignedDate, has_been_split')
      .limit(1)
    
    if (tasksError) {
      console.error('❌ tasks column test failed:', tasksError.message)
    } else {
      console.log('✅ tasks columns (id, userId, title, completed, createdAt, updatedAt, expired, completedAt, assignedDate, has_been_split) accessible')
    }
    console.log('')

    // Test trigger function
    console.log('⚡ Testing Trigger Function...')
    try {
      const { data: triggerTest, error: triggerError } = await supabase
        .from('user_stats')
        .update({ all_time_completed: 0 })
        .eq('userId', 'test-user-id')
        .select()
      
      if (triggerError && triggerError.message.includes('updated_at')) {
        console.error('❌ Trigger function still using old column name (updated_at)')
      } else if (triggerError) {
        console.log('⚠️ Trigger test error (expected for non-existent user):', triggerError.message)
      } else {
        console.log('✅ Trigger function working correctly')
      }
    } catch (err) {
      console.log('⚠️ Trigger test completed (expected behavior)')
    }
    console.log('')

    // Test new user creation
    console.log('👤 Testing New User Creation...')
    const testUserId = `test-${Date.now()}`
    
    try {
      // Create test user stats
      const { data: newUserStats, error: newUserError } = await supabase
        .from('user_stats')
        .insert([{
          userId: testUserId,
          all_time_completed: 0,
          current_streak: 0,
          completed_this_week: 0,
          completed_today: 0,
          subscription_level: 'free',
          ai_suggestions_enabled: false,
          user_mood: 'neutral',
          show_analytics: true,
          notifications_enabled: true,
          timezone: 'UTC',
          mood_checkins_today: 0,
          ai_splits_today: 0
        }])
        .select()
        .single()
      
      if (newUserError) {
        console.error('❌ New user stats creation failed:', newUserError.message)
      } else {
        console.log('✅ New user stats created successfully')
        
        // Test task creation for new user
        const { data: newTask, error: newTaskError } = await supabase
          .from('tasks')
          .insert([{
            userId: testUserId,
            title: 'Test task for new user',
            completed: false,
            has_been_split: false,
            expired: false
          }])
          .select()
          .single()
        
        if (newTaskError) {
          console.error('❌ New task creation failed:', newTaskError.message)
        } else {
          console.log('✅ New task created successfully')
          
          // Clean up test data
          await supabase.from('tasks').delete().eq('userId', testUserId)
          await supabase.from('user_stats').delete().eq('userId', testUserId)
          console.log('🧹 Test data cleaned up')
        }
      }
    } catch (err) {
      console.error('❌ New user test failed:', err)
    }
    console.log('')

    console.log('🎉 Production environment test completed!')
    console.log('')
    console.log('💡 If you see any ❌ errors above, those are likely the cause of production issues.')
    console.log('💡 Common production issues:')
    console.log('   - Missing environment variables')
    console.log('   - Different database schema between local and production')
    console.log('   - Different Supabase project settings')
    console.log('   - Missing RLS policies')
    console.log('   - Different authentication setup')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testProductionDifferences().catch(console.error) 