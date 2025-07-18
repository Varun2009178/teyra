import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deduplicateUsers() {
  console.log('🔍 Checking for duplicate users...')
  
  try {
    // Get all user_stats
    const { data: allUserStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
    
    if (statsError) {
      console.error('❌ Error fetching user_stats:', statsError)
      return
    }
    
    console.log(`📊 Found ${allUserStats?.length || 0} user_stats records`)
    
    // Group by email to find duplicates
    const emailGroups: { [email: string]: any[] } = {}
    
    allUserStats?.forEach(user => {
      const email = user.email || 'no-email'
      if (!emailGroups[email]) {
        emailGroups[email] = []
      }
      emailGroups[email].push(user)
    })
    
    // Find duplicates
    const duplicates: { email: string; users: any[] }[] = []
    Object.entries(emailGroups).forEach(([email, users]) => {
      if (users.length > 1) {
        duplicates.push({ email, users })
      }
    })
    
    console.log(`🔍 Found ${duplicates.length} emails with duplicate records`)
    
    // Keep the most recent record for each email
    for (const { email, users } of duplicates) {
      console.log(`📧 Processing duplicates for: ${email}`)
      
      // Sort by created_at (most recent first)
      users.sort((a, b) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB.getTime() - dateA.getTime()
      })
      
      // Keep the first (most recent) record, delete the rest
      const toKeep = users[0]
      const toDelete = users.slice(1)
      
      console.log(`  ✅ Keeping: ${toKeep.userId} (created: ${toKeep.created_at})`)
      
      for (const userToDelete of toDelete) {
        console.log(`  🗑️ Deleting: ${userToDelete.userId} (created: ${userToDelete.created_at})`)
        
        // Delete user_stats
        const { error: deleteStatsError } = await supabase
          .from('user_stats')
          .delete()
          .eq('userId', userToDelete.userId)
        
        if (deleteStatsError) {
          console.error(`    ❌ Error deleting user_stats for ${userToDelete.userId}:`, deleteStatsError)
        }
        
        // Delete associated tasks
        const { error: deleteTasksError } = await supabase
          .from('tasks')
          .delete()
          .eq('userId', userToDelete.userId)
        
        if (deleteTasksError) {
          console.error(`    ❌ Error deleting tasks for ${userToDelete.userId}:`, deleteTasksError)
        }
      }
    }
    
    console.log('🎉 User deduplication complete!')
    
    // Show final count
    const { data: finalStats, error: finalError } = await supabase
      .from('user_stats')
      .select('*')
    
    if (!finalError) {
      console.log(`📊 Final user_stats count: ${finalStats?.length || 0}`)
    }
    
  } catch (error) {
    console.error('❌ Error deduplicating users:', error)
  }
}

deduplicateUsers() 