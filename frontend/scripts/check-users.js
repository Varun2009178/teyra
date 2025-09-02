import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  console.log('🔍 Checking user data in Supabase...\n');

  try {
    // Get all users from Supabase
    const { data: users, error } = await supabase
      .from('user_progress')
      .select('user_id, created_at, daily_start_time')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    console.log(`📊 Found ${users.length} users in database\n`);

    // Show recent users (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentUsers = users.filter(user => {
      return new Date(user.created_at) > weekAgo;
    });

    console.log(`📅 Users created in last 7 days: ${recentUsers.length}`);
    
    if (recentUsers.length > 0) {
      recentUsers.forEach(user => {
        const shortId = user.user_id.slice(-8);
        console.log(`   - ...${shortId} (${user.created_at})`);
      });
    }

    // Check for task data
    const { data: tasks } = await supabase
      .from('tasks')
      .select('user_id')
      .limit(1000);

    const uniqueTaskUsers = new Set(tasks?.map(t => t.user_id) || []);
    console.log(`\n📋 Users with task data: ${uniqueTaskUsers.size}`);

    // Check if there are any orphaned users (users with no tasks or very old)
    const oldUsers = users.filter(user => {
      const userDate = new Date(user.created_at);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return userDate < monthAgo && !uniqueTaskUsers.has(user.user_id);
    });

    if (oldUsers.length > 0) {
      console.log(`\n⚠️  Potentially inactive users (>1 month old, no tasks): ${oldUsers.length}`);
    }

    console.log('\n✅ User check completed');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();