import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createClerkClient } from '@clerk/backend';

// Load environment variables
config({ path: '.env.local' });

async function restoreUserAccounts() {
  console.log('🔧 Restoring user accounts from Clerk to Supabase...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  try {
    // Get all users from Clerk
    console.log('👥 Fetching all users from Clerk...');
    
    let allUsers: any[] = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
      const users = await clerk.users.getUserList({
        limit,
        offset
      });
      
      allUsers = allUsers.concat(users.data);
      hasMore = users.data.length === limit;
      offset += limit;
      
      console.log(`📊 Fetched ${users.data.length} users (total so far: ${allUsers.length})`);
    }

    console.log(`✅ Found ${allUsers.length} users in Clerk`);

    // Create user_progress records for all Clerk users
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of allUsers) {
      try {
        console.log(`👤 Processing user: ${user.id} (${user.firstName} ${user.lastName})`);
        
        // Check if user already exists in Supabase
        const { data: existingUser } = await supabase
          .from('user_progress')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        if (existingUser) {
          console.log(`⏭️  User ${user.id} already exists, skipping`);
          skipCount++;
          continue;
        }

        // Create user progress record
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            current_mood: 'neutral',
            daily_mood_checks: 0,
            daily_ai_splits: 0,
            last_mood_update: new Date().toISOString(),
            last_reset_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error(`❌ Failed to create user ${user.id}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Created user progress for ${user.id}`);
          successCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing user ${user.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Restoration Summary:`);
    console.log(`   ✅ Successfully created: ${successCount} users`);
    console.log(`   ⏭️  Already existed: ${skipCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    console.log(`   📋 Total processed: ${allUsers.length} users`);

    // Verify the restoration
    const { data: supabaseUsers, error: countError } = await supabase
      .from('user_progress')
      .select('user_id');

    if (!countError) {
      console.log(`\n🔍 Verification: Found ${supabaseUsers?.length || 0} users in Supabase database`);
    }

    console.log(`\n✅ User account restoration completed!`);

  } catch (error) {
    console.error('❌ Error during restoration:', error);
  }
}

restoreUserAccounts().catch(console.error);