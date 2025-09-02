#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import clerkClient from '@clerk/clerk-sdk-node'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function main() {
  console.log('👥 ADD DEVELOPMENT USERS TO PRODUCTION DATABASE')
  console.log('=' .repeat(55))
  console.log('⚠️  This will NOT clear existing data - only add missing dev users')
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL')
    console.error('   SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('❌ Missing CLERK_SECRET_KEY environment variable')
    process.exit(1)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('\n🔍 STEP 1: CHECKING EXISTING USERS...')
  
  // Get existing users from database
  const { data: existingUsers, error: existingError } = await supabase
    .from('user_progress')
    .select('user_id')
  
  if (existingError) {
    console.error('❌ Error fetching existing users:', existingError.message)
    process.exit(1)
  }
  
  const existingUserIds = new Set(existingUsers?.map(u => u.user_id) || [])
  console.log(`✅ Found ${existingUserIds.size} existing users in database`)
  
  console.log('\n📡 STEP 2: FETCHING DEVELOPMENT USERS FROM CLERK...')
  
  try {
    // Get all users from Clerk (development users)
    const users = await clerkClient.users.getUserList({ limit: 500 })
    
    console.log(`📡 Found ${users.length} total users in Clerk`)
    
    if (users.length === 0) {
      console.log('⚠️  No users to sync from Clerk')
      return
    }
    
    // Filter out users that already exist
    const newUsers = users.filter(user => !existingUserIds.has(user.id))
    
    console.log(`🆕 Found ${newUsers.length} NEW users to add`)
    console.log(`✅ ${users.length - newUsers.length} users already exist (skipping)`)
    
    if (newUsers.length === 0) {
      console.log('\n🎉 All Clerk users are already in the database!')
      console.log('✅ No new users to add.')
      return
    }
    
    console.log('\n👤 STEP 3: ADDING NEW DEVELOPMENT USERS...')
    
    let created = 0
    let errors = 0
    
    for (const user of newUsers) {
      try {
        const email = user.emailAddresses?.[0]?.emailAddress || 'unknown'
        const name = user.firstName || user.username || 'User'
        
        console.log(`   Adding: ${name} (${email})`)
        
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            current_mood: 'sad', // Start sad (0 tasks)
            daily_mood_checks: 0,
            last_mood_update: new Date().toISOString(),
            last_reset_date: new Date().toISOString(),
            is_locked: false,
            daily_start_time: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (error) {
          if (error.message.includes('duplicate')) {
            console.log(`   ⚠️  Already exists (race condition)`)
          } else {
            console.error(`   ❌ Error: ${error.message}`)
            errors++
          }
        } else {
          console.log(`   ✅ Added successfully`)
          created++
        }
        
      } catch (userError) {
        console.error(`   ❌ Exception: ${userError}`)
        errors++
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`\n🎉 DEV USER SYNC COMPLETE!`)
    console.log(`   New users added: ${created}`)
    console.log(`   Errors: ${errors}`)
    console.log(`   Already existed: ${users.length - newUsers.length}`)
    
    // Final verification
    console.log('\n🔍 STEP 4: FINAL VERIFICATION...')
    
    const { count: finalUserCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
    
    const { count: finalTaskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
    
    console.log(`✅ Final database state:`)
    console.log(`   Total users: ${finalUserCount || 0}`)
    console.log(`   Total tasks: ${finalTaskCount || 0}`)
    
    // Show some sample new users
    if (created > 0) {
      const { data: recentUsers } = await supabase
        .from('user_progress')
        .select('user_id, current_mood, is_locked, created_at')
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (recentUsers && recentUsers.length > 0) {
        console.log(`\n📋 Recently added users:`)
        recentUsers.forEach((user, i) => {
          const createdTime = new Date(user.created_at).toLocaleString()
          console.log(`   ${i+1}. ${user.user_id.slice(0,8)}... mood: ${user.current_mood}, locked: ${user.is_locked} (${createdTime})`)
        })
      }
    }
    
    console.log('\n🌱 SUCCESS! Development users added without affecting existing data.')
    console.log('✅ All new users start with sad cactus (0 tasks) and can sign in immediately')
    console.log('✅ Existing production users and their data remain untouched')
    
  } catch (clerkError) {
    console.error('❌ Error with Clerk:', clerkError)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)