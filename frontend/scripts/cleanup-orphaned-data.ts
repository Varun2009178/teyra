#!/usr/bin/env tsx

import { clerkClient } from '@clerk/nextjs/server';
import { supabase } from '../src/lib/supabase';

// This script cleans up orphaned data from deleted Clerk users
async function cleanupOrphanedData() {
  console.log('🧹 Starting orphaned data cleanup...');
  
  try {
    // Get all user IDs from Supabase tables
    const [tasksResult, progressResult, checkinsResult] = await Promise.allSettled([
      supabase.from('tasks').select('user_id'),
      supabase.from('user_progress').select('user_id'),
      supabase.from('daily_checkins').select('user_id')
    ]);

    const allUserIds = new Set<string>();

    // Collect all user IDs from all tables
    if (tasksResult.status === 'fulfilled') {
      tasksResult.value.data?.forEach(row => allUserIds.add(row.user_id));
    }
    if (progressResult.status === 'fulfilled') {
      progressResult.value.data?.forEach(row => allUserIds.add(row.user_id));
    }
    if (checkinsResult.status === 'fulfilled') {
      checkinsResult.value.data?.forEach(row => allUserIds.add(row.user_id));
    }

    console.log(`📊 Found ${allUserIds.size} unique user IDs in database`);

    const orphanedUserIds: string[] = [];
    const validUserIds: string[] = [];

    // Check each user ID against Clerk
    for (const userId of allUserIds) {
      try {
        await clerkClient.users.getUser(userId);
        validUserIds.push(userId);
        console.log(`✅ User ${userId} exists in Clerk`);
      } catch (error: any) {
        if (error.status === 404) {
          orphanedUserIds.push(userId);
          console.log(`❌ User ${userId} not found in Clerk (orphaned)`);
        } else {
          console.error(`⚠️  Error checking user ${userId}:`, error.message);
        }
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Valid users: ${validUserIds.length}`);
    console.log(`   Orphaned users: ${orphanedUserIds.length}`);

    if (orphanedUserIds.length === 0) {
      console.log('🎉 No orphaned data found! Database is clean.');
      return;
    }

    console.log(`\n🗑️  Cleaning up data for ${orphanedUserIds.length} orphaned users...`);

    // Delete orphaned data for each user
    let totalDeleted = { tasks: 0, progress: 0, checkins: 0 };

    for (const userId of orphanedUserIds) {
      console.log(`\n🔄 Cleaning data for orphaned user: ${userId}`);

      // Delete from each table
      const deletionResults = await Promise.allSettled([
        supabase.from('tasks').delete().eq('user_id', userId),
        supabase.from('user_progress').delete().eq('user_id', userId),
        supabase.from('daily_checkins').delete().eq('user_id', userId)
      ]);

      const tables = ['tasks', 'user_progress', 'daily_checkins'];
      deletionResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const tableName = tables[index];
          const count = result.value.count || 0;
          console.log(`   ✅ Deleted ${count} rows from ${tableName}`);
          
          if (tableName === 'tasks') totalDeleted.tasks += count;
          else if (tableName === 'user_progress') totalDeleted.progress += count;
          else if (tableName === 'daily_checkins') totalDeleted.checkins += count;
        } else {
          console.error(`   ❌ Error deleting from ${tables[index]}:`, result.reason);
        }
      });
    }

    console.log(`\n🎉 Cleanup completed!`);
    console.log(`   Total deleted: ${totalDeleted.tasks} tasks, ${totalDeleted.progress} progress records, ${totalDeleted.checkins} check-ins`);
    console.log(`   Orphaned users cleaned: ${orphanedUserIds.length}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOrphanedData()
  .then(() => {
    console.log('✅ Cleanup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  });