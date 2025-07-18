import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Production Supabase client
const productionSupabase = createClient(
  'https://qaixpzbbqocssdznztev.supabase.co',
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

async function fixProductionSchema() {
  console.log('🔧 Fixing production database schema...')
  
  try {
    // Add has_been_split column to tasks table
    console.log('\n📝 Adding has_been_split column to tasks table...')
    const { error: tasksError } = await productionSupabase
      .from('tasks')
      .select('has_been_split')
      .limit(1)
    
    if (tasksError && tasksError.message.includes('has_been_split')) {
      console.log('⚠️ has_been_split column missing, adding it...')
      // We'll need to add this column manually in Supabase dashboard
      console.log('🔧 Please add the has_been_split column manually in Supabase dashboard')
    } else {
      console.log('✅ has_been_split column exists')
    }
    
    // Add last_task_summary column to user_stats table
    console.log('\n📝 Adding last_task_summary column to user_stats table...')
    const { error: userStatsError } = await productionSupabase
      .from('user_stats')
      .select('last_task_summary')
      .limit(1)
    
    if (userStatsError && userStatsError.message.includes('last_task_summary')) {
      console.log('⚠️ last_task_summary column missing, adding it...')
      // We'll need to add this column manually in Supabase dashboard
      console.log('🔧 Please add the last_task_summary column manually in Supabase dashboard')
    } else {
      console.log('✅ last_task_summary column exists')
    }
    
    // Check current schema
    console.log('\n🔍 Checking current schema...')
    
    const { data: tasksData, error: tasksCheckError } = await productionSupabase
      .from('tasks')
      .select('*')
      .limit(1)
    
    if (tasksCheckError) {
      console.error('❌ Error checking tasks table:', tasksCheckError)
    } else {
      console.log('✅ Tasks table accessible')
      if (tasksData && tasksData.length > 0) {
        console.log('📊 Current tasks columns:', Object.keys(tasksData[0]))
      }
    }
    
    const { data: userStatsData, error: userStatsCheckError } = await productionSupabase
      .from('user_stats')
      .select('*')
      .limit(1)
    
    if (userStatsCheckError) {
      console.error('❌ Error checking user_stats table:', userStatsCheckError)
    } else {
      console.log('✅ User_stats table accessible')
      if (userStatsData && userStatsData.length > 0) {
        console.log('📊 Current user_stats columns:', Object.keys(userStatsData[0]))
      }
    }
    
    console.log('\n📋 Manual steps needed:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to the SQL Editor')
    console.log('3. Run these commands:')
    console.log('   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS has_been_split BOOLEAN DEFAULT FALSE;')
    console.log('   ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS last_task_summary JSONB;')
    console.log('   UPDATE tasks SET has_been_split = FALSE WHERE has_been_split IS NULL;')
    
  } catch (error) {
    console.error('❌ Schema check failed:', error)
  }
}

fixProductionSchema() 