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

async function cleanupTestAccounts() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  console.log('🧹 CLEANUP TEST ACCOUNTS');
  console.log('=========================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('💡 Add --execute flag to actually perform cleanup\n');
  } else {
    console.log('⚠️  EXECUTE MODE - Changes will be made to database\n');
  }

  // Get all users
  const { data: allUsers, error: usersError } = await supabase
    .from('user_progress')
    .select('user_id, created_at, current_mood, daily_mood_checks, is_locked')
    .order('created_at', { ascending: true });

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  console.log(`📊 Total users in database: ${allUsers?.length}`);

  // Identify test accounts (created in last 7 days with minimal activity)
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  
  const testAccounts = [];
  
  for (const user of allUsers || []) {
    const createdAt = new Date(user.created_at).getTime();
    const isRecent = createdAt > sevenDaysAgo;
    
    if (isRecent) {
      // Get task count for this user
      const { data: userTasks } = await supabase
        .from('tasks')
        .select('id, title, completed')
        .eq('user_id', user.user_id);
      
      const taskCount = userTasks?.length || 0;
      const completedTasks = userTasks?.filter(t => t.completed).length || 0;
      
      // Consider it a test account if:
      // - Created recently AND
      // - Has very few tasks (0-2) OR no completed tasks
      const isTestAccount = taskCount <= 2 || completedTasks === 0;
      
      if (isTestAccount) {
        testAccounts.push({
          ...user,
          taskCount,
          completedTasks,
          daysSinceCreation: (now - createdAt) / (1000 * 60 * 60 * 24)
        });
      }
    }
  }

  console.log(`🧪 Identified ${testAccounts.length} test accounts:`);
  testAccounts.forEach(account => {
    console.log(`  👤 ${account.user_id.slice(-8)}: ${account.taskCount} tasks (${account.completedTasks} completed), ${Math.round(account.daysSinceCreation)} days old`);
  });

  if (testAccounts.length === 0) {
    console.log('✅ No test accounts found to clean up');
    return;
  }

  // Show what will be cleaned
  console.log(`\n🗑️  Will clean up data for ${testAccounts.length} test accounts:`);
  
  let totalTasksToDelete = 0;
  let totalBehaviorRecordsToDelete = 0;
  
  for (const account of testAccounts) {
    // Count tasks
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', account.user_id);
    
    // Count behavior records
    const { count: behaviorCount } = await supabase
      .from('user_behavior_analysis')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', account.user_id);
    
    const { count: behaviorEventsCount } = await supabase
      .from('user_behavior_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', account.user_id);
    
    totalTasksToDelete += taskCount || 0;
    totalBehaviorRecordsToDelete += (behaviorCount || 0) + (behaviorEventsCount || 0);
    
    console.log(`  🗑️  ${account.user_id.slice(-8)}: ${taskCount} tasks, ${behaviorCount} behavior records, ${behaviorEventsCount} events`);
  }

  console.log(`\n📊 Total to delete:`);
  console.log(`  👥 Users: ${testAccounts.length}`);
  console.log(`  📝 Tasks: ${totalTasksToDelete}`);
  console.log(`  🧠 Behavior records: ${totalBehaviorRecordsToDelete}`);

  if (!dryRun) {
    console.log('\n🔄 Starting cleanup...');
    
    let deletedUsers = 0;
    let deletedTasks = 0;
    let deletedBehaviorRecords = 0;
    
    for (const account of testAccounts) {
      console.log(`\n🗑️  Cleaning up ${account.user_id.slice(-8)}...`);
      
      try {
        // Delete tasks
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .eq('user_id', account.user_id);
        
        if (tasksError) {
          console.error(`❌ Error deleting tasks:`, tasksError);
        } else {
          deletedTasks += account.taskCount;
          console.log(`  ✅ Deleted ${account.taskCount} tasks`);
        }

        // Delete behavior analysis
        const { error: behaviorError } = await supabase
          .from('user_behavior_analysis')
          .delete()
          .eq('user_id', account.user_id);
        
        if (behaviorError && !behaviorError.message.includes('does not exist')) {
          console.error(`❌ Error deleting behavior analysis:`, behaviorError);
        }

        // Delete behavior events
        const { error: eventsError } = await supabase
          .from('user_behavior_events')
          .delete()
          .eq('user_id', account.user_id);
        
        if (eventsError && !eventsError.message.includes('does not exist')) {
          console.error(`❌ Error deleting behavior events:`, eventsError);
        }

        // Delete daily checkins
        const { error: checkinsError } = await supabase
          .from('daily_checkins')
          .delete()
          .eq('user_id', account.user_id);
        
        if (checkinsError && !checkinsError.message.includes('does not exist')) {
          console.error(`❌ Error deleting daily checkins:`, checkinsError);
        }

        // Finally, delete user progress
        const { error: userError } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', account.user_id);
        
        if (userError) {
          console.error(`❌ Error deleting user progress:`, userError);
        } else {
          deletedUsers++;
          console.log(`  ✅ Deleted user progress`);
        }
        
      } catch (error) {
        console.error(`❌ Error cleaning up ${account.user_id}:`, error);
      }
    }
    
    console.log(`\n🎉 Cleanup Summary:`);
    console.log(`  ✅ Deleted ${deletedUsers} test users`);
    console.log(`  ✅ Deleted ${deletedTasks} tasks`);
    console.log(`  ✅ Cleaned up behavior records`);
    
    // Verify final count
    const { count: finalUserCount } = await supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true });
    
    console.log(`\n📊 Final user count: ${finalUserCount} (should be close to 67)`);
  } else {
    console.log('\n💡 To execute the cleanup, run:');
    console.log('npm run cleanup-test -- --execute');
  }
}

cleanupTestAccounts()
  .then(() => {
    console.log('\n✅ Cleanup script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });