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

async function testRealUser() {
  try {
    console.log('🔧 Testing with real user data...')
    
    // Get a real user ID from the database
    const { data: realUser, error: userError } = await supabase
      .from('user_stats')
      .select('user_id')
      .limit(1)
    
    if (userError || !realUser || realUser.length === 0) {
      console.error('❌ No real users found:', userError)
      return
    }
    
    const realUserId = realUser[0].user_id
    console.log('👤 Using real user ID:', realUserId)
    
    // Test 1: Get tasks for real user
    console.log('\n📋 Test 1: Get tasks for real user...')
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('userId', realUserId)
      .order('createdAt', { ascending: false })
    
    console.log('Get tasks result:', { 
      data: tasksData, 
      error: tasksError,
      errorCode: tasksError?.code,
      errorMessage: tasksError?.message 
    })
    
    // Test 2: Create task for real user
    console.log('\n➕ Test 2: Create task for real user...')
    const { data: createData, error: createError } = await supabase
      .from('tasks')
      .insert([
        {
          userId: realUserId,
          title: 'Test task from real user script',
          completed: false,
        },
      ])
      .select()
      .single()
    
    console.log('Create task result:', { 
      data: createData, 
      error: createError,
      errorCode: createError?.code,
      errorMessage: createError?.message 
    })
    
    // Test 3: Get user stats for real user
    console.log('\n📊 Test 3: Get user stats for real user...')
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', realUserId)
      .single()
    
    console.log('Get user stats result:', { 
      data: statsData, 
      error: statsError,
      errorCode: statsError?.code,
      errorMessage: statsError?.message 
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testRealUser() 