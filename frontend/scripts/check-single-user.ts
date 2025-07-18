import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSingleUser() {
  console.log('🔍 Checking the single user_stats record...')
  
  try {
    const { data: allStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
    
    if (statsError) {
      console.error('❌ Error fetching user_stats:', statsError)
      return
    }
    
    console.log(`📊 Found ${allStats?.length || 0} user_stats records`)
    
    if (allStats && allStats.length > 0) {
      allStats.forEach((stat, index) => {
        console.log(`Record ${index + 1}:`, {
          userId: stat.userId,
          email: stat.email,
          allTimeCompleted: stat.all_time_completed,
          subscriptionLevel: stat.subscription_level,
          created_at: stat.created_at,
          updated_at: stat.updated_at
        })
      })
    }
    
  } catch (error) {
    console.error('❌ Error checking single user:', error)
  }
}

checkSingleUser() 