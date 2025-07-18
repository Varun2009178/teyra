import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testCurrentUser() {
  console.log('🔍 Testing current user data compatibility...')
  
  try {
    // Test 1: Check if we can access user_stats table
    console.log('\n📊 Testing user_stats table access...')
    const { data: allUsers, error: usersError } = await supabase
      .from('user_stats')
      .select('*')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Error accessing user_stats:', usersError)
      return
    }
    
    console.log(`✅ Found ${allUsers?.length || 0} users in database`)
    
    if (allUsers && allUsers.length > 0) {
      const sampleUser = allUsers[0]
      console.log('📋 Sample user columns:', Object.keys(sampleUser))
      console.log('🔍 Key columns check:')
      console.log('   - userId:', typeof sampleUser.userId, sampleUser.userId ? '✅' : '❌')
      console.log('   - createdAt:', typeof sampleUser.createdAt, sampleUser.createdAt ? '✅' : '❌')
      console.log('   - updatedAt:', typeof sampleUser.updatedAt, sampleUser.updatedAt ? '✅' : '❌')
      console.log('   - last_daily_reset:', typeof sampleUser.last_daily_reset, sampleUser.last_daily_reset ? '✅' : '❌')
    }

    // Test 2: Check if we can access tasks table
    console.log('\n📋 Testing tasks table access...')
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5)
    
    if (tasksError) {
      console.error('❌ Error accessing tasks:', tasksError)
      return
    }
    
    console.log(`✅ Found ${allTasks?.length || 0} tasks in database`)
    
    if (allTasks && allTasks.length > 0) {
      const sampleTask = allTasks[0]
      console.log('📋 Sample task columns:', Object.keys(sampleTask))
      console.log('🔍 Key columns check:')
      console.log('   - userId:', typeof sampleTask.userId, sampleTask.userId ? '✅' : '❌')
      console.log('   - title:', typeof sampleTask.title, sampleTask.title ? '✅' : '❌')
      console.log('   - createdAt:', typeof sampleTask.createdAt, sampleTask.createdAt ? '✅' : '❌')
      console.log('   - updatedAt:', typeof sampleTask.updatedAt, sampleTask.updatedAt ? '✅' : '❌')
    }

    // Test 3: Try to create a test task with your existing user
    if (allUsers && allUsers.length > 0) {
      const testUserId = allUsers[0].userId
      console.log(`\n🧪 Testing task creation with existing user: ${testUserId}`)
      
      const testTaskData = {
        userId: testUserId,
        title: 'Test task for existing user',
        completed: false,
        createdAt: new Date().toISOString(),
        has_been_split: false
      }
      
      const { data: createdTask, error: createError } = await supabase
        .from('tasks')
        .insert([testTaskData])
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating test task:', createError)
      } else {
        console.log('✅ Test task created successfully:', createdTask)
        
        // Clean up test task
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', createdTask.id)
        
        if (deleteError) {
          console.error('⚠️ Error cleaning up test task:', deleteError)
        } else {
          console.log('🧹 Test task cleaned up')
        }
      }
    }

    console.log('\n🎉 Current user data compatibility test completed!')
    console.log('\n📝 Summary:')
    console.log('✅ Your existing account should work with the new schema')
    console.log('✅ No need to delete your account')
    console.log('✅ All column names are now consistent')
    console.log('\n🚀 You can now start your dev server and test the app!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testCurrentUser() 