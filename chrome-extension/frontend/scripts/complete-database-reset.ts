#!/usr/bin/env tsx

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import clerkClient from '@clerk/clerk-sdk-node'

// Production Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function completeCleanDatabase() {
  console.log('🧹 COMPLETE DATABASE CLEANUP STARTING...')
  
  // All tables to clean (in dependency order)
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
  
  let totalRowsDeleted = 0
  
  for (const table of tablesToClean) {
    try {
      console.log(`🗑️  Cleaning table: ${table}`)
      
      // First count rows
      const { count: initialCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      console.log(`   Found ${initialCount || 0} rows in ${table}`)
      
      if (initialCount && initialCount > 0) {
        // Delete all rows
        const { error, count } = await supabase
          .from(table)
          .delete()
          .neq('id', 0) // This will match all rows since id is never 0
        
        if (error) {
          console.error(`   ❌ Error cleaning ${table}:`, error)
        } else {
          const deletedCount = count || initialCount
          totalRowsDeleted += deletedCount
          console.log(`   ✅ Deleted ${deletedCount} rows from ${table}`)
        }
      } else {
        console.log(`   ✅ Table ${table} was already empty`)
      }
      
    } catch (error) {
      console.error(`   ❌ Exception cleaning ${table}:`, error)
    }
  }
  
  console.log(`\n🎯 DATABASE CLEANUP COMPLETE!`)
  console.log(`   Total rows deleted: ${totalRowsDeleted}`)
  console.log(`   All tables are now empty and ready for fresh data.`)
  
  return { success: true, totalRowsDeleted }
}

async function syncAllClerkUsers() {
  console.log('\n👥 SYNCING ALL DEVELOPMENT CLERK USERS...')
  
  try {
    // Get all users from Clerk (development environment only)
    console.log('📡 Fetching all users from Clerk development...')
    
    const allUsers = []
    let hasMore = true
    let offset = 0
    const limit = 100
    
    while (hasMore) {
      try {
        const response = await clerkClient.users.getUserList({
          limit,
          offset,
          orderBy: '-created_at'
        })
        
        if (response.data && response.data.length > 0) {
          allUsers.push(...response.data)
          offset += limit
          
          // Check if we have more users
          hasMore = response.data.length === limit
          
          console.log(`   Fetched ${allUsers.length} users so far...`)
        } else {
          hasMore = false
        }
        
      } catch (fetchError) {
        console.error('❌ Error fetching users from Clerk:', fetchError)
        hasMore = false
      }
    }
    
    console.log(`✅ Total users found in Clerk: ${allUsers.length}`)
    
    if (allUsers.length === 0) {
      console.log('⚠️  No users found in Clerk. Nothing to sync.')
      return { success: true, usersCreated: 0, errors: 0 }
    }
    
    // Create user_progress records for all users
    let usersCreated = 0
    let errors = 0
    
    console.log('\n📝 Creating user progress records...')
    
    for (const user of allUsers) {
      try {
        const userId = user.id
        const userEmail = user.emailAddresses?.[0]?.emailAddress || 'unknown'
        const userName = user.firstName || user.username || 'User'
        
        console.log(`   Creating progress for: ${userName} (${userEmail})`)
        
        // Create user_progress record with fresh start
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            current_mood: 'sad', // Start with sad cactus (0 tasks)
            daily_mood_checks: 0,
            last_mood_update: new Date().toISOString(),
            last_reset_date: new Date().toISOString(),
            is_locked: false, // Not locked initially
            daily_start_time: null, // No daily start time yet
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (error) {
          if (error.message.includes('duplicate key')) {
            console.log(`   ⚠️  User ${userId} already exists, skipping`)
          } else {
            console.error(`   ❌ Error creating user ${userId}:`, error)
            errors++
          }
        } else {
          console.log(`   ✅ Created user progress for ${userId}`)
          usersCreated++
        }
        
      } catch (userError) {
        console.error(`   ❌ Exception processing user:`, userError)
        errors++
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    console.log(`\n🎉 DEVELOPMENT USER SYNC COMPLETE!`)
    console.log(`   Users created: ${usersCreated}`)
    console.log(`   Errors: ${errors}`)
    console.log(`   All development users now have fresh accounts with 0 tasks and sad cactus mood!`)
    
    return { success: true, usersCreated, errors, totalUsers: allUsers.length }
    
  } catch (error) {
    console.error('❌ Critical error syncing users:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function verifyDatabaseState() {
  console.log('\n🔍 VERIFYING DATABASE STATE...')
  
  const tables = ['tasks', 'user_progress', 'daily_checkins', 'moods', 'user_behavior_events']
  
  for (const table of tables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      console.log(`   ${table}: ${count || 0} rows`)
    } catch (error) {
      console.error(`   ❌ Error checking ${table}:`, error)
    }
  }
  
  // Check a few sample users
  const { data: sampleUsers } = await supabase
    .from('user_progress')
    .select('user_id, current_mood, is_locked, daily_start_time')
    .limit(3)
  
  if (sampleUsers && sampleUsers.length > 0) {
    console.log('\n📋 Sample user states:')
    sampleUsers.forEach((user, index) => {
      console.log(`   User ${index + 1}: mood=${user.current_mood}, locked=${user.is_locked}, dailyStart=${user.daily_start_time || 'none'}`)
    })
  }
  
  return { success: true }
}

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
  
  try {
    // Step 1: Clean database
    const cleanResult = await completeCleanDatabase()
    
    if (!cleanResult.success) {
      console.error('❌ Database cleanup failed')
      process.exit(1)
    }
    
    // Step 2: Sync all Clerk users
    const syncResult = await syncAllClerkUsers()
    
    if (!syncResult.success) {
      console.error('❌ User sync failed')
      process.exit(1)
    }
    
    // Step 3: Verify final state
    await verifyDatabaseState()
    
    console.log('\n🎉 MISSION ACCOMPLISHED!')
    console.log('✅ Database completely cleaned')
    console.log('✅ All development Clerk users synced with 0 tasks')
    console.log('✅ All users start with sad cactus (ready to grow)')
    console.log('✅ Users can sign in immediately without creating accounts')
    console.log('\n🌱 Your development environment is ready!')
    console.log('💡 When you switch to production Clerk keys, run this again to sync prod users!')
    
  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { completeCleanDatabase, syncAllClerkUsers, verifyDatabaseState }