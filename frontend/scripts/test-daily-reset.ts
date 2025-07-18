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

async function testDailyReset() {
  console.log('🧪 Testing daily reset system...')

  try {
    // First, let's create some test tasks for a user
    const testUserId = 'user_302AND0wGcufqBhXCjxZZCk3BTp' // Varun's user ID
    
    console.log('📝 Creating test tasks...')
    
    // Create some test tasks
    const testTasks = [
      { title: 'Complete project proposal', completed: true },
      { title: 'Review code changes', completed: true },
      { title: 'Schedule team meeting', completed: false },
      { title: 'Update documentation', completed: false },
      { title: 'Send follow-up emails', completed: true }
    ]

    for (const task of testTasks) {
      const { error } = await supabase
        .from('tasks')
        .insert({
          "userId": testUserId,
          title: task.title,
          completed: task.completed
        })
      
      if (error) {
        console.error('❌ Error creating task:', error)
      } else {
        console.log(`✅ Created task: ${task.text} (${task.completed ? 'completed' : 'pending'})`)
      }
    }

    // Update user stats to trigger daily reset
    console.log('🔄 Updating user stats to trigger daily reset...')
    
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    
    const { error: updateError } = await supabase
      .from('user_stats')
      .update({ 
        last_daily_reset: twentyFiveHoursAgo,
        mood_checkins_today: 3,
        ai_splits_today: 2
      })
      .eq('user_id', testUserId)

    if (updateError) {
      console.error('❌ Error updating user stats:', updateError)
      return
    }

    console.log('✅ Updated user stats to trigger daily reset')

    // Now trigger the daily reset
    console.log('🚀 Triggering daily reset...')
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/daily-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Daily reset completed:', result)
    } else {
      console.error('❌ Daily reset failed:', response.status, response.statusText)
    }

    // Check if task summary was created
    console.log('🔍 Checking for task summary...')
    
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id, mood_checkins_today, ai_splits_today')
      .eq('user_id', testUserId)

    if (statsError) {
      console.error('❌ Error fetching user stats:', statsError)
    } else if (userStats && userStats.length > 0) {
      const stats = userStats[0]
      console.log('📊 User stats after reset:', {
        userId: stats.user_id,
        moodCheckins: stats.mood_checkins_today,
        aiSplits: stats.ai_splits_today
      })
    }

    // Check if tasks were cleared
    console.log('🔍 Checking if tasks were cleared...')
    
    const { data: remainingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, completed')
      .eq('"userId"', testUserId)

    if (tasksError) {
      console.error('❌ Error fetching remaining tasks:', tasksError)
    } else {
      console.log(`📋 Remaining tasks: ${remainingTasks?.length || 0}`)
      if (remainingTasks && remainingTasks.length > 0) {
        console.log('Tasks still exist:', remainingTasks)
      } else {
        console.log('✅ All tasks were cleared as expected')
      }
    }

  } catch (error) {
    console.error('❌ Error during daily reset test:', error)
  }
}

// Run the test
testDailyReset() 