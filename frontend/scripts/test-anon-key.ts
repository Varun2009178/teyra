import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testAnonKey() {
  console.log('🔑 Testing Anon Key...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('📋 Environment Check:')
  console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('Anon Key:', anonKey ? '✅ Set' : '❌ Missing')
  console.log('Anon Key Length:', anonKey?.length || 0, 'characters')
  console.log('')

  if (!supabaseUrl || !anonKey) {
    console.error('❌ Missing required environment variables')
    return
  }

  // Test with anon key
  const supabase = createClient(supabaseUrl, anonKey)

  try {
    console.log('🔗 Testing Anon Key Connection...')
    
    // Test basic query (this should work with anon key)
    const { data, error } = await supabase
      .from('user_stats')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Anon key test failed:', error.message)
      console.error('Error code:', error.code)
      console.error('Error details:', error.details)
      return
    }
    
    console.log('✅ Anon key is valid and working!')
    console.log('✅ Can access database with anon key')
    
    // Test RLS policies
    console.log('\n🔍 Testing RLS Policies...')
    
    // This should fail due to RLS (no user context)
    const { data: userStats, error: rlsError } = await supabase
      .from('user_stats')
      .select('userId')
      .limit(1)
    
    if (rlsError) {
      console.log('✅ RLS is working (expected error):', rlsError.message)
    } else {
      console.log('⚠️ RLS might not be enabled (unexpected success)')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAnonKey().catch(console.error) 