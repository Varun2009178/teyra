import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { tasks, userProgress } from '../src/lib/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function testEmailSystem() {
  console.log('🧪 Testing email system...');
  
  const sql = neon(DB_URL);
  const db = drizzle(sql);
  
  const testUserId = `test_user_${Date.now()}`;
  
  try {
    // 1. Create test user with old reset date (24+ hours ago)
    console.log('\n1. Creating test user with expired timer...');
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    
    const [newUser] = await db
      .insert(userProgress)
      .values({
        userId: testUserId,
        completedTasks: 5,
        totalTasks: 10,
        allTimeCompleted: 15,
        mood: 'energized',
        dailyCompletedTasks: 5,
        dailyMoodChecks: 1,
        dailyAISplits: 2,
        lastResetDate: twentyFiveHoursAgo,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log('✅ Created test user with expired timer');
    
    // 2. Create some test tasks
    console.log('\n2. Creating test tasks...');
    const testTasks = [
      { title: 'Complete project proposal', completed: true },
      { title: 'Review code changes', completed: true },
      { title: 'Schedule team meeting', completed: false },
      { title: 'Update documentation', completed: false }
    ];
    
    for (const task of testTasks) {
      await db
        .insert(tasks)
        .values({
          userId: testUserId,
          title: task.title,
          completed: task.completed,
          hasBeenSplit: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
    
    console.log('✅ Created test tasks');
    
    // 3. Test the email cron logic
    console.log('\n3. Testing email cron logic...');
    
    // Simulate the cron job logic
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const usersNeedingReset = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, testUserId));
    
    const user = usersNeedingReset[0];
    const lastReset = user.lastResetDate || user.createdAt;
    const needsReset = lastReset < twentyFourHoursAgo;
    
    console.log(`User needs reset: ${needsReset}`);
    console.log(`Last reset: ${lastReset}`);
    console.log(`24 hours ago: ${twentyFourHoursAgo}`);
    
    if (needsReset) {
      console.log('✅ User qualifies for reset email!');
      
      // Get user's tasks for summary
      const userTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, testUserId));
      
      const completedTasks = userTasks.filter(task => task.completed);
      const incompleteTasks = userTasks.filter(task => !task.completed);
      
      console.log(`📊 Task summary:`);
      console.log(`  - Total: ${userTasks.length}`);
      console.log(`  - Completed: ${completedTasks.length}`);
      console.log(`  - Not completed: ${incompleteTasks.length}`);
      
      console.log(`  ✅ Completed tasks:`);
      completedTasks.forEach(task => console.log(`    - ${task.title}`));
      
      console.log(`  ❌ Not completed tasks:`);
      incompleteTasks.forEach(task => console.log(`    - ${task.title}`));
      
      console.log('\n📧 This user would receive a reset email with this summary!');
    } else {
      console.log('❌ User does not need reset yet');
    }
    
    // 4. Test 48-hour inactive user logic
    console.log('\n4. Testing 48-hour inactive user logic...');
    
    const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
    await db
      .update(userProgress)
      .set({ updatedAt: fiftyHoursAgo })
      .where(eq(userProgress.userId, testUserId));
    
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const updatedUser = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, testUserId));
    
    const lastActivity = updatedUser[0].updatedAt || updatedUser[0].createdAt;
    const isInactive = lastActivity < fortyEightHoursAgo;
    
    console.log(`User is inactive (48+ hours): ${isInactive}`);
    console.log(`Last activity: ${lastActivity}`);
    console.log(`48 hours ago: ${fortyEightHoursAgo}`);
    
    if (isInactive) {
      console.log('✅ User qualifies for motivational email!');
    } else {
      console.log('❌ User is still active');
    }
    
    console.log('\n🎉 Email system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    try {
      await db.delete(tasks).where(eq(tasks.userId, testUserId));
      await db.delete(userProgress).where(eq(userProgress.userId, testUserId));
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

testEmailSystem()
  .then(() => console.log('Test completed'))
  .catch(console.error); 