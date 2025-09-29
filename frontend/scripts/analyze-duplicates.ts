import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeDuplicates() {
  console.log('🔍 Analyzing duplicate users...');

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

    // Check each user against Clerk
    const analysis = {
      validUsers: [],
      orphanedUsers: [], // Users in Supabase but not in Clerk
      duplicateUsers: [], // Multiple Supabase records for same user
      clerkOnlyUsers: [] // Users in Clerk but not in Supabase
    };

    const userIdCounts = {};

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
        analysis.duplicateUsers.push({
          userId,
          count: data.count,
          records: data.records
        });
      }
    }

    console.log('\n📋 ANALYSIS RESULTS:');
    console.log(`✅ Total unique users: ${Object.keys(userIdCounts).length}`);
    console.log(`❌ Duplicate users: ${analysis.duplicateUsers.length}`);

    if (analysis.duplicateUsers.length > 0) {
      console.log('\n🚨 DUPLICATE USERS FOUND:');
      analysis.duplicateUsers.forEach((duplicate, index) => {
        console.log(`\n${index + 1}. User ID: ${duplicate.userId.slice(-8)}`);
        console.log(`   Count: ${duplicate.count} records`);
        console.log('   Records:');
        duplicate.records.forEach((record, recordIndex) => {
          console.log(`     ${recordIndex + 1}. Created: ${record.created_at}`);
          console.log(`        Points: ${record.total_points || 0}`);
          console.log(`        Tasks: ${record.tasks_completed || 0}`);
        });
      });
    }

    // Skip Clerk verification for now - focus on Supabase duplicates
    console.log('\n⏭️ Skipping Clerk verification (requires different setup)');

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total Supabase users: ${supabaseUsers.length}`);
    console.log(`Unique users: ${Object.keys(userIdCounts).length}`);
    console.log(`Duplicate records: ${analysis.duplicateUsers.length}`);
    console.log(`Orphaned users (sample): ${analysis.orphanedUsers.length}`);

    return analysis;

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

// Run the analysis
if (require.main === module) {
  analyzeDuplicates().then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

export { analyzeDuplicates };