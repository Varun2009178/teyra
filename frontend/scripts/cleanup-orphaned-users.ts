import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

async function cleanupOrphanedUsers() {
  console.log('🧹 Starting orphaned user cleanup...')
  
  try {
    // Get all user IDs from user_stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('userId, email, createdAt')
      .order('createdAt', { ascending: false })
    
    if (statsError) {
      console.error('❌ Error fetching user stats:', statsError)
      return
    }
    
    if (!userStats || userStats.length === 0) {
      console.log('✅ No user stats found')
      return
    }
    
    console.log(`📊 Found ${userStats.length} users in database`)
    console.log('\n👥 Users in database:')
    userStats.forEach((user, index) => {
      console.log(`${index + 1}. ${user.userId} (${user.email}) - Created: ${user.createdAt}`)
    })
    
    console.log('\n⚠️  MANUAL VERIFICATION REQUIRED:')
    console.log('1. Go to Clerk Dashboard → Users')
    console.log('2. Check which users from the list above still exist in Clerk')
    console.log('3. Note down the user IDs that should be deleted')
    console.log('4. Run the cleanup with those specific user IDs')
    
    // Example of how to delete specific users
    console.log('\n📝 Example cleanup command:')
    console.log('await deleteUserData("user_2abc123def456")')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

async function deleteUserData(userId: string) {
  console.log(`🗑️ Deleting data for user: ${userId}`)
  
  try {
    // Delete tasks
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('userId', userId)
    
    if (tasksError) {
      console.error('❌ Error deleting tasks:', tasksError)
    } else {
      console.log('✅ Tasks deleted')
    }
    
    // Delete user stats
    const { error: statsError } = await supabase
      .from('user_stats')
      .delete()
      .eq('userId', userId)
    
    if (statsError) {
      console.error('❌ Error deleting user stats:', statsError)
    } else {
      console.log('✅ User stats deleted')
    }
    
    console.log(`✅ User data cleanup completed for: ${userId}`)
    
  } catch (error) {
    console.error('❌ Error deleting user data:', error)
  }
}

async function deleteMultipleUsers(userIds: string[]) {
  console.log(`🗑️ Deleting data for ${userIds.length} users...`)
  
  for (const userId of userIds) {
    await deleteUserData(userId)
    console.log('---')
  }
  
  console.log('✅ Bulk deletion completed')
}

// Export functions for manual use
export { cleanupOrphanedUsers, deleteUserData, deleteMultipleUsers }

// Run if called directly
if (require.main === module) {
  cleanupOrphanedUsers()
    .then(() => {
      console.log('\n✅ Cleanup script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Cleanup script failed:', error)
      process.exit(1)
    })
} 