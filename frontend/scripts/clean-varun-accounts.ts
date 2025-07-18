import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanVarunAccounts() {
  console.log('🧹 Cleaning up Varun accounts...')
  
  try {
    // Delete user_stats for varun.k.nukala@gmail.com
    const { error: statsError } = await supabase
      .from('user_stats')
      .delete()
      .eq('email', 'varun.k.nukala@gmail.com')
    
    if (statsError) {
      console.error('❌ Error deleting user_stats:', statsError)
    } else {
      console.log('✅ Deleted user_stats for varun.k.nukala@gmail.com')
    }
    
    // Delete tasks for varun.k.nukala@gmail.com
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('userId', 'bb2349a0-da36-4c39-9169-b4ea3158b550PISH8xT')
    
    if (tasksError) {
      console.error('❌ Error deleting tasks for first account:', tasksError)
    } else {
      console.log('✅ Deleted tasks for first Varun account')
    }
    
    const { error: tasksError2 } = await supabase
      .from('tasks')
      .delete()
      .eq('userId', 'bc37ca87-2a74-443f-bdb3-5b3f9bb0bbacoPISH8xT')
    
    if (tasksError2) {
      console.error('❌ Error deleting tasks for second account:', tasksError2)
    } else {
      console.log('✅ Deleted tasks for second Varun account')
    }
    
    // Also delete from user_migrations table if it exists
    try {
      const { error: migrationError } = await supabase
        .from('user_migrations')
        .delete()
        .eq('email', 'varun.k.nukala@gmail.com')
      
      if (migrationError) {
        console.log('⚠️ Could not delete from user_migrations (table might not exist):', migrationError)
      } else {
        console.log('✅ Deleted from user_migrations table')
      }
    } catch (e) {
      console.log('⚠️ user_migrations table might not exist, skipping...')
    }
    
    console.log('🎉 Varun accounts cleaned! You can now sign up fresh.')
    
  } catch (error) {
    console.error('❌ Error cleaning Varun accounts:', error)
  }
}

cleanVarunAccounts() 