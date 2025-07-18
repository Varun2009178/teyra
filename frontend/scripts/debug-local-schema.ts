import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Use the local Supabase key (not the demo key)
const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function checkLocalSchema() {
  console.log('🔍 Checking local database schema...')
  
  try {
    // First, let's see what tables exist
    console.log('🔍 Checking what tables exist...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (!tablesError) {
      console.log('✅ Tables in database:', tables?.map(t => t.table_name))
    } else {
      console.log('❌ Could not get tables:', tablesError.message)
    }
    
    // Try to get any data from tasks table
    console.log('🔍 Trying to get any data from tasks...')
    const { data: anyTasks, error: anyTasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1)
    
    if (!anyTasksError) {
      console.log('✅ Tasks table exists, sample data:', anyTasks)
    } else {
      console.log('❌ Tasks table error:', anyTasksError.message)
    }
    
    // Try to get any data from user_stats table
    console.log('🔍 Trying to get any data from user_stats...')
    const { data: anyUserStats, error: anyUserStatsError } = await supabase
      .from('user_stats')
      .select('*')
      .limit(1)
    
    if (!anyUserStatsError) {
      console.log('✅ User stats table exists, sample data:', anyUserStats)
    } else {
      console.log('❌ User stats table error:', anyUserStatsError.message)
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error)
  }
}

checkLocalSchema() 