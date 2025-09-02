import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupOrphanedUsers(dryRun = true) {
  console.log(dryRun ? '🧪 DRY RUN - No changes will be made' : '🧹 CLEANING UP ORPHANED USERS');
  console.log('Finding users in Supabase that no longer exist in Clerk...\n');

  try {
    // Get all users from Supabase
    const { data: supabaseUsers, error } = await supabase
      .from('user_progress')
      .select('user_id, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    console.log(`📊 Found ${supabaseUsers.length} users in Supabase database`);

    // Find orphaned users (exist in Supabase but not in Clerk)
    const orphanedUsers = [];
    const activeUsers = [];

    for (const user of supabaseUsers) {
      try {
        await clerkClient.users.getUser(user.user_id);
        activeUsers.push(user.user_id);
      } catch (error) {
        // User not found in Clerk = orphaned
        orphanedUsers.push(user.user_id);
      }
    }

    console.log(`✅ Active users: ${activeUsers.length}`);
    console.log(`🗑️  Orphaned users: ${orphanedUsers.length}\n`);

    if (orphanedUsers.length === 0) {
      console.log('✅ No orphaned users found!');
      return;
    }

    // Define all tables that might contain user data
    const userTables = [
      'tasks',
      'user_progress',
      'user_behavior_events',
      'user_behavior_analysis',
      'daily_checkins',
      'moods',
      'user_ai_patterns',
      'user_behavior',
      'notification_logs'
    ];

    console.log(`🗑️  Processing ${orphanedUsers.length} orphaned users...\n`);

    let totalRecordsToDelete = 0;

    for (const userId of orphanedUsers) {
      console.log(`👤 User: ...${userId.slice(-8)}`);
      
      for (const table of userTables) {
        try {
          // Count records for this user in this table
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

          if (error) {
            // Table might not exist or user_id column might not exist
            if (!error.message.includes('does not exist')) {
              console.log(`   ⚠️  ${table}: Error checking - ${error.message}`);
            }
            continue;
          }

          if (count > 0) {
            totalRecordsToDelete += count;
            console.log(`   📋 ${table}: ${count} record${count === 1 ? '' : 's'}`);

            if (!dryRun) {
              // Actually delete the records
              const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .eq('user_id', userId);

              if (deleteError) {
                console.log(`   ❌ Failed to delete from ${table}: ${deleteError.message}`);
              } else {
                console.log(`   ✅ Deleted ${count} record${count === 1 ? '' : 's'} from ${table}`);
              }
            }
          }
        } catch (tableError) {
          // Skip tables that don't exist
          if (!tableError.message.includes('does not exist')) {
            console.log(`   ⚠️  ${table}: ${tableError.message}`);
          }
        }
      }
      console.log('');
    }

    console.log(`📊 Summary:`);
    console.log(`   Orphaned users: ${orphanedUsers.length}`);
    console.log(`   Total records: ${totalRecordsToDelete}`);

    if (dryRun) {
      console.log('\n🧪 Dry run completed. Run with --cleanup flag to actually delete the data.');
      console.log('   node scripts/cleanup-orphaned-users.js --cleanup');
    } else {
      console.log('\n✅ Orphaned user cleanup completed!');
      console.log(`   Removed ${orphanedUsers.length} users and ${totalRecordsToDelete} associated records`);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Main execution
const shouldCleanup = process.argv.includes('--cleanup');

cleanupOrphanedUsers(!shouldCleanup).then(() => {
  console.log('\n🏁 Cleanup process completed');
  process.exit(0);
}).catch(console.error);