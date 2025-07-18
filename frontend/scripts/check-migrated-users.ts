import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaixpzbbqocssdznztev.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhaXhwemJicW9jc3Nkem56dGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDcxODIsImV4cCI6MjA2ODI4MzE4Mn0.8A4y5Xoe-kWQhCqS1kSQtBZQHHEvfK1z2xBxFDEPsD8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMigratedUsers() {
  console.log('🔍 Checking all users and their notification settings...\n')
  
  try {
    // Get all users
    const { data: allUsers, error: userError } = await supabase
      .from('user_stats')
      .select('user_id, email, notifications_enabled, last_activity_at, created_at, all_time_completed')

    if (userError || !allUsers) {
      console.error('❌ Error fetching users:', userError)
      return
    }

    console.log(`📊 Found ${allUsers.length} total users\n`)

    const now = new Date()
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    let usersWithEmail = 0
    let usersWithoutEmail = 0
    let notificationsEnabled = 0
    let notificationsDisabled = 0
    let inactiveUsers = 0
    let activeUsers = 0
    let migratedUsers = 0

    console.log('👥 User Analysis:')
    console.log('================')

    for (const user of allUsers) {
      const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null
      const isInactive = lastActivity && lastActivity < fortyEightHoursAgo
      const hasEmail = user.email && user.email.trim() !== ''
      const isMigrated = user.all_time_completed > 0 // Users with completed tasks are likely migrated

      if (hasEmail) usersWithEmail++
      else usersWithoutEmail++

      if (user.notifications_enabled) notificationsEnabled++
      else notificationsDisabled++

      if (isInactive) inactiveUsers++
      else activeUsers++

      if (isMigrated) migratedUsers++

      console.log(`User: ${user.user_id}`)
      console.log(`  Email: ${hasEmail ? user.email : '❌ No email'}`)
      console.log(`  Notifications: ${user.notifications_enabled ? '✅ Enabled' : '❌ Disabled'}`)
      console.log(`  Last Activity: ${lastActivity ? lastActivity.toISOString() : 'Never'}`)
      console.log(`  Inactive (>48h): ${isInactive ? '✅ Yes' : '❌ No'}`)
      console.log(`  Migrated User: ${isMigrated ? '✅ Yes' : '❌ No'}`)
      console.log(`  All Time Completed: ${user.all_time_completed}`)
      console.log('')
    }

    console.log('📈 Summary:')
    console.log('==========')
    console.log(`Total Users: ${allUsers.length}`)
    console.log(`Users with Email: ${usersWithEmail}`)
    console.log(`Users without Email: ${usersWithoutEmail}`)
    console.log(`Notifications Enabled: ${notificationsEnabled}`)
    console.log(`Notifications Disabled: ${notificationsDisabled}`)
    console.log(`Active Users (<48h): ${activeUsers}`)
    console.log(`Inactive Users (>48h): ${inactiveUsers}`)
    console.log(`Migrated Users: ${migratedUsers}`)

    // Check who would get emails with current logic
    console.log('\n🎯 Current Email Logic Analysis:')
    console.log('================================')
    
    const eligibleForEmail = allUsers.filter(user => {
      const hasEmail = user.email && user.email.trim() !== ''
      const notificationsOn = user.notifications_enabled
      const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null
      const isInactive = lastActivity && lastActivity < fortyEightHoursAgo
      const wasActiveIn48h = lastActivity && lastActivity >= fortyEightHoursAgo

      return hasEmail && notificationsOn && isInactive && wasActiveIn48h
    })

    console.log(`Users eligible for email (current logic): ${eligibleForEmail.length}`)

    // Check who would get emails if we include all inactive users
    const allInactiveWithEmail = allUsers.filter(user => {
      const hasEmail = user.email && user.email.trim() !== ''
      const notificationsOn = user.notifications_enabled
      const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null
      const isInactive = lastActivity && lastActivity < fortyEightHoursAgo

      return hasEmail && notificationsOn && isInactive
    })

    console.log(`Users eligible for email (including all inactive): ${allInactiveWithEmail.length}`)

    // Show specific users who would benefit from the change
    const additionalUsers = allInactiveWithEmail.filter(user => {
      const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null
      const wasActiveIn48h = lastActivity && lastActivity >= fortyEightHoursAgo
      return !wasActiveIn48h
    })

    console.log(`\n🚀 Additional users who would get emails: ${additionalUsers.length}`)
    if (additionalUsers.length > 0) {
      console.log('These users would benefit from including all inactive users:')
      additionalUsers.forEach(user => {
        const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null
        const hoursInactive = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)) : 'Unknown'
        console.log(`  - ${user.user_id}: ${user.email} (inactive for ${hoursInactive}h)`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkMigratedUsers() 