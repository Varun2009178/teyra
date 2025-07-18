import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL!
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_SERVICE_KEY!

console.log('🔍 Debugging database connection...')
console.log('URL:', OLD_SUPABASE_URL)
console.log('Key starts with:', OLD_SUPABASE_KEY?.substring(0, 20) + '...')

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY)

async function debugTables() {
  try {
    console.log('\n📋 Method 1: Try to get table count...')
    
    // Try to get a simple count
    const { count, error: countError } = await oldSupabase
      .from('User')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log('❌ Count error:', countError.message)
    } else {
      console.log('✅ User count:', count)
    }

    console.log('\n📋 Method 2: Try direct SQL query...')
    
    // Try a direct SQL query
    const { data: sqlData, error: sqlError } = await oldSupabase
      .rpc('get_table_names')
      .select()
    
    if (sqlError) {
      console.log('❌ SQL error:', sqlError.message)
    } else {
      console.log('✅ SQL result:', sqlData)
    }

    console.log('\n📋 Method 3: Try to access with different auth...')
    
    // Try with different auth context
    const { data: authData, error: authError } = await oldSupabase.auth.getUser()
    console.log('Auth user:', authData?.user ? 'Logged in' : 'Not logged in')
    console.log('Auth error:', authError?.message || 'None')

    console.log('\n📋 Method 4: Try to list all tables with different approach...')
    
    // Try a different approach to list tables
    const { data: tables2, error: tables2Error } = await oldSupabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
    
    if (tables2Error) {
      console.log('❌ pg_tables error:', tables2Error.message)
    } else {
      console.log('✅ Tables found:', tables2?.map(t => t.tablename))
    }

    console.log('\n📋 Method 5: Try to access with admin privileges...')
    
    // Try to access as admin
    const { data: adminData, error: adminError } = await oldSupabase
      .from('User')
      .select('id, email')
      .limit(1)
    
    if (adminError) {
      console.log('❌ Admin access error:', adminError.message)
      console.log('Error code:', adminError.code)
      console.log('Error details:', adminError.details)
    } else {
      console.log('✅ Admin access successful:', adminData)
    }

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugTables() 