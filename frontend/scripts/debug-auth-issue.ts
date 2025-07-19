import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function debugAuthIssue() {
  console.log('🔍 Debugging Authentication Issue...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.NEW_SUPABASE_SERVICE_KEY!

  console.log('📋 Environment Check:')
  console.log('URL:', supabaseUrl)
  console.log('Anon Key (first 20 chars):', anonKey.substring(0, 20) + '...')
  console.log('Service Key (first 20 chars):', serviceKey.substring(0, 20) + '...')
  console.log('')

  // Test 1: Anon client (like frontend)
  console.log('🧪 Test 1: Anon Client (Frontend Simulation)')
  const anonClient = createClient(supabaseUrl, anonKey)
  
  try {
    // Try to create a task without authentication (should fail)
    const { data: taskData, error: taskError } = await anonClient
      .from('tasks')
      .insert([{
        title: 'Test task without auth',
        completed: false,
        has_been_split: false,
        expired: false
      }])
      .select()
    
    if (taskError) {
      console.log('✅ Expected error (no auth):', taskError.message)
    } else {
      console.log('⚠️ Unexpected success - RLS might be disabled')
    }
  } catch (err) {
    console.log('✅ Expected error (no auth):', err)
  }
  console.log('')

  // Test 2: Service client (like API routes)
  console.log('🧪 Test 2: Service Client (API Routes Simulation)')
  const serviceClient = createClient(supabaseUrl, serviceKey)
  
  try {
    const testUserId = 'test_auth_' + Date.now()
    
    // Create user stats first
    const { data: userStats, error: userError } = await serviceClient
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
    
    if (userError) {
      console.log('❌ Failed to create user stats:', userError.message)
    } else {
      console.log('✅ User stats created successfully')
      
      // Now try to create a task
      const { data: taskData, error: taskError } = await serviceClient
        .from('tasks')
        .insert([{
          userId: testUserId,
          title: 'Test task with service key',
          completed: false,
          has_been_split: false,
          expired: false
        }])
        .select()
        .single()
      
      if (taskError) {
        console.log('❌ Failed to create task:', taskError.message)
      } else {
        console.log('✅ Task created successfully with service key')
      }
      
      // Clean up
      await serviceClient.from('tasks').delete().eq('userId', testUserId)
      await serviceClient.from('user_stats').delete().eq('userId', testUserId)
      console.log('🧹 Test data cleaned up')
    }
  } catch (err) {
    console.log('❌ Service client error:', err)
  }
  console.log('')

  // Test 3: Check RLS policies
  console.log('🧪 Test 3: RLS Policy Check')
  try {
    const { data: policies, error: policyError } = await serviceClient
      .from('pg_policies')
      .select('*')
      .in('tablename', ['tasks', 'user_stats'])
    
    if (policyError) {
      console.log('⚠️ Could not check policies:', policyError.message)
    } else {
      console.log('📋 RLS Policies found:', policies?.length || 0)
      policies?.forEach(policy => {
        console.log(`  - ${policy.tablename}: ${policy.policyname}`)
      })
    }
  } catch (err) {
    console.log('⚠️ Policy check failed:', err)
  }
  console.log('')

  // Test 4: Check if RLS is enabled
  console.log('🧪 Test 4: RLS Status Check')
  try {
    const { data: tables, error: tableError } = await serviceClient
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', ['tasks', 'user_stats'])
    
    if (tableError) {
      console.log('⚠️ Could not check RLS status:', tableError.message)
    } else {
      console.log('📋 RLS Status:')
      tables?.forEach(table => {
        console.log(`  - ${table.tablename}: RLS ${table.rowsecurity ? 'enabled' : 'disabled'}`)
      })
    }
  } catch (err) {
    console.log('⚠️ RLS status check failed:', err)
  }
  console.log('')

  console.log('🔍 Analysis:')
  console.log('1. If anon client fails to create tasks: RLS is working correctly')
  console.log('2. If service client can create tasks: Database permissions are correct')
  console.log('3. If RLS is disabled: This explains why local works but production might not')
  console.log('4. If no policies exist: This could cause issues in production')
}

debugAuthIssue().catch(console.error) 