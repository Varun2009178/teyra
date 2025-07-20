import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

async function cleanupDuplicateEmails() {
  console.log('🧹 Starting duplicate email cleanup...')
  
  try {
    // Get all user stats with emails
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('userId, email, createdAt')
      .not('email', 'is', null)
      .order('createdAt', { ascending: false })
    
    if (statsError) {
      console.error('❌ Error fetching user stats:', statsError)
      return
    }
    
    if (!userStats || userStats.length === 0) {
      console.log('✅ No user stats found')
      return
    }
    
    console.log(`📊 Found ${userStats.length} users with emails`)
    
    // Group by email and find duplicates
    const emailGroups: { [email: string]: any[] } = {}
    
    userStats.forEach(user => {
      if (user.email) {
        if (!emailGroups[user.email]) {
          emailGroups[user.email] = []
        }
        emailGroups[user.email].push(user)
      }
    })
    
    // Find emails with duplicates
    const duplicates: { email: string; users: any[]; keepUserId: string; deleteUserIds: string[] }[] = []
    
    Object.entries(emailGroups).forEach(([email, users]) => {
      if (users.length > 1) {
        // Sort by createdAt (newest first) and keep the most recent
        const sortedUsers = users.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        
        const keepUserId = sortedUsers[0].userId
        const deleteUserIds = sortedUsers.slice(1).map(u => u.userId)
        
        duplicates.push({
          email,
          users: sortedUsers,
          keepUserId,
          deleteUserIds
        })
      }
    })
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate emails found')
      return
    }
    
    console.log(`\n🔍 Found ${duplicates.length} emails with duplicates:`)
    
    duplicates.forEach((dup, index) => {
      console.log(`\n${index + 1}. ${dup.email}:`)
      console.log(`   Keep: ${dup.keepUserId} (${dup.users[0].createdAt})`)
      dup.deleteUserIds.forEach((userId, i) => {
        const user = dup.users[i + 1]
        console.log(`   Delete: ${userId} (${user.createdAt})`)
      })
    })
    
    console.log('\n⚠️  SAFETY CHECK:')
    console.log('This will delete duplicate user records, keeping only the most recent one for each email.')
    console.log('Are you sure you want to proceed? (y/N)')
    
    // For safety, we'll just show what would be deleted
    console.log('\n📝 To actually delete duplicates, run:')
    console.log('await deleteDuplicateUsers()')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

async function deleteDuplicateUsers() {
  console.log('🗑️ Starting duplicate user deletion...')
  
  try {
    // Get all user stats with emails
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('userId, email, createdAt')
      .not('email', 'is', null)
      .order('createdAt', { ascending: false })
    
    if (statsError) {
      console.error('❌ Error fetching user stats:', statsError)
      return
    }
    
    // Group by email and find duplicates
    const emailGroups: { [email: string]: any[] } = {}
    
    userStats.forEach(user => {
      if (user.email) {
        if (!emailGroups[user.email]) {
          emailGroups[user.email] = []
        }
        emailGroups[user.email].push(user)
      }
    })
    
    let totalDeleted = 0
    
    // Process each email group
    for (const [email, users] of Object.entries(emailGroups)) {
      if (users.length > 1) {
        // Sort by createdAt (newest first) and keep the most recent
        const sortedUsers = users.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        
        const keepUserId = sortedUsers[0].userId
        const deleteUserIds = sortedUsers.slice(1).map(u => u.userId)
        
        console.log(`\n📧 Processing ${email}:`)
        console.log(`   Keeping: ${keepUserId}`)
        
        // Delete duplicate users
        for (const userId of deleteUserIds) {
          console.log(`   Deleting: ${userId}`)
          
          // Delete tasks for this user
          const { error: tasksError } = await supabase
            .from('tasks')
            .delete()
            .eq('userId', userId)
          
          if (tasksError) {
            console.error(`   ❌ Error deleting tasks for ${userId}:`, tasksError)
          } else {
            console.log(`   ✅ Tasks deleted for ${userId}`)
          }
          
          // Delete user stats
          const { error: statsError } = await supabase
            .from('user_stats')
            .delete()
            .eq('userId', userId)
          
          if (statsError) {
            console.error(`   ❌ Error deleting user stats for ${userId}:`, statsError)
          } else {
            console.log(`   ✅ User stats deleted for ${userId}`)
            totalDeleted++
          }
        }
      }
    }
    
    console.log(`\n✅ Cleanup completed! Deleted ${totalDeleted} duplicate user records.`)
    
  } catch (error) {
    console.error('❌ Error during duplicate deletion:', error)
  }
}

// Export functions for manual use
export { cleanupDuplicateEmails, deleteDuplicateUsers }

// Run if called directly
if (require.main === module) {
  cleanupDuplicateEmails()
    .then(() => {
      console.log('\n✅ Duplicate email analysis completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Duplicate email analysis failed:', error)
      process.exit(1)
    })
} 