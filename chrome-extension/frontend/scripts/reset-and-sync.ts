#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import clerkClient from '@clerk/clerk-sdk-node'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function main() {
  console.log('🚀 COMPLETE DATABASE RESET AND USER SYNC')
  console.log('=' .repeat(50))
  
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

  console.log('🧹 STEP 1: CLEANING ALL DATABASE TABLES...')
  
  // Clean all tables in dependency order
  const tablesToClean = [
    'notification_logs',
    'user_behavior',
    'user_ai_patterns', 
    'moods',
    'daily_checkins',
    'user_behavior_analysis',
    'user_behavior_events',
    'tasks',
    'user_progress'
  ]
  
  let totalDeleted = 0
  
  for (const table of tablesToClean) {
    try {
      console.log(`🗑️  Cleaning ${table}...`)
      
      const { count: beforeCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (beforeCount && beforeCount > 0) {
        const { error, count } = await supabase
          .from(table)
          .delete()
          .neq('id', 0)
        
        if (error) {
          console.error(`   ❌ Error: ${error.message}`)
        } else {
          const deletedCount = count || beforeCount
          totalDeleted += deletedCount
          console.log(`   ✅ Deleted ${deletedCount} rows`)
        }
      } else {
        console.log(`   ✅ Already empty`)
      }
    } catch (error) {
      console.error(`   ❌ Exception: ${error}`)
    }
  }
  
  console.log(`\n📊 Total rows deleted: ${totalDeleted}`)
  
  console.log('\n👥 STEP 2: SYNCING ALL DEVELOPMENT USERS...')
  
  try {
    // Get all users from Clerk
    const users = await clerkClient.users.getUserList({ limit: 500 })
    
    console.log(`📡 Found ${users.length} users in Clerk`)
    
    if (users.length === 0) {
      console.log('⚠️  No users to sync')
      return
    }
    
    let created = 0
    let errors = 0
    
    for (const user of users) {
      try {
        const email = user.emailAddresses?.[0]?.emailAddress || 'unknown'
        const name = user.firstName || user.username || 'User'
        
        console.log(`   Creating: ${name} (${email})`)
        
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
            console.log(`   ⚠️  Already exists`)
          } else {
            console.error(`   ❌ Error: ${error.message}`)
            errors++
          }
        } else {
          console.log(`   ✅ Created`)
          created++
        }
        
      } catch (userError) {
        console.error(`   ❌ Exception: ${userError}`)
        errors++
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`\n🎉 USER SYNC COMPLETE!`)
    console.log(`   Created: ${created}`)
    console.log(`   Errors: ${errors}`)
    console.log(`   Total users: ${users.length}`)
    
    // Final verification
    console.log('\n🔍 STEP 3: VERIFICATION...')
    
    const { count: finalUserCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
    
    const { count: finalTaskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
    
    console.log(`✅ Final state:`)
    console.log(`   Users: ${finalUserCount || 0}`)
    console.log(`   Tasks: ${finalTaskCount || 0}`)
    
    // Check sample users
    const { data: sampleUsers } = await supabase
      .from('user_progress')
      .select('user_id, current_mood, is_locked')
      .limit(3)
    
    if (sampleUsers && sampleUsers.length > 0) {
      console.log(`\n📋 Sample users:`)
      sampleUsers.forEach((user, i) => {
        console.log(`   ${i+1}. mood: ${user.current_mood}, locked: ${user.is_locked}`)
      })
    }
    
    console.log('\n🌱 SUCCESS! Database reset complete.')
    console.log('✅ All users have 0 tasks and sad cactus (ready to grow)')
    console.log('✅ Users can sign in immediately without creating accounts')
    
  } catch (clerkError) {
    console.error('❌ Error with Clerk:', clerkError)
    process.exit(1)
  }
}

// Run if this is the main module
main().catch(console.error)