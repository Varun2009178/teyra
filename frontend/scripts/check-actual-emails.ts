import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaixpzbbqocssdznztev.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhaXhwemJicW9jc3Nkem56dGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDcxODIsImV4cCI6MjA2ODI4MzE4Mn0.8A4y5Xoe-kWQhCqS1kSQtBZQHHEvfK1z2xBxFDEPsD8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkActualEmails() {
  console.log('🔍 Checking actual email data in the database...\n')
  
  try {
    // Get all users with their email data
    const { data: allUsers, error: userError } = await supabase
      .from('user_stats')
      .select('user_id, email, notifications_enabled, last_activity_at, created_at, all_time_completed')

    if (userError || !allUsers) {
      console.error('❌ Error fetching users:', userError)
      return
    }

    console.log(`📊 Found ${allUsers.length} total users\n`)

    // Show all users with their actual email data
    console.log('📧 All Users with Email Data:')
    console.log('=============================')
    
    let usersWithEmail = 0
    let usersWithoutEmail = 0
    let uniqueEmails = new Set()
    let emailCounts: { [email: string]: number } = {}

    for (const user of allUsers) {
      const email = user.email
      const hasEmail = email && email.trim() !== '' && email !== 'null'
      
      if (hasEmail) {
        usersWithEmail++
        uniqueEmails.add(email)
        emailCounts[email] = (emailCounts[email] || 0) + 1
      } else {
        usersWithoutEmail++
      }

      console.log(`User: ${user.user_id}`)
      console.log(`  Raw Email: "${email}"`)
      console.log(`  Has Email: ${hasEmail ? '✅ Yes' : '❌ No'}`)
      console.log(`  Notifications: ${user.notifications_enabled ? '✅ Enabled' : '❌ Disabled'}`)
      console.log(`  All Time Completed: ${user.all_time_completed}`)
      console.log('')
    }

    console.log('📈 Email Summary:')
    console.log('=================')
    console.log(`Total Users: ${allUsers.length}`)
    console.log(`Users with Email: ${usersWithEmail}`)
    console.log(`Users without Email: ${usersWithoutEmail}`)
    console.log(`Unique Email Addresses: ${uniqueEmails.size}`)

    console.log('\n📧 Unique Email Addresses:')
    console.log('=========================')
    Array.from(uniqueEmails).forEach(email => {
      const count = emailCounts[email]
      console.log(`  ${email} (used by ${count} user${count > 1 ? 's' : ''})`)
    })

    console.log('\n🔄 Duplicate Email Analysis:')
    console.log('===========================')
    Object.entries(emailCounts)
      .filter(([email, count]) => count > 1)
      .forEach(([email, count]) => {
        console.log(`  ${email}: ${count} users`)
      })

    // Check for users who would get emails with the new logic
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const eligibleForEmail = allUsers.filter(user => {
      const hasEmail = user.email && user.email.trim() !== '' && user.email !== 'null'
      const notificationsOn = user.notifications_enabled
      const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null
      const isInactive = lastActivity && lastActivity < twentyFourHoursAgo

      return hasEmail && notificationsOn && isInactive
    })

    console.log('\n🎯 Email Eligibility (New Logic - No 48h Filter):')
    console.log('================================================')
    console.log(`Users eligible for email: ${eligibleForEmail.length}`)
    
    if (eligibleForEmail.length > 0) {
      console.log('\n📧 Users who would get emails:')
      eligibleForEmail.forEach(user => {
        const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null
        const hoursInactive = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)) : 'Unknown'
        console.log(`  - ${user.user_id}: ${user.email} (inactive for ${hoursInactive}h, completed: ${user.all_time_completed})`)
      })
    }

    // Check how many migrated users have emails
    const migratedUsersWithEmail = allUsers.filter(user => {
      const hasEmail = user.email && user.email.trim() !== '' && user.email !== 'null'
      const isMigrated = user.all_time_completed > 0
      return hasEmail && isMigrated
    })

    console.log('\n🚀 Migrated Users with Emails:')
    console.log('==============================')
    console.log(`Migrated users with emails: ${migratedUsersWithEmail.length}`)
    migratedUsersWithEmail.forEach(user => {
      console.log(`  - ${user.user_id}: ${user.email} (completed: ${user.all_time_completed})`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkActualEmails() 