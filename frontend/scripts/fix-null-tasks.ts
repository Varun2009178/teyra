import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEW_SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixNullTasks() {
  console.log('🔧 Fixing tasks with null IDs and timestamps...')
  
  try {
    // Get all tasks with null IDs
    const { data: nullTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .is('id', null)
    
    if (error) {
      console.error('❌ Error fetching null tasks:', error)
      return
    }
    
    console.log(`📊 Found ${nullTasks?.length || 0} tasks with null IDs`)
    
    if (!nullTasks || nullTasks.length === 0) {
      console.log('✅ No tasks with null IDs found')
      return
    }
    
    // Fix each task
    for (const task of nullTasks) {
      const now = new Date().toISOString()
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          id: `fixed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: task.createdAt || now,
          completedAt: task.completedAt || null,
          assignedDate: task.assignedDate || null,
          expired: task.expired || false
        })
        .eq('user_id', task.user_id)
        .eq('title', task.title)
        .is('id', null)
      
      if (updateError) {
        console.error('❌ Error fixing task:', updateError)
      } else {
        console.log(`✅ Fixed task: ${task.title}`)
      }
    }
    
    console.log('🎉 Finished fixing null tasks!')
    
  } catch (error) {
    console.error('❌ Error in fixNullTasks:', error)
  }
}

fixNullTasks() 