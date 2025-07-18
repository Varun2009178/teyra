import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaixpzbbqocssdznztev.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhaXhwemJicW9jc3Nkem56dGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDcxODIsImV4cCI6MjA2ODI4MzE4Mn0.8A4y5Xoe-kWQhCqS1kSQtBZQHHEvfK1z2xBxFDEPsD8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function enableMigratedNotifications() {
  console.log('🔧 Enabling notifications for migrated users with emails...\n')
  
  try {
    // Find migrated users with emails but notifications disabled
    const { data: users, error: userError } = await supabase
      .from('user_stats')
      .select('user_id, email, notifications_enabled, all_time_completed')
      .neq('email', 'null')
      .neq('email', '')
      .not('email', 'is', null)
      .eq('notifications_enabled', false)
      .gt('all_time_completed', 0) // Migrated users have completed tasks

    if (userError || !users) {
      console.error('❌ Error fetching users:', userError)
      return
    }

    console.log(`📧 Found ${users.length} migrated users with emails but notifications disabled\n`)

    if (users.length === 0) {
      console.log('✅ No users need notification enabling')
      return
    }

    console.log('👥 Users to enable notifications for:')
    users.forEach(user => {
      console.log(`  - ${user.user_id}: ${user.email} (completed: ${user.all_time_completed})`)
    })

    // Enable notifications for these users
    const userIds = users.map(user => user.user_id)
    const { data: updatedUsers, error: updateError } = await supabase
      .from('user_stats')
      .update({ notifications_enabled: true })
      .in('user_id', userIds)
      .select()

    if (updateError) {
      console.error('❌ Error updating users:', updateError)
      return
    }

    console.log(`\n✅ Successfully enabled notifications for ${updatedUsers?.length || 0} users`)
    
    if (updatedUsers) {
      console.log('\n📧 Updated users:')
      updatedUsers.forEach(user => {
        console.log(`  - ${user.user_id}: ${user.email} (notifications: ${user.notifications_enabled})`)
      })
    }

    // Now check how many users would be eligible for emails
    const { data: allEligibleUsers, error: eligibleError } = await supabase
      .from('user_stats')
      .select('user_id, email, notifications_enabled, last_activity_at, all_time_completed')
      .eq('notifications_enabled', true)
      .neq('email', 'null')
      .neq('email', '')
      .not('email', 'is', null)

    if (eligibleError) {
      console.error('❌ Error fetching eligible users:', eligibleError)
      return
    }

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const inactiveUsers = allEligibleUsers?.filter(user => {
      const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null
      return lastActivity && lastActivity < twentyFourHoursAgo
    }) || []

    console.log(`\n🎯 After enabling notifications:`)
    console.log(`  Total users with emails and notifications: ${allEligibleUsers?.length || 0}`)
    console.log(`  Inactive users (>24h) who would get emails: ${inactiveUsers.length}`)
    
    if (inactiveUsers.length > 0) {
      console.log('\n📧 Users who would get emails:')
      inactiveUsers.forEach(user => {
        const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null
        const hoursInactive = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)) : 'Unknown'
        console.log(`  - ${user.user_id}: ${user.email} (inactive for ${hoursInactive}h, completed: ${user.all_time_completed})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

enableMigratedNotifications() 