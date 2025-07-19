import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testProductionDirect() {
  console.log('🔍 Testing Production Database Directly...\n')

  // Use the production URL from the error logs
  const productionUrl = 'https://qaixpzbbqocssdznztev.supabase.co'
  const serviceKey = process.env.NEW_SUPABASE_SERVICE_KEY!

  console.log('📋 Production Environment Check:')
  console.log('URL:', productionUrl)
  console.log('Service Key (first 20 chars):', serviceKey.substring(0, 20) + '...')
  console.log('')

  const serviceClient = createClient(productionUrl, serviceKey)

  // Test 1: Check if we can connect to production
  console.log('🧪 Test 1: Production Connection Test')
  try {
    const { data: testData, error: testError } = await serviceClient
      .from('tasks')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('❌ Production connection failed:', testError.message)
      return
    } else {
      console.log('✅ Successfully connected to production database')
    }
  } catch (err) {
    console.log('❌ Exception connecting to production:', err)
    return
  }
  console.log('')

  // Test 2: Check actual column names in production
  console.log('🧪 Test 2: Check Production Column Names')
  try {
    const { data: sampleTasks, error: tasksError } = await serviceClient
      .from('tasks')
      .select('*')
      .limit(1)
    
    if (tasksError) {
      console.log('❌ Error getting sample tasks:', tasksError.message)
    } else {
      console.log('📋 Production tasks table columns:')
      if (sampleTasks && sampleTasks.length > 0) {
        Object.keys(sampleTasks[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof sampleTasks[0][key]}`)
        })
      } else {
        console.log('  No tasks found in production')
      }
    }
  } catch (err) {
    console.log('❌ Exception getting sample tasks:', err)
  }

  try {
    const { data: sampleUserStats, error: userStatsError } = await serviceClient
      .from('user_stats')
      .select('*')
      .limit(1)
    
    if (userStatsError) {
      console.log('❌ Error getting sample user_stats:', userStatsError.message)
    } else {
      console.log('📋 Production user_stats table columns:')
      if (sampleUserStats && sampleUserStats.length > 0) {
        Object.keys(sampleUserStats[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof sampleUserStats[0][key]}`)
        })
      } else {
        console.log('  No user_stats found in production')
      }
    }
  } catch (err) {
    console.log('❌ Exception getting sample user_stats:', err)
  }
  console.log('')

  // Test 3: Try to query with the user ID from the error
  console.log('🧪 Test 3: Test with Actual User ID')
  const testUserId = 'user_306pry8N3AJNdP4spWHytDBk1hq' // From your error logs
  
  try {
    console.log('📝 Testing tasks query with userId:', testUserId)
    const { data: userTasks, error: userTasksError } = await serviceClient
      .from('tasks')
      .select('*')
      .eq('userId', testUserId)
    
    if (userTasksError) {
      console.log('❌ Error querying tasks:', userTasksError.message)
      console.log('Error details:', userTasksError)
    } else {
      console.log(`✅ Found ${userTasks?.length || 0} tasks for user`)
    }
  } catch (err) {
    console.log('❌ Exception querying tasks:', err)
  }

  try {
    console.log('📊 Testing user_stats query with userId:', testUserId)
    const { data: userStats, error: userStatsError } = await serviceClient
      .from('user_stats')
      .select('*')
      .eq('userId', testUserId)
    
    if (userStatsError) {
      console.log('❌ Error querying user_stats:', userStatsError.message)
      console.log('Error details:', userStatsError)
    } else {
      console.log(`✅ Found ${userStats?.length || 0} user_stats for user`)
    }
  } catch (err) {
    console.log('❌ Exception querying user_stats:', err)
  }
  console.log('')

  console.log('🔍 Analysis:')
  console.log('1. This will show us the actual column names in production')
  console.log('2. This will test if the user ID format is correct')
  console.log('3. This will help identify the exact schema mismatch')
}

testProductionDirect().catch(console.error) 