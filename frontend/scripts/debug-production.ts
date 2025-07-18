import { createClient } from '@supabase/supabase-js'

// This script will help debug production vs local differences
async function debugProduction() {
  console.log('🔍 Production Debug - Checking Environment Differences...\n')

  // 1. Check environment variables
  console.log('1️⃣ Environment Variables Check:')
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'NEW_SUPABASE_SERVICE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_APP_URL',
    'CRON_SECRET',
    'RESEND_API_KEY'
  ]

  envVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      // Show first 10 chars for security
      const preview = value.substring(0, 10) + '...'
      console.log(`✅ ${varName}: ${preview}`)
    } else {
      console.log(`❌ ${varName}: MISSING`)
    }
  })

  // 2. Test Supabase connection
  console.log('\n2️⃣ Supabase Connection Test:')
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEW_SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase credentials')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic query
    const { data, error } = await supabase
      .from('user_stats')
      .select('count')
      .limit(1)

    if (error) {
      console.log('❌ Supabase connection failed:', error.message)
    } else {
      console.log('✅ Supabase connection successful')
    }
  } catch (error) {
    console.log('❌ Supabase test failed:', error)
  }

  // 3. Check for common production issues
  console.log('\n3️⃣ Common Production Issues:')
  
  // Check if we're in production
  const isProduction = process.env.NODE_ENV === 'production'
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  
  // Check app URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    console.log(`App URL: ${appUrl}`)
    if (appUrl.includes('localhost')) {
      console.log('⚠️  App URL points to localhost - this might cause issues in production')
    }
  } else {
    console.log('❌ NEXT_PUBLIC_APP_URL not set')
  }

  // 4. Database schema check
  console.log('\n4️⃣ Database Schema Check:')
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEW_SUPABASE_SERVICE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Check if user_stats table has all required columns
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .limit(1)

      if (statsError) {
        console.log('❌ user_stats table error:', statsError.message)
      } else {
        console.log('✅ user_stats table accessible')
        
        // Check for required columns
        const requiredColumns = [
          'user_id', 'all_time_completed', 'last_daily_reset', 
          'last_activity_at', 'mood_checkins_today', 'ai_splits_today'
        ]
        
        if (userStats && userStats.length > 0) {
          const sampleUser = userStats[0]
          requiredColumns.forEach(col => {
            if (col in sampleUser) {
              console.log(`✅ Column ${col} exists`)
            } else {
              console.log(`❌ Column ${col} missing`)
            }
          })
        }
      }

      // Check tasks table
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .limit(1)

      if (tasksError) {
        console.log('❌ tasks table error:', tasksError.message)
      } else {
        console.log('✅ tasks table accessible')
      }
    }
  } catch (error) {
    console.log('❌ Database schema check failed:', error)
  }

  console.log('\n🎯 Production Debug Summary:')
  console.log('If you see errors above, they need to be fixed in Vercel environment variables.')
  console.log('\n📋 Next Steps:')
  console.log('1. Go to Vercel dashboard')
  console.log('2. Check Environment Variables section')
  console.log('3. Compare with your local .env.local file')
  console.log('4. Make sure all variables are set correctly')
}

debugProduction() 