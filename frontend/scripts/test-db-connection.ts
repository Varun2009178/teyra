import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaixpzbbqocssdznztev.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhaXhwemJicW9jc3Nkem56dGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDcxODIsImV4cCI6MjA2ODI4MzE4Mn0.8A4y5Xoe-kWQhCqS1kSQtBZQHHEvfK1z2xBxFDEPsD8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Test tasks table
    console.log('📋 Testing tasks table...')
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1)
    
    if (tasksError) {
      console.error('❌ Tasks table test failed:', tasksError)
    } else {
      console.log('✅ Tasks table accessible')
      console.log('📊 Sample task data:', tasksData)
    }
    
    // Test user_stats table
    console.log('📊 Testing user_stats table...')
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .limit(1)
    
    if (statsError) {
      console.error('❌ User stats table test failed:', statsError)
    } else {
      console.log('✅ User stats table accessible')
      console.log('📊 Sample user stats data:', statsData)
    }
    
    // Test inserting a task with correct column names
    const testTask = {
      userId: 'test-user-123',
      title: 'Test task for completion',
      completed: false
    }
    
    console.log('📝 Testing task insertion...')
    const { data: insertData, error: insertError } = await supabase
      .from('tasks')
      .insert([testTask])
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Task insertion failed:', insertError)
      return
    }
    
    console.log('✅ Task insertion successful:', insertData)
    
    // Test updating the task to completed
    console.log('✅ Testing task completion...')
    const { data: updateData, error: updateError } = await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('userId', 'test-user-123')
      .eq('title', 'Test task for completion')
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Task completion failed:', updateError)
    } else {
      console.log('✅ Task completion successful:', updateData)
    }
    
    // Clean up - delete the test task
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('userId', 'test-user-123')
      .eq('title', 'Test task for completion')
    
    if (deleteError) {
      console.error('⚠️ Failed to clean up test task:', deleteError)
    } else {
      console.log('✅ Test task cleaned up successfully')
    }
    
  } catch (err) {
    console.error('❌ Exception during test:', err)
  }
}

testConnection() 