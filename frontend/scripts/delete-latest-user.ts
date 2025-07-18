import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteLatestUser() {
  console.log('🗑️ Deleting latest conflicting user record...')
  
  try {
    // Delete the latest user_stats record
    const { error: statsError } = await supabase
      .from('user_stats')
      .delete()
      .eq('userId', 'user_302F1cMS0ttEkjpuPmMl96da44s')
    
    if (statsError) {
      console.error('❌ Error deleting user_stats:', statsError)
    } else {
      console.log('✅ Deleted latest user_stats record')
    }
    
    // Also delete any tasks for this user
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('userId', 'user_302F1cMS0ttEkjpuPmMl96da44s')
    
    if (tasksError) {
      console.error('❌ Error deleting tasks:', tasksError)
    } else {
      console.log('✅ Deleted tasks for latest user')
    }
    
    console.log('🎉 Latest user data cleaned!')
    
  } catch (error) {
    console.error('❌ Error deleting latest user:', error)
  }
}

deleteLatestUser() 