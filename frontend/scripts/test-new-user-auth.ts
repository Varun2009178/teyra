import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testNewUserAuth() {
  console.log('🔍 Testing New User Authentication...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.NEW_SUPABASE_SERVICE_KEY!

  console.log('📋 Environment Check:')
  console.log('URL:', supabaseUrl)
  console.log('Anon Key (first 20 chars):', anonKey.substring(0, 20) + '...')
  console.log('')

  // Test 1: Simulate what happens when a new user tries to create a task
  console.log('🧪 Test 1: New User Task Creation Simulation')
  const anonClient = createClient(supabaseUrl, anonKey)
  
  const testUserId = 'test_new_user_' + Date.now()
  const testTask = {
    userId: testUserId,
    title: 'Test task from new user',
    completed: false,
    has_been_split: false,
    expired: false
  }
  
  try {
    console.log('📝 Attempting to create task with anon client...')
    console.log('Task data:', testTask)
    
    const { data, error } = await anonClient
      .from('tasks')
      .insert([testTask])
      .select()
    
    if (error) {
      console.log('❌ Expected error (no auth):', error.message)
      console.log('Error code:', error.code)
      console.log('Error details:', error.details)
    } else {
      console.log('⚠️ Unexpected success - RLS might be disabled')
      console.log('Created task:', data)
    }
  } catch (err) {
    console.log('❌ Exception:', err)
  }
  console.log('')

  // Test 2: Check if user stats exist for this user
  console.log('🧪 Test 2: Check User Stats for New User')
  const serviceClient = createClient(supabaseUrl, serviceKey)
  
  try {
    const { data: userStats, error: userError } = await serviceClient
      .from('user_stats')
      .select('*')
      .eq('userId', testUserId)
      .single()
    
    if (userError) {
      console.log('✅ Expected - No user stats for new user:', userError.message)
    } else {
      console.log('⚠️ User stats already exist for test user:', userStats)
    }
  } catch (err) {
    console.log('❌ Error checking user stats:', err)
  }
  console.log('')

  // Test 3: Create user stats first, then try task creation
  console.log('🧪 Test 3: Create User Stats Then Task')
  try {
    // Create user stats
    const { data: newUserStats, error: createUserError } = await serviceClient
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
        mood_checkins_today: 0,
        ai_splits_today: 0
      }])
      .select()
      .single()
    
    if (createUserError) {
      console.log('❌ Failed to create user stats:', createUserError.message)
    } else {
      console.log('✅ User stats created successfully')
      
      // Now try to create task with anon client (simulating frontend)
      console.log('📝 Now trying to create task with anon client...')
      const { data: taskData, error: taskError } = await anonClient
        .from('tasks')
        .insert([testTask])
        .select()
      
      if (taskError) {
        console.log('❌ Still can\'t create task:', taskError.message)
        console.log('Error code:', taskError.code)
        console.log('Error details:', taskError.details)
      } else {
        console.log('✅ Task created successfully!')
        console.log('Task data:', taskData)
      }
    }
  } catch (err) {
    console.log('❌ Error in test 3:', err)
  }
  console.log('')

  // Test 4: Check RLS policies
  console.log('🧪 Test 4: RLS Policy Analysis')
  try {
    // Try to get RLS status using service client
    const { data: tables, error: tableError } = await serviceClient
      .rpc('get_rls_status', { table_names: ['tasks', 'user_stats'] })
    
    if (tableError) {
      console.log('⚠️ Could not check RLS status via RPC:', tableError.message)
      
      // Try direct query
      const { data: directCheck, error: directError } = await serviceClient
        .from('information_schema.tables')
        .select('table_name, row_security')
        .in('table_name', ['tasks', 'user_stats'])
      
      if (directError) {
        console.log('⚠️ Could not check RLS status directly:', directError.message)
      } else {
        console.log('📋 RLS Status (direct query):')
        directCheck?.forEach(table => {
          console.log(`  - ${table.table_name}: RLS ${table.row_security ? 'enabled' : 'disabled'}`)
        })
      }
    } else {
      console.log('📋 RLS Status:', tables)
    }
  } catch (err) {
    console.log('⚠️ RLS check failed:', err)
  }
  console.log('')

  // Clean up
  console.log('🧹 Cleaning up test data...')
  try {
    await serviceClient.from('tasks').delete().eq('userId', testUserId)
    await serviceClient.from('user_stats').delete().eq('userId', testUserId)
    console.log('✅ Test data cleaned up')
  } catch (err) {
    console.log('⚠️ Cleanup failed:', err)
  }
  console.log('')

  console.log('🔍 Analysis:')
  console.log('1. If anon client can\'t create tasks: RLS is working correctly')
  console.log('2. If user stats creation works: Database permissions are correct')
  console.log('3. The issue is likely that new users need proper authentication')
  console.log('4. The frontend might not be setting the user\'s JWT token correctly')
}

testNewUserAuth().catch(console.error) 