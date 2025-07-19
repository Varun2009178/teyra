import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function debugServiceKey() {
  console.log('🔍 Debugging Service Key Issue...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.NEW_SUPABASE_SERVICE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('📋 Environment Variables:')
  console.log('URL:', supabaseUrl)
  console.log('Service Key (first 20 chars):', serviceKey?.substring(0, 20) + '...')
  console.log('Anon Key (first 20 chars):', anonKey?.substring(0, 20) + '...')
  console.log('')

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing required environment variables')
    return
  }

  // Test 1: Try with service key
  console.log('🧪 Test 1: Service Key')
  try {
    const supabase1 = createClient(supabaseUrl, serviceKey)
    const { data, error } = await supabase1
      .from('user_stats')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Service key failed:', error.message)
      console.error('Error code:', error.code)
    } else {
      console.log('✅ Service key works!')
    }
  } catch (err) {
    console.error('❌ Service key exception:', err)
  }
  console.log('')

  // Test 2: Try with anon key (should work)
  console.log('🧪 Test 2: Anon Key')
  try {
    const supabase2 = createClient(supabaseUrl, anonKey!)
    const { data, error } = await supabase2
      .from('user_stats')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Anon key failed:', error.message)
    } else {
      console.log('✅ Anon key works!')
    }
  } catch (err) {
    console.error('❌ Anon key exception:', err)
  }
  console.log('')

  // Test 3: Try with different URL format
  console.log('🧪 Test 3: URL Format Check')
  const urlWithoutProtocol = supabaseUrl.replace('https://', '').replace('http://', '')
  const urlWithHttps = `https://${urlWithoutProtocol}`
  const urlWithHttp = `http://${urlWithoutProtocol}`
  
  console.log('Original URL:', supabaseUrl)
  console.log('URL without protocol:', urlWithoutProtocol)
  console.log('URL with https:', urlWithHttps)
  console.log('URL with http:', urlWithHttp)
  console.log('')

  // Test 4: Try with https URL
  if (supabaseUrl !== urlWithHttps) {
    console.log('🧪 Test 4: HTTPS URL')
    try {
      const supabase4 = createClient(urlWithHttps, serviceKey)
      const { data, error } = await supabase4
        .from('user_stats')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('❌ HTTPS URL failed:', error.message)
      } else {
        console.log('✅ HTTPS URL works!')
        console.log('💡 Try using this URL format in your .env.local')
      }
    } catch (err) {
      console.error('❌ HTTPS URL exception:', err)
    }
    console.log('')
  }

  // Test 5: Check if it's a project issue
  console.log('🧪 Test 5: Project Check')
  try {
    const supabase5 = createClient(supabaseUrl, anonKey!)
    const { data, error } = await supabase5
      .from('user_stats')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('✅ RLS is working (expected error):', error.message)
    } else {
      console.log('⚠️ RLS might be disabled - this could be the issue!')
      console.log('💡 Your local database might not have RLS enabled')
    }
  } catch (err) {
    console.error('❌ Project check exception:', err)
  }
  console.log('')

  console.log('🔍 Debug Summary:')
  console.log('1. If anon key works but service key doesn\'t: Key issue')
  console.log('2. If HTTPS URL works: URL format issue')
  console.log('3. If RLS is disabled: Local vs production difference')
  console.log('4. If nothing works: Project configuration issue')
}

debugServiceKey().catch(console.error) 