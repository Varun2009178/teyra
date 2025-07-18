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

async function testInsert() {
  try {
    console.log('🧪 Testing database insert...')
    
    const testTask = {
      userId: 'user_2zxyBK5JXtT0xHsHRrAoPlSH8xT',
      title: 'Test task from script',
      completed: false,
    }
    
    console.log('📤 Inserting test task:', testTask)
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([testTask])
      .select()
      .single()

    if (error) {
      console.error('❌ Insert error:', error)
      return
    }

    console.log('✅ Insert successful:', data)
    console.log('🔍 Task ID:', data.id)
    console.log('🔍 Task ID type:', typeof data.id)
    
    // Try to fetch the task back
    console.log('\n📥 Fetching the task back...')
    const { data: fetchedTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('title', 'Test task from script')
      .single()
    
    if (fetchError) {
      console.error('❌ Fetch error:', fetchError)
    } else {
      console.log('✅ Fetched task:', fetchedTask)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testInsert() 