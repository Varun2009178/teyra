import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

async function testUserLifecycle() {
  console.log('🧪 Testing user lifecycle (create → delete)...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const testUserId = 'user_test_lifecycle_123';

  try {
    // 1. Simulate user creation (like webhook would do)
    console.log('👤 Creating test user...');
    const { data: newUser, error: createError } = await supabase
      .from('user_progress')
      .insert({
        user_id: testUserId,
        current_mood: 'neutral',
        daily_mood_checks: 0,
        daily_ai_splits: 0,
        last_mood_update: new Date().toISOString(),
        last_reset_date: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create user:', createError);
      return;
    }
    console.log('✅ User created successfully');

    // 2. Add some test tasks
    console.log('📝 Adding test tasks...');
    const { error: taskError } = await supabase
      .from('tasks')
      .insert([
        { user_id: testUserId, title: 'Test task 1', completed: false },
        { user_id: testUserId, title: 'Test task 2', completed: true },
        { user_id: testUserId, title: 'Test task 3', completed: false }
      ]);

    if (taskError) {
      console.error('❌ Failed to create tasks:', taskError);
      return;
    }
    console.log('✅ Tasks created successfully');

    // 3. Verify data exists
    console.log('🔍 Verifying data exists...');
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', testUserId);

    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', testUserId);

    console.log(`📊 Found ${tasks?.length || 0} tasks and ${progress?.length || 0} progress records`);

    // 4. Simulate user deletion (like webhook would do)
    console.log('🗑️ Simulating user deletion...');
    
    const userTables = ['tasks', 'user_progress'];
    
    for (const table of userTables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', testUserId);
        
      if (error) {
        console.error(`❌ Failed to delete from ${table}:`, error);
      } else {
        console.log(`✅ Deleted from ${table}`);
      }
    }

    // 5. Verify cleanup
    console.log('🔍 Verifying cleanup...');
    const { data: remainingTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', testUserId);

    const { data: remainingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', testUserId);

    if (remainingTasks?.length === 0 && remainingProgress?.length === 0) {
      console.log('✅ User lifecycle test PASSED - all data properly cleaned up');
    } else {
      console.log(`❌ User lifecycle test FAILED - ${remainingTasks?.length || 0} tasks and ${remainingProgress?.length || 0} progress records remain`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUserLifecycle().catch(console.error);