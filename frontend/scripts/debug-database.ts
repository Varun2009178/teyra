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

console.log('🔧 Debugging database operations...')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseAnonKey?.length || 0)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugDatabase() {
  try {
    // Test 1: Basic connection
    console.log('\n📡 Test 1: Basic connection...')
    const { data: testData, error: testError } = await supabase.from('tasks').select('count').limit(1)
    console.log('Test result:', { data: testData, error: testError })

    // Test 2: Get tasks (like the app does)
    console.log('\n📋 Test 2: Get tasks...')
    const testUserId = 'test-user-123'
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('userId', testUserId)
      .order('createdAt', { ascending: false })
    
    console.log('Get tasks result:', { 
      data: tasksData, 
      error: tasksError,
      errorCode: tasksError?.code,
      errorMessage: tasksError?.message 
    })

    // Test 3: Create a task (like the app does)
    console.log('\n➕ Test 3: Create task...')
    const { data: createData, error: createError } = await supabase
      .from('tasks')
      .insert([
        {
          userId: testUserId,
          title: 'Test task from debug script',
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

    // Test 4: Get user stats (like the app does)
    console.log('\n📊 Test 4: Get user stats...')
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', testUserId)
      .single()
    
    console.log('Get user stats result:', { 
      data: statsData, 
      error: statsError,
      errorCode: statsError?.code,
      errorMessage: statsError?.message 
    })

    // Test 5: Create user stats (like the app does)
    console.log('\n👤 Test 5: Create user stats...')
    const { data: createStatsData, error: createStatsError } = await supabase
      .from('user_stats')
      .insert([
        {
          user_id: testUserId,
          all_time_completed: 0,
          current_streak: 0,
          completed_this_week: 0,
          completed_today: 0,
          last_completed_date: '',
          subscription_level: 'basic',
          ai_suggestions_enabled: true,
          user_mood: 'neutral',
          show_analytics: true,
        },
      ])
      .select()
      .single()
    
    console.log('Create user stats result:', { 
      data: createStatsData, 
      error: createStatsError,
      errorCode: createStatsError?.code,
      errorMessage: createStatsError?.message 
    })

    // Test 6: Check RLS status
    console.log('\n🔒 Test 6: Check RLS status...')
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('get_rls_status')
    
    console.log('RLS status result:', { 
      data: rlsData, 
      error: rlsError 
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugDatabase() 