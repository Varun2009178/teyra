import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanMigrationData() {
  console.log('🧹 Cleaning up migration data...')
  
  try {
    // Delete all user_stats to start fresh
    const { error: statsError } = await supabase
      .from('user_stats')
      .delete()
      .neq('userId', 'dummy') // Delete all except dummy records
    
    if (statsError) {
      console.error('❌ Error deleting user_stats:', statsError)
    } else {
      console.log('✅ Deleted all user_stats')
    }
    
    // Delete all tasks to start fresh
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .neq('userId', 'dummy') // Delete all except dummy records
    
    if (tasksError) {
      console.error('❌ Error deleting tasks:', tasksError)
    } else {
      console.log('✅ Deleted all tasks')
    }
    
    console.log('🎉 Migration data cleaned! New users will start fresh.')
    
  } catch (error) {
    console.error('❌ Error cleaning migration data:', error)
  }
}

cleanMigrationData() 