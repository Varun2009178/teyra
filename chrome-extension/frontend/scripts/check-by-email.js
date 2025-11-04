import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsersByEmail() {
  console.log('📧 Checking for users with same email address...\n');

  try {
    // Get all users from Supabase
    const { data: supabaseUsers, error } = await supabase
      .from('user_progress')
      .select('user_id, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching Supabase users:', error);
      return;
    }

    console.log(`📊 Found ${supabaseUsers.length} users in Supabase database`);

    // Get emails from Clerk for each user
    console.log('🔍 Fetching email addresses from Clerk...\n');
    
    const userEmailMap = new Map();
    const emailGroups = new Map();
    let clerkErrors = 0;

    for (const user of supabaseUsers) {
      try {
        // Get user from Clerk
        const clerkUser = await clerkClient.users.getUser(user.user_id);
        const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
        
        if (email) {
          userEmailMap.set(user.user_id, email);
          
          // Group by email
          if (!emailGroups.has(email)) {
            emailGroups.set(email, []);
          }
          emailGroups.get(email).push({
            userId: user.user_id,
            created: user.created_at
          });
        }
      } catch (error) {
        clerkErrors++;
        console.log(`⚠️  Could not fetch Clerk data for user ${user.user_id.slice(-8)}... (likely deleted)`);
      }
    }

    console.log(`📋 Successfully fetched ${userEmailMap.size} user emails from Clerk`);
    if (clerkErrors > 0) {
      console.log(`⚠️  ${clerkErrors} users not found in Clerk (likely deleted but not cleaned up in database)`);
    }

    // Find duplicate emails
    const duplicateEmails = Array.from(emailGroups.entries()).filter(([email, users]) => users.length > 1);

    if (duplicateEmails.length === 0) {
      console.log('\n✅ No users found with duplicate email addresses!');
      
      if (clerkErrors > 0) {
        console.log(`\n🧹 However, you have ${clerkErrors} orphaned users in Supabase that should be cleaned up.`);
        console.log('These are users that exist in your database but were deleted from Clerk.');
      }
      return;
    }

    console.log(`\n❌ Found ${duplicateEmails.length} email addresses with multiple users:`);

    for (const [email, users] of duplicateEmails) {
      console.log(`\n📧 Email: ${email} (${users.length} accounts)`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. User ID: ...${user.userId.slice(-8)} (created: ${user.created})`);
      });
      
      // Show which one is newer/older
      const sortedUsers = users.sort((a, b) => new Date(a.created) - new Date(b.created));
      console.log(`   📅 Oldest: ...${sortedUsers[0].userId.slice(-8)}`);
      console.log(`   📅 Newest: ...${sortedUsers[sortedUsers.length - 1].userId.slice(-8)}`);
    }

    return { duplicateEmails, orphanedCount: clerkErrors };

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Main execution
checkUsersByEmail().then((result) => {
  if (result && result.duplicateEmails.length > 0) {
    console.log('\n🎯 Next steps:');
    console.log('1. Decide which account to keep for each duplicate email');
    console.log('2. Clean up the unwanted accounts from both Clerk and Supabase');
  }
  
  if (result && result.orphanedCount > 0) {
    console.log('\n🧹 Orphaned user cleanup needed:');
    console.log(`Run the webhook cleanup to remove ${result.orphanedCount} orphaned users from database`);
  }
  
  console.log('\n🏁 Email analysis completed');
  process.exit(0);
}).catch(console.error);