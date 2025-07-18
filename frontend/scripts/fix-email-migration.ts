import { createClient } from '@supabase/supabase-js'
import { createClerkClient } from '@clerk/clerk-sdk-node'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Database connection
const NEW_SUPABASE_URL = 'https://qaixpzbbqocssdznztev.supabase.co'
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY!

// Initialize clients
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY)
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

async function fixEmailMigration() {
  console.log('🔧 Fixing email migration...\n')

  try {
    // Get all users from Clerk
    console.log('📋 Getting all Clerk users...')
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 500
    })
    
    console.log(`✅ Found ${clerkUsers.length} total Clerk users`)

    // Get all users from user_stats
    console.log('\n📈 Getting users from user_stats...')
    const { data: userStats, error: statsError } = await newSupabase
      .from('user_stats')
      .select('user_id, email, notifications_enabled')

    if (statsError) {
      console.error('❌ Error fetching user stats:', statsError)
      return
    }

    console.log(`✅ Found ${userStats?.length || 0} users in user_stats`)

    // Create a map of user_id to user_stats for easy lookup
    const userStatsMap = new Map(userStats?.map(u => [u.user_id, u]) || [])

    // Find users that need email updates
    const usersNeedingEmailUpdate = clerkUsers.filter(user => {
      const email = user.emailAddresses?.[0]?.emailAddress
      const userStat = userStatsMap.get(user.id)
      
      // User needs update if:
      // 1. They have an email in Clerk
      // 2. They exist in user_stats
      // 3. Their email in user_stats is null, empty, or 'null'
      return email && userStat && (!userStat.email || userStat.email === 'null' || userStat.email === '')
    })

    console.log(`\n📧 Users needing email update: ${usersNeedingEmailUpdate.length}`)

    if (usersNeedingEmailUpdate.length === 0) {
      console.log('✅ All users already have proper email addresses!')
      return
    }

    // Update emails for each user
    let updatedCount = 0
    let errorCount = 0

    for (const user of usersNeedingEmailUpdate) {
      const email = user.emailAddresses?.[0]?.emailAddress
      if (!email) continue

      console.log(`\n📧 Updating email for user ${user.id}: ${email}`)

      try {
        // Update the user_stats table with the email
        const { error: updateError } = await newSupabase
          .from('user_stats')
          .update({ 
            email: email,
            notifications_enabled: true // Enable notifications for users with emails
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error(`❌ Error updating ${user.id}:`, updateError)
          errorCount++
        } else {
          console.log(`✅ Successfully updated email for ${user.id}`)
          updatedCount++
        }
      } catch (error) {
        console.error(`❌ Error updating ${user.id}:`, error)
        errorCount++
      }
    }

    // Summary
    console.log('\n📈 Email Migration Summary:')
    console.log('==========================')
    console.log(`• Total users processed: ${usersNeedingEmailUpdate.length}`)
    console.log(`• Successfully updated: ${updatedCount}`)
    console.log(`• Errors: ${errorCount}`)

    if (updatedCount > 0) {
      console.log('\n🎉 Email migration completed successfully!')
      console.log('📧 Users now have proper email addresses and notifications enabled.')
    }

  } catch (error) {
    console.error('❌ Error during email migration:', error)
  }
}

// Run the email migration fix
fixEmailMigration() 