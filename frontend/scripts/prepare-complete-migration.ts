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

async function analyzeMigrationStatus() {
  console.log('🔍 Analyzing migration status...\n')

  try {
    // Get all users from Clerk
    console.log('📋 Getting all Clerk users...')
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 500
    })
    
    console.log(`✅ Found ${clerkUsers.length} total Clerk users`)

    // Get all migrated users from our database
    console.log('\n📊 Getting migrated users from database...')
    const { data: migratedUsers, error: migratedError } = await newSupabase
      .from('user_migrations')
      .select('*')

    if (migratedError) {
      console.error('❌ Error fetching migrated users:', migratedError)
      return
    }

    console.log(`✅ Found ${migratedUsers?.length || 0} migrated users in database`)

    // Get all users from user_stats
    console.log('\n📈 Getting users from user_stats...')
    const { data: userStats, error: statsError } = await newSupabase
      .from('user_stats')
      .select('user_id, email, notifications_enabled, last_activity_at')

    if (statsError) {
      console.error('❌ Error fetching user stats:', statsError)
      return
    }

    console.log(`✅ Found ${userStats?.length || 0} users in user_stats`)

    // Analyze the data
    const migratedUserIds = new Set(migratedUsers?.map(u => u.new_user_id) || [])
    const userStatsIds = new Set(userStats?.map(u => u.user_id) || [])
    const clerkUserIds = new Set(clerkUsers.map(u => u.id))

    console.log('\n📊 Migration Analysis:')
    console.log('=====================')
    console.log(`Total Clerk Users: ${clerkUsers.length}`)
    console.log(`Users in user_stats: ${userStats?.length || 0}`)
    console.log(`Migrated Users: ${migratedUsers?.length || 0}`)

    // Find users with emails in Clerk but not in user_stats
    const usersWithEmails = clerkUsers.filter(user => 
      user.emailAddresses && user.emailAddresses.length > 0 && 
      user.emailAddresses[0].emailAddress
    )

    console.log(`\n📧 Users with emails in Clerk: ${usersWithEmails.length}`)
    
    const usersWithEmailsInStats = userStats?.filter(user => 
      user.email && user.email !== 'null' && user.email !== ''
    ) || []

    console.log(`📧 Users with emails in user_stats: ${usersWithEmailsInStats.length}`)

    // Find users that need migration
    const usersNeedingMigration = usersWithEmails.filter(user => 
      !userStatsIds.has(user.id)
    )

    console.log(`\n🚨 Users needing migration: ${usersNeedingMigration.length}`)

    if (usersNeedingMigration.length > 0) {
      console.log('\n📋 Users that need to be migrated:')
      console.log('==================================')
      usersNeedingMigration.forEach((user, index) => {
        const email = user.emailAddresses?.[0]?.emailAddress || 'No email'
        const firstName = user.firstName || 'No first name'
        const lastName = user.lastName || 'No last name'
        console.log(`${index + 1}. ${firstName} ${lastName} (${email}) - ID: ${user.id}`)
      })
    }

    // Find users with emails but no notifications enabled
    const usersWithEmailsNoNotifications = userStats?.filter(user => 
      user.email && user.email !== 'null' && user.email !== '' && 
      !user.notifications_enabled
    ) || []

    console.log(`\n🔔 Users with emails but notifications disabled: ${usersWithEmailsNoNotifications.length}`)

    if (usersWithEmailsNoNotifications.length > 0) {
      console.log('\n📋 Users with emails but no notifications:')
      console.log('==========================================')
      usersWithEmailsNoNotifications.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ID: ${user.user_id}`)
      })
    }

    // Summary
    console.log('\n📈 Summary:')
    console.log('==========')
    console.log(`• Total users in system: ${clerkUsers.length}`)
    console.log(`• Users with emails: ${usersWithEmails.length}`)
    console.log(`• Users migrated: ${migratedUsers?.length || 0}`)
    console.log(`• Users needing migration: ${usersNeedingMigration.length}`)
    console.log(`• Users with emails but no notifications: ${usersWithEmailsNoNotifications.length}`)

    if (usersNeedingMigration.length > 0) {
      console.log('\n🚀 Next Steps:')
      console.log('==============')
      console.log('1. Export the missing users from your migration sheet')
      console.log('2. Update the CSV files in scripts/data/')
      console.log('3. Run the migration script to import these users')
      console.log('4. Enable notifications for users with emails')
    }

  } catch (error) {
    console.error('❌ Error analyzing migration status:', error)
  }
}

// Run the analysis
analyzeMigrationStatus() 