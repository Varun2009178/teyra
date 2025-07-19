import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEW_SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixCompletedTasks() {
  try {
    console.log('🔧 Starting to fix completed tasks...')
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('user_stats')
      .select('user_id, all_time_completed, completed_today')
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`📊 Found ${users.length} users`)
    
    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.user_id}`)
      console.log(`📈 User stats: ${user.all_time_completed} total completed, ${user.completed_today} completed today`)
      
      // Get all tasks for this user
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('userId', user.user_id)
        .order('createdAt', { ascending: false })
      
      if (tasksError) {
        console.error(`❌ Error fetching tasks for user ${user.user_id}:`, tasksError)
        continue
      }
      
      console.log(`📋 Found ${tasks.length} tasks for user`)
      
      // Count current completed tasks
      const currentCompleted = tasks.filter(t => t.completed).length
      console.log(`✅ Currently completed: ${currentCompleted}`)
      
      // If there's a mismatch, fix it
      if (currentCompleted !== user.all_time_completed) {
        console.log(`⚠️ Mismatch detected! Stats show ${user.all_time_completed} completed but only ${currentCompleted} are marked as completed`)
        
        // Mark the oldest tasks as completed to match the stats
        const tasksToComplete = user.all_time_completed - currentCompleted
        
        if (tasksToComplete > 0) {
          console.log(`🔄 Marking ${tasksToComplete} oldest tasks as completed...`)
          
          // Get the oldest uncompleted tasks
          const uncompletedTasks = tasks.filter(t => !t.completed)
          const tasksToMark = uncompletedTasks.slice(0, tasksToComplete)
          
          for (const task of tasksToMark) {
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ completed: true })
              .eq('id', task.id)
            
            if (updateError) {
              console.error(`❌ Error updating task ${task.id}:`, updateError)
            } else {
              console.log(`✅ Marked task "${task.title}" as completed`)
            }
          }
        } else if (tasksToComplete < 0) {
          console.log(`🔄 Marking ${Math.abs(tasksToComplete)} newest completed tasks as uncompleted...`)
          
          // Get the newest completed tasks
          const completedTasks = tasks.filter(t => t.completed)
          const tasksToUnmark = completedTasks.slice(0, Math.abs(tasksToComplete))
          
          for (const task of tasksToUnmark) {
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ completed: false })
              .eq('id', task.id)
            
            if (updateError) {
              console.error(`❌ Error updating task ${task.id}:`, updateError)
            } else {
              console.log(`✅ Marked task "${task.title}" as uncompleted`)
            }
          }
        }
      } else {
        console.log(`✅ Task completion status matches user stats`)
      }
    }
    
    console.log('\n🎉 Completed fixing all users!')
    
  } catch (error) {
    console.error('❌ Error in fixCompletedTasks:', error)
  }
}

// Run the fix
fixCompletedTasks() 