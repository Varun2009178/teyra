import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking database schema...')
  
  try {
    // Check user_stats table structure
    const { data: userStatsColumns, error: userStatsError } = await supabase
      .from('user_stats')
      .select('*')
      .limit(0)
    
    if (userStatsError) {
      console.error('❌ Error checking user_stats table:', userStatsError)
    } else {
      console.log('✅ user_stats table exists')
    }
    
    // Check tasks table structure
    const { data: tasksColumns, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(0)
    
    if (tasksError) {
      console.error('❌ Error checking tasks table:', tasksError)
    } else {
      console.log('✅ tasks table exists')
    }
    
    // Try to get actual column names by querying information_schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'user_stats' })
    
    if (columnsError) {
      console.log('⚠️ Could not get column info via RPC, trying direct query...')
      
      // Try a simple insert to see what columns exist
      const { error: insertError } = await supabase
        .from('user_stats')
        .insert([{
          userId: 'test',
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
        }])
      
      if (insertError) {
        console.error('❌ Insert error (this shows us what columns are missing):', insertError)
      } else {
        console.log('✅ Insert successful - columns exist')
        // Clean up test data
        await supabase.from('user_stats').delete().eq('userId', 'test')
      }
    } else {
      console.log('📋 user_stats columns:', columns)
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error)
  }
}

checkSchema() 