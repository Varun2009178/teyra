import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function mapUser() {
  try {
    console.log('🔧 Mapping current user to existing data...')
    
    const currentUserId = 'user_2zxyBK5JXtT0xHsHRrAoPlSH8xT' // Your current Clerk user
    const existingUserId = 'user_2zz9kPN6l8QiSiHEpA2VpYNXzNS' // User with data in DB
    
    // Copy user stats for the current user
    console.log('\n📊 Creating user stats for current user...')
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', existingUserId)
      .single()
    
    if (statsError) {
      console.error('❌ Error getting existing stats:', statsError)
      return
    }
    
    // Create new user stats for current user
    const { data: newStats, error: newStatsError } = await supabase
      .from('user_stats')
      .insert([
        {
          user_id: currentUserId,
          all_time_completed: statsData.all_time_completed,
          current_streak: statsData.current_streak,
          completed_this_week: statsData.completed_this_week,
          completed_today: statsData.completed_today,
          last_completed_date: statsData.last_completed_date,
          subscription_level: statsData.subscription_level,
          ai_suggestions_enabled: statsData.ai_suggestions_enabled,
          user_mood: statsData.user_mood,
          show_analytics: statsData.show_analytics,
        },
      ])
      .select()
      .single()
    
    if (newStatsError) {
      console.error('❌ Error creating new stats:', newStatsError)
    } else {
      console.log('✅ User stats created for current user')
    }
    
    // Copy tasks for the current user
    console.log('\n📋 Copying tasks for current user...')
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('userId', existingUserId)
    
    if (tasksError) {
      console.error('❌ Error getting existing tasks:', tasksError)
      return
    }
    
    if (tasksData && tasksData.length > 0) {
      const newTasks = tasksData.map(task => ({
        userId: currentUserId,
        title: task.title,
        description: task.description,
        completed: task.completed,
        completedAt: task.completedAt,
        assignedDate: task.assignedDate,
        expired: task.expired,
      }))
      
      const { data: insertedTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(newTasks)
        .select()
      
      if (insertError) {
        console.error('❌ Error copying tasks:', insertError)
      } else {
        console.log(`✅ Copied ${insertedTasks?.length || 0} tasks for current user`)
      }
    }
    
    console.log('\n🎉 User mapping complete! Your app should now work.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

mapUser() 