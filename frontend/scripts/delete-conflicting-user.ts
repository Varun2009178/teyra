import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteConflictingUser() {
  console.log('🗑️ Deleting conflicting user_stats record...')
  
  try {
    // Delete the conflicting user_stats record
    const { error: statsError } = await supabase
      .from('user_stats')
      .delete()
      .eq('userId', 'user_302E9iBVGbei4MqEIVCCz2eZRJR')
    
    if (statsError) {
      console.error('❌ Error deleting user_stats:', statsError)
    } else {
      console.log('✅ Deleted conflicting user_stats record')
    }
    
    // Also delete any tasks for this user
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('userId', 'user_302E9iBVGbei4MqEIVCCz2eZRJR')
    
    if (tasksError) {
      console.error('❌ Error deleting tasks:', tasksError)
    } else {
      console.log('✅ Deleted tasks for conflicting user')
    }
    
    console.log('🎉 Conflicting user data cleaned!')
    
  } catch (error) {
    console.error('❌ Error deleting conflicting user:', error)
  }
}

deleteConflictingUser() 