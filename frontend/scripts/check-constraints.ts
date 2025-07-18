import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkConstraints() {
  console.log('🔍 Checking database constraints...')
  
  try {
    // Try to insert a duplicate to see what the constraint error is
    const testData = {
      userId: 'user_302F1cMS0ttEkjpuPmMl96da44s', // Same as existing
      all_time_completed: 0,
      current_streak: 0,
      completed_this_week: 0,
      completed_today: 0,
      last_completed_date: null,
      subscription_level: 'free',
      ai_suggestions_enabled: true,
      user_mood: 'neutral',
      show_analytics: true,
      notifications_enabled: true,
      mood_checkins_today: 0,
      ai_splits_today: 0,
      last_daily_reset: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      timezone: 'UTC'
    }
    
    console.log('🧪 Testing duplicate insert...')
    const { error: insertError } = await supabase
      .from('user_stats')
      .insert([testData])
    
    if (insertError) {
      console.log('❌ Expected error (duplicate key):', insertError)
    } else {
      console.log('⚠️ Unexpected success - no constraint violation')
    }
    
    // Check what the primary key is by looking at the schema
    console.log('\n📋 Checking table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'user_stats' })
    
    if (tableError) {
      console.log('⚠️ Could not get table info via RPC, trying direct query...')
      
      // Try to get all columns
      const { data: allStats, error: allError } = await supabase
        .from('user_stats')
        .select('*')
        .limit(1)
      
      if (allError) {
        console.error('❌ Error getting sample data:', allError)
      } else if (allStats && allStats.length > 0) {
        console.log('📊 Sample record columns:', Object.keys(allStats[0]))
      }
    } else {
      console.log('📋 Table info:', tableInfo)
    }
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error)
  }
}

checkConstraints() 