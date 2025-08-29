#!/usr/bin/env ts-node

/**
 * Database Cleanup Script
 * 
 * This script identifies and removes duplicate records in the database,
 * keeping the oldest record for each user to preserve their progress.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Check required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in environment variables');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DuplicateUser {
  user_id: string;
  count: number;
  ids: number[];
  created_dates: string[];
}

async function findDuplicateUsers(): Promise<DuplicateUser[]> {
  console.log('🔍 Scanning for duplicate users in user_progress table...');
  
  const { data: duplicates, error } = await supabase
    .from('user_progress')
    .select('user_id, id, created_at')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Error fetching user progress records:', error);
    throw error;
  }
  
  // Group by user_id to find duplicates
  const userGroups: { [key: string]: any[] } = {};
  duplicates?.forEach(record => {
    if (!userGroups[record.user_id]) {
      userGroups[record.user_id] = [];
    }
    userGroups[record.user_id].push(record);
  });
  
  // Find users with multiple records
  const duplicateUsers: DuplicateUser[] = [];
  Object.entries(userGroups).forEach(([userId, records]) => {
    if (records.length > 1) {
      duplicateUsers.push({
        user_id: userId,
        count: records.length,
        ids: records.map(r => r.id),
        created_dates: records.map(r => r.created_at)
      });
    }
  });
  
  return duplicateUsers;
}

async function findOrphanedTasks(): Promise<any[]> {
  console.log('🔍 Scanning for orphaned tasks (tasks without user_progress records)...');
  
  const { data: orphanedTasks, error } = await supabase.rpc('find_orphaned_tasks');
  
  if (error) {
    console.log('⚠️  Custom function not available, using manual query...');
    
    // Manual query to find orphaned tasks
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, user_id, title, created_at');
    
    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError);
      return [];
    }
    
    const { data: allUsers, error: usersError } = await supabase
      .from('user_progress')
      .select('user_id');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return [];
    }
    
    const validUserIds = new Set(allUsers?.map(u => u.user_id));
    const orphaned = allTasks?.filter(task => !validUserIds.has(task.user_id)) || [];
    
    console.log(`📊 Found ${orphaned.length} orphaned tasks`);
    return orphaned;
  }
  
  console.log(`📊 Found ${orphanedTasks?.length || 0} orphaned tasks`);
  return orphanedTasks || [];
}

async function cleanupDuplicateUsers(duplicates: DuplicateUser[], dryRun: boolean = true): Promise<void> {
  console.log(`\n🧹 ${dryRun ? 'DRY RUN - ' : ''}Cleaning up ${duplicates.length} duplicate users...`);
  
  for (const duplicate of duplicates) {
    console.log(`\n👤 User ${duplicate.user_id} has ${duplicate.count} records:`);
    duplicate.created_dates.forEach((date, index) => {
      console.log(`  ${index === 0 ? '✅' : '❌'} ID ${duplicate.ids[index]} - ${date} ${index === 0 ? '(KEEPING - oldest)' : '(REMOVING)'}`);
    });
    
    if (!dryRun && duplicate.ids.length > 1) {
      // Keep the first (oldest) record, delete the rest
      const idsToDelete = duplicate.ids.slice(1);
      
      const { error } = await supabase
        .from('user_progress')
        .delete()
        .in('id', idsToDelete);
      
      if (error) {
        console.error(`❌ Error deleting duplicates for user ${duplicate.user_id}:`, error);
      } else {
        console.log(`✅ Removed ${idsToDelete.length} duplicate records for user ${duplicate.user_id}`);
      }
    }
  }
}

async function cleanupOrphanedTasks(orphanedTasks: any[], dryRun: boolean = true): Promise<void> {
  if (orphanedTasks.length === 0) {
    console.log('✅ No orphaned tasks found');
    return;
  }
  
  console.log(`\n🧹 ${dryRun ? 'DRY RUN - ' : ''}Cleaning up ${orphanedTasks.length} orphaned tasks...`);
  
  orphanedTasks.forEach(task => {
    console.log(`❌ Task ${task.id}: "${task.title}" (User: ${task.user_id}) - ${task.created_at}`);
  });
  
  if (!dryRun) {
    const taskIds = orphanedTasks.map(t => t.id);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', taskIds);
    
    if (error) {
      console.error('❌ Error deleting orphaned tasks:', error);
    } else {
      console.log(`✅ Removed ${taskIds.length} orphaned tasks`);
    }
  }
}

async function generateCleanupReport(): Promise<void> {
  console.log('📊 Database Health Report');
  console.log('========================\n');
  
  // Count total records
  const tables = ['user_progress', 'tasks', 'daily_checkins'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error(`❌ Error counting ${table}:`, error);
    } else {
      console.log(`📋 ${table}: ${count} records`);
    }
  }
  
  // Find duplicates and orphaned records
  const duplicates = await findDuplicateUsers();
  const orphanedTasks = await findOrphanedTasks();
  
  console.log(`\n🔍 Issues Found:`);
  console.log(`❌ Duplicate users: ${duplicates.length}`);
  console.log(`❌ Orphaned tasks: ${orphanedTasks.length}`);
  
  return;
}

async function runCleanup() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  console.log('🧹 Database Cleanup Script');
  console.log('==========================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('💡 Add --execute flag to actually perform cleanup\n');
  } else {
    console.log('⚠️  EXECUTE MODE - Changes will be made to database\n');
  }
  
  // Generate report first
  await generateCleanupReport();
  
  // Find issues
  const duplicates = await findDuplicateUsers();
  const orphanedTasks = await findOrphanedTasks();
  
  if (duplicates.length === 0 && orphanedTasks.length === 0) {
    console.log('\n🎉 Database is clean! No issues found.');
    return;
  }
  
  // Clean up duplicates
  if (duplicates.length > 0) {
    await cleanupDuplicateUsers(duplicates, dryRun);
  }
  
  // Clean up orphaned tasks
  if (orphanedTasks.length > 0) {
    await cleanupOrphanedTasks(orphanedTasks, dryRun);
  }
  
  if (dryRun) {
    console.log('\n💡 To execute the cleanup, run:');
    console.log('npm run cleanup-db -- --execute');
  } else {
    console.log('\n🎉 Cleanup completed!');
  }
}

// Run the cleanup
runCleanup()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });