import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaixpzbbqocssdznztev.supabase.co'
const supabaseKey = process.env.NEW_SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function quickDebug() {
  console.log('🔍 Quick Debug - Checking Critical Systems...\n')

  try {
    // 1. Test database connection
    console.log('1️⃣ Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('user_stats')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('❌ Database connection failed:', testError.message)
      return
    }
    console.log('✅ Database connection successful')

    // 2. Check user stats table
    console.log('\n2️⃣ Checking user stats table...')
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id, email, created_at')
      .limit(5)
    
    if (statsError) {
      console.log('❌ User stats query failed:', statsError.message)
    } else {
      console.log(`✅ Found ${userStats?.length || 0} users in user_stats`)
      if (userStats && userStats.length > 0) {
        console.log('   Sample user:', {
          id: userStats[0].user_id?.substring(0, 10) + '...',
          email: userStats[0].email,
          created: userStats[0].created_at
        })
      }
    }

    // 3. Check tasks table
    console.log('\n3️⃣ Checking tasks table...')
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, user_id, text, completed')
      .limit(5)
    
    if (tasksError) {
      console.log('❌ Tasks query failed:', tasksError.message)
    } else {
      console.log(`✅ Found ${tasks?.length || 0} tasks`)
      if (tasks && tasks.length > 0) {
        console.log('   Sample task:', {
          id: tasks[0].id?.substring(0, 10) + '...',
          userId: tasks[0].user_id?.substring(0, 10) + '...',
          text: tasks[0].text?.substring(0, 30) + '...',
          completed: tasks[0].completed
        })
      }
    }

    // 4. Check environment variables
    console.log('\n4️⃣ Checking environment variables...')
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEW_SUPABASE_SERVICE_KEY',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'
    ]
    
    let missingVars = 0
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        console.log(`❌ Missing: ${varName}`)
        missingVars++
      } else {
        console.log(`✅ Found: ${varName}`)
      }
    })
    
    if (missingVars > 0) {
      console.log(`\n⚠️  ${missingVars} environment variables missing!`)
    } else {
      console.log('\n✅ All environment variables present')
    }

    // 5. Check for recent errors
    console.log('\n5️⃣ Checking for recent activity...')
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: recentUsers, error: recentError } = await supabase
      .from('user_stats')
      .select('user_id, email, last_activity_at')
      .gte('last_activity_at', oneHourAgo)
      .limit(5)
    
    if (recentError) {
      console.log('❌ Recent activity query failed:', recentError.message)
    } else {
      console.log(`✅ ${recentUsers?.length || 0} users active in last hour`)
    }

    console.log('\n🎉 Quick debug completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Test new user signup in browser')
    console.log('2. Check console for any errors')
    console.log('3. Verify data persistence')
    console.log('4. Test daily reset logic')

  } catch (error) {
    console.error('❌ Quick debug failed:', error)
  }
}

quickDebug() 