/**
 * Test script to verify the daily reset system components
 * Run this after setting up the missing tables
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testDailyResetSystem() {
  console.log('🧪 Testing Daily Reset System Components...\n')

  try {
    // 1. Test if required tables exist
    console.log('1️⃣ Checking required tables...')
    
    const tables = ['tasks', 'user_progress', 'daily_checkins', 'moods']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) throw error
        console.log(`✅ ${table} table exists and is accessible`)
      } catch (error) {
        console.error(`❌ ${table} table issue:`, error)
        return false
      }
    }

    // 2. Test user_progress table structure
    console.log('\n2️⃣ Checking user_progress table structure...')
    
    const { data: userProgressSample } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1)
    
    const requiredColumns = [
      'user_id', 
      'daily_start_time', 
      'current_mood', 
      'daily_mood_checks',
      'is_locked',
      'last_reset_date',
      'created_at',
      'updated_at'
    ]
    
    if (userProgressSample && userProgressSample.length > 0) {
      const sampleRecord = userProgressSample[0]
      const existingColumns = Object.keys(sampleRecord)
      
      for (const col of requiredColumns) {
        if (existingColumns.includes(col)) {
          console.log(`✅ Column '${col}' exists`)
        } else {
          console.warn(`⚠️ Column '${col}' missing (might cause issues)`)
        }
      }
    } else {
      console.log('ℹ️ No sample data in user_progress table')
    }

    // 3. Test daily_checkins table structure
    console.log('\n3️⃣ Testing daily_checkins table...')
    
    const testCheckin = {
      user_id: 'test_user_123',
      emotional_state: 'good',
      message: 'Test check-in',
      mike_response: '🌵 Test response'
    }
    
    const { data: checkinData, error: checkinError } = await supabase
      .from('daily_checkins')
      .insert(testCheckin)
      .select()
    
    if (checkinError) {
      console.error('❌ daily_checkins insert failed:', checkinError)
      return false
    } else {
      console.log('✅ daily_checkins table works correctly')
      
      // Clean up test data
      await supabase
        .from('daily_checkins')
        .delete()
        .eq('user_id', 'test_user_123')
    }

    // 4. Test endpoint availability
    console.log('\n4️⃣ Checking API endpoints...')
    
    const endpoints = [
      '/api/daily-reset',
      '/api/send-reset-email', 
      '/api/send-daily-email',
      '/api/cron/daily-emails'
    ]
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        // We expect 401 (unauthorized) or 405 (method not allowed) for most endpoints
        // This just confirms they exist and respond
        if (response.status === 401 || response.status === 405 || response.status === 200) {
          console.log(`✅ ${endpoint} endpoint exists`)
        } else {
          console.warn(`⚠️ ${endpoint} returned status ${response.status}`)
        }
      } catch (error) {
        console.warn(`⚠️ ${endpoint} not reachable (might be normal if server not running)`)
      }
    }

    console.log('\n🎉 Daily Reset System Test Complete!')
    console.log('\n📋 Next Steps:')
    console.log('1. Run the SQL script: scripts/create-missing-tables.sql in Supabase')
    console.log('2. Set up RESEND_API_KEY environment variable for emails')
    console.log('3. Test the daily reset flow with a real user')
    
    return true

  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDailyResetSystem()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('Test script error:', error)
      process.exit(1)
    })
}

export { testDailyResetSystem }