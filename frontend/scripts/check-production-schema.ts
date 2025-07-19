import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function checkProductionSchema() {
  console.log('🔍 Checking Production Database Schema...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.NEW_SUPABASE_SERVICE_KEY!

  console.log('📋 Environment Check:')
  console.log('URL:', supabaseUrl)
  console.log('Service Key (first 20 chars):', serviceKey.substring(0, 20) + '...')
  console.log('')

  const serviceClient = createClient(supabaseUrl, serviceKey)

  // Check tasks table schema
  console.log('🧪 Checking tasks table schema...')
  try {
    const { data: tasksColumns, error: tasksError } = await serviceClient
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'tasks')
      .order('ordinal_position')
    
    if (tasksError) {
      console.log('❌ Error checking tasks schema:', tasksError.message)
    } else {
      console.log('📋 Tasks table columns:')
      tasksColumns?.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`)
      })
    }
  } catch (err) {
    console.log('❌ Exception checking tasks schema:', err)
  }
  console.log('')

  // Check user_stats table schema
  console.log('🧪 Checking user_stats table schema...')
  try {
    const { data: userStatsColumns, error: userStatsError } = await serviceClient
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'user_stats')
      .order('ordinal_position')
    
    if (userStatsError) {
      console.log('❌ Error checking user_stats schema:', userStatsError.message)
    } else {
      console.log('📋 User_stats table columns:')
      userStatsColumns?.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`)
      })
    }
  } catch (err) {
    console.log('❌ Exception checking user_stats schema:', err)
  }
  console.log('')

  // Try to get a sample row from each table
  console.log('🧪 Checking sample data...')
  try {
    const { data: sampleTasks, error: sampleTasksError } = await serviceClient
      .from('tasks')
      .select('*')
      .limit(1)
    
    if (sampleTasksError) {
      console.log('❌ Error getting sample tasks:', sampleTasksError.message)
    } else {
      console.log('📋 Sample task columns (from data):')
      if (sampleTasks && sampleTasks.length > 0) {
        Object.keys(sampleTasks[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof sampleTasks[0][key]}`)
        })
      } else {
        console.log('  No tasks found')
      }
    }
  } catch (err) {
    console.log('❌ Exception getting sample tasks:', err)
  }

  try {
    const { data: sampleUserStats, error: sampleUserStatsError } = await serviceClient
      .from('user_stats')
      .select('*')
      .limit(1)
    
    if (sampleUserStatsError) {
      console.log('❌ Error getting sample user_stats:', sampleUserStatsError.message)
    } else {
      console.log('📋 Sample user_stats columns (from data):')
      if (sampleUserStats && sampleUserStats.length > 0) {
        Object.keys(sampleUserStats[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof sampleUserStats[0][key]}`)
        })
      } else {
        console.log('  No user_stats found')
      }
    }
  } catch (err) {
    console.log('❌ Exception getting sample user_stats:', err)
  }
  console.log('')

  console.log('🔍 Analysis:')
  console.log('1. Check if the user ID column is named differently (user_id vs userId)')
  console.log('2. Check if any required columns are missing')
  console.log('3. Compare with local schema to identify differences')
}

checkProductionSchema().catch(console.error) 
checkProductionSchema() 