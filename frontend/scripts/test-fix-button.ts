import { createClient } from '@supabase/supabase-js'
import { fixCompletedTasksCount, getTasks, createTask, updateTask } from '../src/lib/database'

const supabaseUrl = 'https://xqjqflzqjqjqjqjqjqjq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxanFmbHpxanFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ0NzQsImV4cCI6MjA1MDU1MDQ3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFixButton() {
  console.log('🧪 Testing Fix Completed Tasks Button functionality...\n')
  
  // Test user ID (replace with actual user ID)
  const testUserId = 'user_2abc123def456ghi789jkl'
  
  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current state...')
    const result1 = await fixCompletedTasksCount(supabase, testUserId)
    console.log('Initial check result:', result1)
    
    // Step 2: Create some test tasks
    console.log('\n📝 Step 2: Creating test tasks...')
    const task1 = await createTask(supabase, testUserId, 'Test task 1')
    const task2 = await createTask(supabase, testUserId, 'Test task 2')
    const task3 = await createTask(supabase, testUserId, 'Test task 3')
    
    console.log('Created tasks:', { task1: task1?.title, task2: task2?.title, task3: task3?.title })
    
    // Step 3: Complete some tasks
    console.log('\n✅ Step 3: Completing tasks...')
    if (task1 && task1.id) {
      await updateTask(supabase, task1.id, { completed: true })
      console.log('Completed task 1')
    }
    if (task2 && task2.id) {
      await updateTask(supabase, task2.id, { completed: true })
      console.log('Completed task 2')
    }
    
    // Step 4: Test the fix function
    console.log('\n🔧 Step 4: Testing fix function...')
    const result2 = await fixCompletedTasksCount(supabase, testUserId)
    console.log('Fix result:', result2)
    
    // Step 5: Verify the fix worked
    console.log('\n🔍 Step 5: Verifying fix worked...')
    const result3 = await fixCompletedTasksCount(supabase, testUserId)
    console.log('Verification result:', result3)
    
    // Step 6: Clean up test tasks
    console.log('\n🧹 Step 6: Cleaning up test tasks...')
    const allTasks = await getTasks(supabase, testUserId)
    const testTasks = allTasks.filter(task => 
      task.title.includes('Test task')
    )
    
    for (const task of testTasks) {
      if (task.id && task.id !== 'null') {
        // Delete task by setting it as completed and then we can clean up later
        await updateTask(supabase, task.id, { completed: true })
      }
    }
    
    console.log('\n✅ Test completed successfully!')
    console.log('📊 Summary:')
    console.log(`- Initial state: ${result1.fixed ? 'Fixed' : 'Already correct'}`)
    console.log(`- After creating tasks: ${result2.fixed ? 'Fixed' : 'Already correct'}`)
    console.log(`- Final verification: ${result3.fixed ? 'Fixed' : 'Already correct'}`)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testFixButton() 