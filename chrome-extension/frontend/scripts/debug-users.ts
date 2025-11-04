import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugUsers() {
  console.log('🔍 Starting user debug analysis...\n');

  try {
    // 1. Get all users from Supabase
    console.log('📊 Fetching users from Supabase...');
    const { data: supabaseUsers, error: supabaseError } = await supabase
      .from('user_progress')
      .select('user_id, created_at, daily_start_time')
      .order('created_at', { ascending: false });

    if (supabaseError) {
      console.error('❌ Error fetching Supabase users:', supabaseError);
      return;
    }

    console.log(`📈 Found ${supabaseUsers.length} users in Supabase database`);

    console.log(`\n📋 Supabase Database Analysis:`);
    console.log(`   Total Users: ${supabaseUsers.length}`);
    
    // Show recent users
    const recentUsers = supabaseUsers.filter(user => {
      const createdDate = new Date(user.created_at);
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return createdDate > dayAgo;
    });

    console.log(`   Users created in last 24h: ${recentUsers.length}`);
    
    if (recentUsers.length > 0) {
      console.log(`\n📅 Recent users:`);
      recentUsers.forEach(user => {
        console.log(`   - ${user.user_id.slice(-8)}... (${user.created_at})`);
      });
    }

    // Note: To compare with Clerk, we would need to make API calls to Clerk
    // which requires different authentication setup in this script

    // 4. Check for duplicate user_progress records
    console.log(`\n🔍 Checking for duplicate user_progress records...`);
    const { data: duplicates } = await supabase
      .rpc('find_duplicate_users') // This would need to be created
      .catch(() => ({ data: null })); // Ignore if function doesn't exist

    if (!duplicates) {
      // Manual duplicate check
      const userIdCounts = supabaseUsers.reduce((acc: Record<string, number>, user) => {
        acc[user.user_id] = (acc[user.user_id] || 0) + 1;
        return acc;
      }, {});

      const duplicateUserIds = Object.entries(userIdCounts)
        .filter(([, count]) => count > 1)
        .map(([userId]) => userId);

      if (duplicateUserIds.length > 0) {
        console.log(`❌ Found ${duplicateUserIds.length} users with duplicate records:`);
        duplicateUserIds.forEach(userId => {
          console.log(`   - ${userId} (${userIdCounts[userId]} records)`);
        });
      } else {
        console.log(`✅ No duplicate user records found`);
      }
    }

    // 5. Recent user activity
    console.log(`\n📈 Recent user activity (last 7 days):`);
    const recentUsers = supabaseUsers.filter(user => {
      const createdDate = new Date(user.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate > weekAgo;
    });

    console.log(`   - New users this week: ${recentUsers.length}`);
    if (recentUsers.length > 0) {
      recentUsers.forEach(user => {
        console.log(`     • ${user.user_id.slice(-8)} (${user.created_at})`);
      });
    }

  } catch (error) {
    console.error('❌ Error during user debug analysis:', error);
  }
}

// Run the debug
debugUsers().then(() => {
  console.log('\n🏁 User debug analysis completed');
  process.exit(0);
}).catch(console.error);