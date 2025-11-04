const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function analyzeDuplicates() {
  console.log('🔍 Analyzing duplicate users...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in environment');
    return;
  }

  try {
    // Get all users from Supabase
    const { data: supabaseUsers, error } = await supabase
      .from('user_progress')
      .select('user_id, created_at, updated_at, total_points, tasks_completed')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching Supabase users:', error);
      return;
    }

    console.log(`📊 Found ${supabaseUsers.length} users in Supabase`);

    const userIdCounts = {};
    const duplicateUsers = [];

    // Count occurrences of each user_id
    supabaseUsers.forEach(user => {
      if (userIdCounts[user.user_id]) {
        userIdCounts[user.user_id].count++;
        userIdCounts[user.user_id].records.push(user);
      } else {
        userIdCounts[user.user_id] = {
          count: 1,
          records: [user]
        };
      }
    });

    // Find duplicates
    for (const [userId, data] of Object.entries(userIdCounts)) {
      if (data.count > 1) {
        duplicateUsers.push({
          userId,
          count: data.count,
          records: data.records
        });
      }
    }

    console.log('\n📋 ANALYSIS RESULTS:');
    console.log(`✅ Total unique users: ${Object.keys(userIdCounts).length}`);
    console.log(`❌ Duplicate users: ${duplicateUsers.length}`);

    if (duplicateUsers.length > 0) {
      console.log('\n🚨 DUPLICATE USERS FOUND:');
      duplicateUsers.forEach((duplicate, index) => {
        console.log(`\n${index + 1}. User ID: ${duplicate.userId.slice(-8)}`);
        console.log(`   Count: ${duplicate.count} records`);
        console.log('   Records:');
        duplicate.records.forEach((record, recordIndex) => {
          console.log(`     ${recordIndex + 1}. Created: ${record.created_at}`);
          console.log(`        Points: ${record.total_points || 0}`);
          console.log(`        Tasks: ${record.tasks_completed || 0}`);
        });
      });

      // Show which records we would keep vs delete
      console.log('\n🔧 CLEANUP STRATEGY:');
      duplicateUsers.forEach((duplicate, index) => {
        const records = duplicate.records.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const keepRecord = records[0]; // Keep the most recent one
        const deleteRecords = records.slice(1);

        console.log(`\n${index + 1}. User ${duplicate.userId.slice(-8)}:`);
        console.log(`   ✅ KEEP: Created ${keepRecord.created_at} (${keepRecord.total_points || 0} pts, ${keepRecord.tasks_completed || 0} tasks)`);
        deleteRecords.forEach((record, i) => {
          console.log(`   ❌ DELETE: Created ${record.created_at} (${record.total_points || 0} pts, ${record.tasks_completed || 0} tasks)`);
        });
      });
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total Supabase users: ${supabaseUsers.length}`);
    console.log(`Unique users: ${Object.keys(userIdCounts).length}`);
    console.log(`Duplicate records: ${duplicateUsers.length}`);
    console.log(`Records to delete: ${duplicateUsers.reduce((sum, dup) => sum + (dup.count - 1), 0)}`);

    return {
      totalUsers: supabaseUsers.length,
      uniqueUsers: Object.keys(userIdCounts).length,
      duplicateUsers,
      recordsToDelete: duplicateUsers.reduce((sum, dup) => sum + (dup.count - 1), 0)
    };

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

// Run the analysis
analyzeDuplicates().then((result) => {
  if (result) {
    console.log('\n✅ Analysis complete');

    if (result.duplicateUsers.length > 0) {
      console.log('\n🔧 Next steps:');
      console.log('1. Review the duplicates above');
      console.log('2. Run the cleanup script to merge/remove duplicates');
      console.log('3. The cleanup will keep the most recent record for each user');
    } else {
      console.log('\n🎉 No duplicates found! Your database is clean.');
    }
  }
  process.exit(0);
}).catch(error => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});