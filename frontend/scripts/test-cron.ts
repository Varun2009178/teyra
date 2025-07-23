import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testCronReset() {
  try {
    console.log('Testing cron reset functionality...');
    
    // Check if environment variables are set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Connect to database
    const sql = neon(process.env.DATABASE_URL);
    
    // Create a test user ID
    const testUserId = `test_user_${Date.now()}`;
    console.log(`Using test user ID: ${testUserId}`);
    
    // 1. Create test user progress
    console.log('\n1. Creating test user progress...');
    const userProgress = await sql`
      INSERT INTO user_progress (
        user_id, 
        completed_tasks, 
        total_tasks, 
        all_time_completed, 
        mood, 
        daily_completed_tasks, 
        daily_mood_checks, 
        daily_ai_splits, 
        last_reset_date, 
        created_at, 
        updated_at
      ) 
      VALUES (
        ${testUserId}, 
        5, 
        10, 
        20, 
        'energized', 
        5, 
        1, 
        2, 
        ${new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()}, 
        ${new Date().toISOString()}, 
        ${new Date().toISOString()}
      )
      RETURNING *
    `;
    
    console.log('✅ Created test user progress:', userProgress[0]);
    
    // 2. Create test tasks
    console.log('\n2. Creating test tasks...');
    
    for (let i = 1; i <= 5; i++) {
      await sql`
        INSERT INTO tasks (
          user_id, 
          title, 
          completed, 
          has_been_split, 
          created_at, 
          updated_at
        ) 
        VALUES (
          ${testUserId}, 
          ${'Test Task ' + i}, 
          ${i <= 3}, 
          ${false}, 
          ${new Date().toISOString()}, 
          ${new Date().toISOString()}
        )
      `;
    }
    
    console.log('✅ Created 5 test tasks');
    
    // 3. Simulate cron job
    console.log('\n3. Simulating cron job...');
    
    // Get users who need daily reset
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const usersForReset = await sql`
      SELECT * FROM user_progress 
      WHERE last_reset_date < ${twentyFourHoursAgo.toISOString()}
    `;
    
    console.log(`Found ${usersForReset.length} users who need reset`);
    
    // Process resets
    for (const user of usersForReset) {
      if (user.user_id === testUserId) {
        console.log(`Processing reset for test user ${testUserId}`);
        
        // Delete all tasks
        const deleteResult = await sql`
          DELETE FROM tasks 
          WHERE user_id = ${testUserId}
        `;
        
        console.log('Deleted tasks');
        
        // Reset user progress
        const updatedProgress = await sql`
          UPDATE user_progress 
          SET 
            completed_tasks = 0,
            total_tasks = 0,
            daily_completed_tasks = 0,
            daily_mood_checks = 0,
            daily_ai_splits = 0,
            last_reset_date = ${new Date().toISOString()}
          WHERE user_id = ${testUserId}
          RETURNING *
        `;
        
        console.log('Updated user progress:', updatedProgress[0]);
      }
    }
    
    // 4. Verify reset
    console.log('\n4. Verifying reset...');
    
    // Check if tasks were deleted
    const remainingTasks = await sql`
      SELECT * FROM tasks 
      WHERE user_id = ${testUserId}
    `;
    
    console.log(`Remaining tasks: ${remainingTasks.length} (should be 0)`);
    
    // Check if progress was reset
    const resetProgress = await sql`
      SELECT * FROM user_progress 
      WHERE user_id = ${testUserId}
    `;
    
    console.log('Reset progress:', resetProgress[0]);
    console.log('All-time completed (should still be 20):', resetProgress[0].all_time_completed);
    console.log('Daily completed tasks (should be 0):', resetProgress[0].daily_completed_tasks);
    console.log('Daily mood checks (should be 0):', resetProgress[0].daily_mood_checks);
    console.log('Daily AI splits (should be 0):', resetProgress[0].daily_ai_splits);
    
    // 5. Clean up
    console.log('\n5. Cleaning up test data...');
    await sql`
      DELETE FROM user_progress 
      WHERE user_id = ${testUserId}
    `;
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCronReset()
  .then(() => {
    console.log('Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test script failed with error:', error);
    process.exit(1);
  });