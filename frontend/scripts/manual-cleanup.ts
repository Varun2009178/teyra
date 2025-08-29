import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

async function cleanupOrphanedData() {
  console.log('🧹 Starting manual cleanup of orphaned data...');

  // Verify we have the required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin operations
  );

  try {
    // Get all user IDs from the database
    const { data: allUsers, error: userError } = await supabase
      .from('user_progress')
      .select('user_id');

    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }

    const userIds = allUsers?.map(u => u.user_id) || [];
    console.log(`📊 Found ${userIds.length} users in database`);

    if (userIds.length === 0) {
      console.log('✅ No users found in database');
      return;
    }

    // Check which users exist in Clerk
    const { createClerkClient } = await import('@clerk/backend');
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    let orphanedUsers: string[] = [];
    
    for (const userId of userIds) {
      try {
        await clerk.users.getUser(userId);
        console.log(`✅ User ${userId} exists in Clerk`);
      } catch (error: any) {
        if (error.status === 404) {
          orphanedUsers.push(userId);
          console.log(`❌ User ${userId} is orphaned (not in Clerk)`);
        } else {
          console.error(`⚠️ Error checking user ${userId}:`, error.message);
        }
      }
    }

    console.log(`🗑️ Found ${orphanedUsers.length} orphaned users to clean up`);

    if (orphanedUsers.length === 0) {
      console.log('✅ No orphaned data found');
      return;
    }

    // Clean up orphaned data
    const tables = ['tasks', 'user_progress', 'user_behavior_events', 'user_behavior_analysis'];
    
    for (const userId of orphanedUsers) {
      console.log(`🧹 Cleaning up user: ${userId}`);
      
      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', userId);
            
          if (error) {
            console.error(`❌ Error deleting from ${table} for ${userId}:`, error.message);
          } else {
            console.log(`✅ Cleaned up ${table} for ${userId}`);
          }
        } catch (err) {
          console.error(`❌ Exception deleting from ${table} for ${userId}:`, err);
        }
      }
    }

    console.log(`✅ Cleanup completed! Removed data for ${orphanedUsers.length} orphaned users`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupOrphanedData().catch(console.error);