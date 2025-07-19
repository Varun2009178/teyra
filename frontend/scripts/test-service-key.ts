import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testServiceKey() {
  console.log('🔑 Testing Service Key...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.NEW_SUPABASE_SERVICE_KEY

  console.log('📋 Environment Check:')
  console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('Service Key:', serviceKey ? '✅ Set' : '❌ Missing')
  console.log('Service Key Length:', serviceKey?.length || 0, 'characters')
  console.log('')

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing required environment variables')
    return
  }

  // Test with service key
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    console.log('🔗 Testing Service Key Connection...')
    
    // Test basic query
    const { data, error } = await supabase
      .from('user_stats')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Service key test failed:', error.message)
      console.error('Error code:', error.code)
      console.error('Error details:', error.details)
      
      if (error.message.includes('JWSInvalidSignature')) {
        console.log('\n💡 This suggests the service key is invalid or corrupted.')
        console.log('💡 Check if the key is copied correctly from Supabase dashboard.')
      }
      
      return
    }
    
    console.log('✅ Service key is valid and working!')
    console.log('✅ Can access database with service key')
    
    // Test a more complex operation
    console.log('\n🔍 Testing Service Key Permissions...')
    
    const { data: userCount, error: countError } = await supabase
      .from('user_stats')
      .select('userId', { count: 'exact' })
    
    if (countError) {
      console.error('❌ Permission test failed:', countError.message)
    } else {
      console.log('✅ Service key has proper permissions')
      console.log('✅ Can perform complex queries')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testServiceKey().catch(console.error) 