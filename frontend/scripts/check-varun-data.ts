import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVarunData() {
  console.log('🔍 Checking for any remaining Varun data...')
  
  try {
    // Check user_stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('email', 'varun.k.nukala@gmail.com')
    
    if (statsError) {
      console.error('❌ Error checking user_stats:', statsError)
    } else {
      console.log(`📊 Found ${userStats?.length || 0} user_stats records for varun.k.nukala@gmail.com`)
      if (userStats && userStats.length > 0) {
        userStats.forEach((stat, index) => {
          console.log(`  Record ${index + 1}:`, {
            userId: stat.userId,
            email: stat.email,
            allTimeCompleted: stat.all_time_completed,
            created_at: stat.created_at
          })
        })
      }
    }
    
    // Check tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('userId', 'bb2349a0-da36-4c39-9169-b4ea3158b550PISH8xT')
    
    if (tasksError) {
      console.error('❌ Error checking tasks for first account:', tasksError)
    } else {
      console.log(`📋 Found ${tasks?.length || 0} tasks for first account`)
    }
    
    const { data: tasks2, error: tasksError2 } = await supabase
      .from('tasks')
      .select('*')
      .eq('userId', 'bc37ca87-2a74-443f-bdb3-5b3f9bb0bbacoPISH8xT')
    
    if (tasksError2) {
      console.error('❌ Error checking tasks for second account:', tasksError2)
    } else {
      console.log(`📋 Found ${tasks2?.length || 0} tasks for second account`)
    }
    
    // Check all user_stats to see if there are duplicates
    const { data: allStats, error: allStatsError } = await supabase
      .from('user_stats')
      .select('*')
    
    if (allStatsError) {
      console.error('❌ Error checking all user_stats:', allStatsError)
    } else {
      console.log(`📊 Total user_stats records: ${allStats?.length || 0}`)
      
      // Group by email
      const emailGroups: { [email: string]: any[] } = {}
      allStats?.forEach(stat => {
        const email = stat.email || 'no-email'
        if (!emailGroups[email]) {
          emailGroups[email] = []
        }
        emailGroups[email].push(stat)
      })
      
      // Show duplicates
      Object.entries(emailGroups).forEach(([email, users]) => {
        if (users.length > 1) {
          console.log(`⚠️ Duplicate found for ${email}: ${users.length} records`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Error checking Varun data:', error)
  }
}

checkVarunData() 