import { createClient } from '@supabase/supabase-js'
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

// Initialize client
const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY)

async function testResetVerification() {
  console.log('🔍 Verifying Daily Reset Results...\n')

  try {
    // Check all users who might have been reset
    const { data: allUsers, error: usersError } = await supabase
      .from('user_stats')
      .select('user_id, email, mood_checkins_today, ai_splits_today, last_daily_reset')
      .order('last_daily_reset', { ascending: false })

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    console.log('📊 All users and their reset status:')
    console.log('=====================================')
    
    allUsers?.forEach((user, index) => {
      const lastReset = user.last_daily_reset ? new Date(user.last_daily_reset).toLocaleString() : 'Never'
      const resetStatus = user.mood_checkins_today === 0 && user.ai_splits_today === 0 ? '✅ RESET' : '❌ NOT RESET'
      
      console.log(`${index + 1}. ${user.user_id}`)
      console.log(`   Email: ${user.email || 'No email'}`)
      console.log(`   Mood check-ins: ${user.mood_checkins_today}`)
      console.log(`   AI splits: ${user.ai_splits_today}`)
      console.log(`   Last reset: ${lastReset}`)
      console.log(`   Status: ${resetStatus}`)
      console.log('')
    })

    // Check if any users have tasks (they shouldn't after reset)
    console.log('🔍 Checking for remaining tasks...')
    
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('"userId", title, completed')
      .limit(10)

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError)
    } else {
      console.log(`📋 Total tasks in system: ${allTasks?.length || 0}`)
      
      if (allTasks && allTasks.length > 0) {
        console.log('📝 Remaining tasks:')
        allTasks.forEach(task => {
          console.log(`  - ${task.title} (${task.completed ? 'completed' : 'pending'}) - User: ${task.userId}`)
        })
      } else {
        console.log('✅ All tasks cleared successfully!')
      }
    }

    // Check recent reset activity
    console.log('\n🕐 Recent reset activity:')
    console.log('========================')
    
    const recentResets = allUsers?.filter(user => {
      if (!user.last_daily_reset) return false
      const resetTime = new Date(user.last_daily_reset)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return resetTime > oneHourAgo
    })

    if (recentResets && recentResets.length > 0) {
      console.log(`✅ Found ${recentResets.length} users reset in the last hour:`)
      recentResets.forEach(user => {
        console.log(`  - ${user.user_id} (${user.email || 'No email'})`)
      })
    } else {
      console.log('❌ No recent resets found')
    }

    console.log('\n✨ Verification Summary:')
    console.log('========================')
    console.log(`Total users: ${allUsers?.length || 0}`)
    console.log(`Users with reset limits: ${allUsers?.filter(u => u.mood_checkins_today === 0 && u.ai_splits_today === 0).length || 0}`)
    console.log(`Remaining tasks: ${allTasks?.length || 0}`)
    console.log(`Recent resets: ${recentResets?.length || 0}`)

  } catch (error) {
    console.error('❌ Error during verification:', error)
  }
}

// Run the verification
testResetVerification() 