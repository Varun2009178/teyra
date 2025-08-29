#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Use Clerk REST API directly
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;

async function cleanupOrphanedUsers() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  console.log('🧹 CLEANUP ORPHANED DATABASE USERS');
  console.log('==================================\n');
  console.log('This script will remove database records for users that no longer exist in Clerk.\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('💡 Add --execute flag to actually perform cleanup\n');
  } else {
    console.log('⚠️  EXECUTE MODE - Changes will be made to database\n');
  }

  // Step 1: Get all users from database
  console.log('📊 Fetching users from database...');
  const { data: dbUsers, error: dbError } = await supabase
    .from('user_progress')
    .select('user_id, created_at')
    .order('created_at', { ascending: true });

  if (dbError) {
    console.error('❌ Error fetching database users:', dbError);
    return;
  }

  console.log(`📋 Found ${dbUsers?.length} users in database`);

  // Step 2: Get all users from Clerk using REST API
  console.log('🔍 Fetching users from Clerk...');
  try {
    const response = await fetch('https://api.clerk.com/v1/users?limit=500', {
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
    }

    const clerkUsers = await response.json();
    
    console.log(`📋 Found ${clerkUsers.length} users in Clerk`);
    
    // Create a Set of Clerk user IDs for fast lookup
    const clerkUserIds = new Set(clerkUsers.map((user: any) => user.id));
    
    // Step 3: Find orphaned users (in database but not in Clerk)
    const orphanedUsers = dbUsers?.filter(dbUser => !clerkUserIds.has(dbUser.user_id)) || [];
    
    console.log(`\n🔍 Analysis:`);
    console.log(`  📊 Database users: ${dbUsers?.length}`);
    console.log(`  📊 Clerk users: ${clerkUsers.length}`);
    console.log(`  ❌ Orphaned users: ${orphanedUsers.length}`);
    
    if (orphanedUsers.length === 0) {
      console.log('\n✅ No orphaned users found! Database is in sync with Clerk.');
      return;
    }
    
    console.log(`\n🗑️  Orphaned users to delete:`);
    
    let totalTasks = 0;
    let totalBehaviorRecords = 0;
    
    for (const user of orphanedUsers) {
      // Count associated data
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.user_id);
      
      const { count: behaviorCount } = await supabase
        .from('user_behavior_analysis')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.user_id);
      
      const { count: eventsCount } = await supabase
        .from('user_behavior_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.user_id);
      
      totalTasks += taskCount || 0;
      totalBehaviorRecords += (behaviorCount || 0) + (eventsCount || 0);
      
      const daysSinceCreation = Math.round((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`  👤 ${user.user_id.slice(-8)}: ${taskCount} tasks, ${behaviorCount} behavior records, ${eventsCount} events (${daysSinceCreation} days old)`);
    }
    
    console.log(`\n📊 Total data to clean up:`);
    console.log(`  👥 Orphaned users: ${orphanedUsers.length}`);
    console.log(`  📝 Tasks: ${totalTasks}`);
    console.log(`  🧠 Behavior records: ${totalBehaviorRecords}`);
    
    if (!dryRun) {
      console.log('\n🔄 Starting cleanup of orphaned users...');
      
      let deletedUsers = 0;
      let deletedTasks = 0;
      let errors = 0;
      
      for (const user of orphanedUsers) {
        console.log(`\n🗑️  Cleaning up orphaned user ${user.user_id.slice(-8)}...`);
        
        try {
          // Delete in order: dependent tables first, then user_progress
          
          // 1. Delete tasks
          const { error: tasksError } = await supabase
            .from('tasks')
            .delete()
            .eq('user_id', user.user_id);
          
          if (tasksError) {
            console.error(`  ❌ Error deleting tasks:`, tasksError);
            errors++;
          } else {
            console.log(`  ✅ Deleted tasks`);
          }

          // 2. Delete behavior analysis
          const { error: behaviorError } = await supabase
            .from('user_behavior_analysis')
            .delete()
            .eq('user_id', user.user_id);
          
          if (behaviorError && !behaviorError.message.includes('does not exist')) {
            console.error(`  ❌ Error deleting behavior analysis:`, behaviorError);
          }

          // 3. Delete behavior events
          const { error: eventsError } = await supabase
            .from('user_behavior_events')
            .delete()
            .eq('user_id', user.user_id);
          
          if (eventsError && !eventsError.message.includes('does not exist')) {
            console.error(`  ❌ Error deleting behavior events:`, eventsError);
          }

          // 4. Delete daily checkins
          const { error: checkinsError } = await supabase
            .from('daily_checkins')
            .delete()
            .eq('user_id', user.user_id);
          
          if (checkinsError && !checkinsError.message.includes('does not exist')) {
            console.error(`  ❌ Error deleting daily checkins:`, checkinsError);
          }

          // 5. Finally, delete user progress
          const { error: userError } = await supabase
            .from('user_progress')
            .delete()
            .eq('user_id', user.user_id);
          
          if (userError) {
            console.error(`  ❌ Error deleting user progress:`, userError);
            errors++;
          } else {
            deletedUsers++;
            console.log(`  ✅ Deleted user progress`);
          }
          
        } catch (error) {
          console.error(`  ❌ Unexpected error:`, error);
          errors++;
        }
        
        // Small delay to avoid overwhelming database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`\n🎉 Cleanup Complete!`);
      console.log(`  ✅ Successfully deleted: ${deletedUsers} users`);
      console.log(`  ❌ Errors encountered: ${errors}`);
      
      // Verify final counts
      const { count: finalDbCount } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true });
      
      console.log(`\n📊 Final database user count: ${finalDbCount}`);
      console.log(`📊 Clerk user count: ${clerkUsers.length}`);
      
      if (finalDbCount === clerkUsers.length) {
        console.log('✅ Database is now perfectly synced with Clerk!');
      } else {
        console.log('⚠️  Some discrepancy remains - may need manual review');
      }
      
    } else {
      console.log('\n💡 To execute the cleanup, run:');
      console.log('npm run cleanup-orphaned -- --execute');
      console.log('\n🔒 This is SAFE because it only deletes users that no longer exist in Clerk');
    }
    
  } catch (error) {
    console.error('❌ Error fetching Clerk users:', error);
    console.log('\n💡 Make sure your Clerk secret key is correct in .env.local');
  }
}

cleanupOrphanedUsers()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });