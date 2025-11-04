#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import clerkClient from '@clerk/clerk-sdk-node'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function main() {
  console.log('🔄 SYNC NEW DEVELOPMENT USERS')
  console.log('=' .repeat(40))
  console.log('⚠️  This syncs any NEW dev users created in Clerk but missing from Supabase')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('\n🔍 Step 1: Getting current users from both systems...')
  
  // Get existing users from Supabase
  const { data: supabaseUsers } = await supabase
    .from('user_progress')
    .select('user_id')
  
  const existingUserIds = new Set(supabaseUsers?.map(u => u.user_id) || [])
  console.log(`📊 Supabase has: ${existingUserIds.size} users`)

  // Get all users from Clerk (development)
  const clerkUsers = await clerkClient.users.getUserList({ limit: 500 })
  console.log(`📊 Development Clerk has: ${clerkUsers.length} users`)

  // Find new users that exist in Clerk but not in Supabase
  const newUsers = clerkUsers.filter(user => !existingUserIds.has(user.id))
  
  console.log(`🆕 Found ${newUsers.length} new users to add to Supabase`)
  
  if (newUsers.length === 0) {
    console.log('✅ All Clerk users already exist in Supabase!')
    return
  }

  console.log('\n👤 Step 2: Adding new users to Supabase...')
  
  let created = 0
  let errors = 0
  
  for (const user of newUsers) {
    try {
      const email = user.emailAddresses?.[0]?.emailAddress || 'unknown'
      const name = user.firstName || user.username || 'User'
      const createdAt = user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
      
      console.log(`   Adding: ${name} (${email}) - Created: ${createdAt}`)
      
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          current_mood: 'sad', // Start sad (0 tasks)
          daily_mood_checks: 0,
          last_mood_update: createdAt,
          last_reset_date: createdAt,
          is_locked: false,
          daily_start_time: null,
          created_at: createdAt, // Use actual Clerk creation time
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
        console.log(`   ✅ Added successfully`)
        created++
      }
      
    } catch (userError) {
      console.error(`   ❌ Exception: ${userError}`)
      errors++
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\n🎉 SYNC COMPLETE!`)
  console.log(`   New users added: ${created}`)
  console.log(`   Errors: ${errors}`)
  
  // Final verification
  const { count: finalCount } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
  
  console.log(`   Total users in Supabase: ${finalCount || 0}`)
  
  if (created > 0) {
    console.log('\n✅ New users can now sign in and will get full onboarding experience!')
  }
}

main().catch(console.error)