#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import clerkClient from '@clerk/clerk-sdk-node'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function main() {
  console.log('🗑️  SYNC DELETED USERS - Remove orphaned data')
  console.log('=' .repeat(45))
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🔍 Step 1: Getting all users from Supabase...')
  const { data: supabaseUsers } = await supabase
    .from('user_progress')
    .select('user_id')
  
  console.log(`📊 Found ${supabaseUsers?.length || 0} users in Supabase`)

  console.log('\n🔍 Step 2: Getting all users from Clerk...')
  const clerkUsers = await clerkClient.users.getUserList({ limit: 500 })
  const clerkUserIds = new Set(clerkUsers.map(u => u.id))
  
  console.log(`📊 Found ${clerkUsers.length} users in Clerk`)

  console.log('\n🔍 Step 3: Finding orphaned users (in Supabase but not Clerk)...')
  const orphanedUsers = supabaseUsers?.filter(u => !clerkUserIds.has(u.user_id)) || []
  
  console.log(`🗑️  Found ${orphanedUsers.length} orphaned users to clean up`)

  if (orphanedUsers.length === 0) {
    console.log('✅ No cleanup needed - all users are in sync!')
    return
  }

  console.log('\n🗑️  Step 4: Cleaning up orphaned user data...')
  
  const tablesToClean = [
    'tasks', 
    'user_progress', 
    'user_behavior_events', 
    'user_behavior_analysis',
    'daily_checkins',
    'moods',
    'user_ai_patterns',
    'user_behavior',
    'notification_logs'
  ]

  let totalDeleted = 0

  for (const orphanedUser of orphanedUsers) {
    const userId = orphanedUser.user_id
    console.log(`\n🗑️  Cleaning data for user: ${userId.slice(0,8)}...`)
    
    for (const table of tablesToClean) {
      try {
        const { error, count } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId)
        
        if (error) {
          console.error(`   ❌ Error cleaning ${table}: ${error.message}`)
        } else if (count && count > 0) {
          console.log(`   ✅ Deleted ${count} rows from ${table}`)
          totalDeleted += count
        }
      } catch (err) {
        console.error(`   ❌ Exception cleaning ${table}:`, err)
      }
    }
  }

  console.log(`\n🎉 CLEANUP COMPLETE!`)
  console.log(`   Orphaned users removed: ${orphanedUsers.length}`)
  console.log(`   Total rows deleted: ${totalDeleted}`)
  
  // Verify final state
  const { count: finalCount } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
  
  console.log(`   Users remaining in database: ${finalCount || 0}`)
  console.log('\n✅ Database is now in sync with Clerk!')
}

main().catch(console.error)