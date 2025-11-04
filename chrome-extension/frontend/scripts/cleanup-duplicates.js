import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findDuplicateUsers() {
  console.log('🔍 Looking for duplicate users in database...\n');

  try {
    // Get all users with their creation dates
    const { data: users, error } = await supabase
      .from('user_progress')
      .select('id, user_id, created_at, daily_start_time')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    console.log(`📊 Total user_progress records: ${users.length}`);

    // Group users by user_id to find duplicates
    const userGroups = users.reduce((groups, user) => {
      if (!groups[user.user_id]) {
        groups[user.user_id] = [];
      }
      groups[user.user_id].push(user);
      return groups;
    }, {});

    // Find duplicates
    const duplicates = Object.entries(userGroups).filter(([userId, userRecords]) => userRecords.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate users found!');
      return;
    }

    console.log(`❌ Found ${duplicates.length} users with duplicate records:\n`);

    for (const [userId, records] of duplicates) {
      console.log(`👤 User ID: ${userId.slice(-8)}... (${records.length} records)`);
      
      records.forEach((record, index) => {
        console.log(`   ${index + 1}. Record ID: ${record.id}, Created: ${record.created_at}`);
      });

      // Check if user has any tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, completed')
        .eq('user_id', userId);

      console.log(`   📋 Associated tasks: ${tasks?.length || 0}`);
      
      if (tasks && tasks.length > 0) {
        const completed = tasks.filter(t => t.completed).length;
        console.log(`   ✅ Completed: ${completed}, ⏸️  Pending: ${tasks.length - completed}`);
      }
      console.log('');
    }

    return duplicates;

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function cleanupDuplicates(dryRun = true) {
  console.log(dryRun ? '🧪 DRY RUN - Analyzing duplicates (no changes will be made)' : '🧹 CLEANING UP DUPLICATES');

  const duplicates = await findDuplicateUsers();
  if (!duplicates || duplicates.length === 0) {
    return;
  }

  console.log('\n🛠️  Cleanup strategy:');
  console.log('   - Keep the OLDEST record (first created)');
  console.log('   - Delete newer duplicate records');
  console.log('   - Preserve all task data (associated with user_id)\n');

  for (const [userId, records] of duplicates) {
    // Sort by created_at to keep the oldest
    const sortedRecords = records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const keepRecord = sortedRecords[0]; // Keep the oldest
    const deleteRecords = sortedRecords.slice(1); // Delete the rest

    console.log(`👤 User ${userId.slice(-8)}...:`);
    console.log(`   ✅ KEEPING: Record ${keepRecord.id} (created ${keepRecord.created_at})`);
    
    for (const deleteRecord of deleteRecords) {
      console.log(`   ❌ ${dryRun ? 'WOULD DELETE' : 'DELETING'}: Record ${deleteRecord.id} (created ${deleteRecord.created_at})`);
      
      if (!dryRun) {
        try {
          const { error } = await supabase
            .from('user_progress')
            .delete()
            .eq('id', deleteRecord.id);

          if (error) {
            console.error(`   ❌ Failed to delete record ${deleteRecord.id}:`, error.message);
          } else {
            console.log(`   ✅ Successfully deleted record ${deleteRecord.id}`);
          }
        } catch (error) {
          console.error(`   ❌ Error deleting record ${deleteRecord.id}:`, error);
        }
      }
    }
    console.log('');
  }

  if (dryRun) {
    console.log('🧪 Dry run completed. Run with cleanupDuplicates(false) to actually delete duplicates.');
  } else {
    console.log('✅ Duplicate cleanup completed!');
  }
}

// Main execution
async function main() {
  console.log('🧹 Database Duplicate User Cleanup Tool\n');
  
  // First, just analyze
  await findDuplicateUsers();
  
  // Then show what would be cleaned up
  console.log('\n' + '='.repeat(50));
  await cleanupDuplicates(true); // Dry run
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 To actually clean up duplicates, run:');
  console.log('   node scripts/cleanup-duplicates.js --cleanup');
}

// Check command line arguments
const shouldCleanup = process.argv.includes('--cleanup');

if (shouldCleanup) {
  cleanupDuplicates(false).then(() => {
    console.log('\n🏁 Cleanup completed');
    process.exit(0);
  }).catch(console.error);
} else {
  main().then(() => {
    console.log('\n🏁 Analysis completed');
    process.exit(0);
  }).catch(console.error);
}