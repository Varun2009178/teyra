import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testUserDeletionFlow() {
  console.log('🧪 Testing User Deletion Flow');
  console.log('=====================================');
  
  // Test user ID (you can replace this with an actual test user ID)
  const testUserId = 'test_user_deletion_' + Date.now();
  
  console.log(`📝 Creating test data for user: ${testUserId}`);
  
  // Create test data across all tables
  try {
    // Create user progress
    await supabase
      .from('user_progress')
      .insert({
        user_id: testUserId,
        current_mood: 'happy',
        daily_tasks_completed: 5,
        total_tasks_completed: 25,
        current_streak: 3
      });
    
    // Create some tasks
    await supabase
      .from('tasks')
      .insert([
        { user_id: testUserId, title: 'Test task 1', completed: true },
        { user_id: testUserId, title: 'Test task 2', completed: false },
        { user_id: testUserId, title: '🌱 Eco test task', completed: true }
      ]);
    
    // Create daily checkin (if table exists)
    try {
      await supabase
        .from('daily_checkins')
        .insert({
          user_id: testUserId,
          emotional_state: 'positive',
          productivity_level: 8
        });
    } catch (error) {
      console.log('📝 daily_checkins table might not exist, skipping...');
    }
    
    console.log('✅ Test data created successfully');
    
    // Now check what data exists
    console.log('\n🔍 Checking created data...');
    
    const tables = [
      'tasks', 
      'user_progress', 
      'user_behavior_events', 
      'user_behavior_analysis',
      'daily_checkins',
      'moods',
      'user_ai_patterns',
      'user_behavior'
    ];
    
    const beforeCounts: Record<string, number> = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .eq('user_id', testUserId);
        
        if (!error && data) {
          beforeCounts[table] = data.length;
          console.log(`📊 ${table}: ${data.length} records`);
        } else {
          console.log(`📊 ${table}: 0 records (or table doesn't exist)`);
          beforeCounts[table] = 0;
        }
      } catch (error) {
        console.log(`📊 ${table}: Could not check (table might not exist)`);
        beforeCounts[table] = 0;
      }
    }
    
    // Now simulate the webhook deletion process
    console.log('\n🗑️  Simulating webhook deletion process...');
    
    const deletionResults = [];
    
    for (const table of tables) {
      try {
        console.log(`🗑️  Deleting from ${table} for user ${testUserId}...`);
        
        const deleteResult = await supabase
          .from(table)
          .delete()
          .eq('user_id', testUserId);
        
        if (deleteResult.error) {
          console.error(`❌ Error deleting from ${table}:`, deleteResult.error);
          deletionResults.push({ table, success: false, error: deleteResult.error });
        } else {
          console.log(`✅ Successfully deleted from ${table} (count: ${deleteResult.count || 'unknown'})`);
          deletionResults.push({ table, success: true, count: deleteResult.count || 0 });
        }
      } catch (error) {
        console.error(`❌ Exception while deleting from ${table}:`, error);
        deletionResults.push({ table, success: false, error });
      }
    }
    
    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    
    let totalRemainingRecords = 0;
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .eq('user_id', testUserId);
        
        if (!error && data) {
          const remaining = data.length;
          totalRemainingRecords += remaining;
          
          if (remaining > 0) {
            console.log(`⚠️  ${table}: ${remaining} records still remain!`);
          } else {
            console.log(`✅ ${table}: All records deleted`);
          }
        }
      } catch (error) {
        console.log(`📊 ${table}: Could not verify (table might not exist)`);
      }
    }
    
    console.log('\n📋 DELETION SUMMARY:');
    console.log('====================');
    
    const successfulDeletions = deletionResults.filter(r => r.success).length;
    const failedDeletions = deletionResults.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successfulDeletions}/${tables.length} tables`);
    console.log(`❌ Failed: ${failedDeletions.length} tables`);
    console.log(`📊 Total remaining records: ${totalRemainingRecords}`);
    
    if (failedDeletions.length > 0) {
      console.log('\nFailed deletions:');
      failedDeletions.forEach(failure => {
        console.log(`  - ${failure.table}: ${failure.error}`);
      });
    }
    
    if (totalRemainingRecords === 0) {
      console.log('\n🎉 SUCCESS: All user data was completely deleted!');
    } else {
      console.log(`\n⚠️  WARNING: ${totalRemainingRecords} records still remain in the database`);
    }
    
  } catch (error) {
    console.error('❌ Error in test process:', error);
  }
}

// Run the test
testUserDeletionFlow().catch(console.error);