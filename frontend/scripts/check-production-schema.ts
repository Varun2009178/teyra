import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Production Supabase client
const productionSupabase = createClient(
  'https://qaixpzbbqocssdznztev.supabase.co',
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

async function checkProductionSchema() {
  console.log('🔍 Checking production database schema...')
  
  try {
    // Check tasks table structure
    console.log('\n📋 Checking tasks table...')
    const { data: tasksData, error: tasksError } = await productionSupabase
      .from('tasks')
      .select('*')
      .limit(1)
    
    if (tasksError) {
      console.error('❌ Error checking tasks table:', tasksError)
    } else {
      console.log('✅ Tasks table accessible')
      if (tasksData && tasksData.length > 0) {
        const sampleTask = tasksData[0]
        console.log('📊 Sample task columns:', Object.keys(sampleTask))
        console.log('📊 Sample task data:', sampleTask)
      } else {
        console.log('📊 Tasks table is empty')
      }
    }
    
    // Check user_stats table structure
    console.log('\n📋 Checking user_stats table...')
    const { data: userStatsData, error: userStatsError } = await productionSupabase
      .from('user_stats')
      .select('*')
      .limit(1)
    
    if (userStatsError) {
      console.error('❌ Error checking user_stats table:', userStatsError)
    } else {
      console.log('✅ User_stats table accessible')
      if (userStatsData && userStatsData.length > 0) {
        const sampleUserStats = userStatsData[0]
        console.log('📊 Sample user_stats columns:', Object.keys(sampleUserStats))
        console.log('📊 Sample user_stats data:', sampleUserStats)
      } else {
        console.log('📊 User_stats table is empty')
      }
    }
    
    // Try to get a specific user's data
    console.log('\n🔍 Testing with a specific user...')
    const testUserId = 'user_3044N6Q19VGXkKrmHZ788Kq4ZiI' // From the error
    
    // Test tasks query
    console.log('📋 Testing tasks query...')
    const { data: userTasks, error: userTasksError } = await productionSupabase
      .from('tasks')
      .select('*')
      .eq('user_id', testUserId)
    
    if (userTasksError) {
      console.error('❌ Error querying tasks for user:', userTasksError)
    } else {
      console.log(`✅ Found ${userTasks?.length || 0} tasks for user`)
    }
    
    // Test user_stats query
    console.log('📋 Testing user_stats query...')
    const { data: userStats, error: userStatsQueryError } = await productionSupabase
      .from('user_stats')
      .select('*')
      .eq('user_id', testUserId)
    
    if (userStatsQueryError) {
      console.error('❌ Error querying user_stats for user:', userStatsQueryError)
    } else {
      console.log(`✅ Found ${userStats?.length || 0} user_stats for user`)
      if (userStats && userStats.length > 0) {
        console.log('📊 User stats data:', userStats[0])
      }
    }
    
    // Check if the user exists in user_stats
    console.log('\n🔍 Checking if user exists in user_stats...')
    const { data: allUserStats, error: allUserStatsError } = await productionSupabase
      .from('user_stats')
      .select('user_id, email')
      .limit(5)
    
    if (allUserStatsError) {
      console.error('❌ Error getting all user_stats:', allUserStatsError)
    } else {
      console.log('📊 Sample user_stats entries:')
      allUserStats?.forEach((stat, index) => {
        console.log(`   ${index + 1}. user_id: ${stat.user_id}, email: ${stat.email}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error)
  }
}

checkProductionSchema() 