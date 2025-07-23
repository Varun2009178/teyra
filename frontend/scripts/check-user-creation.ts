import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get database URL from environment variables
const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function checkUserCreation() {
  try {
    console.log('Connecting to database...');
    const sql = neon(DB_URL);
    
    // Check connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('Database connection successful. Current time:', result[0].current_time);
    
    // Check user_progress table
    console.log('\nChecking user_progress table...');
    const userProgressTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_progress'
      )
    `;
    
    if (!userProgressTable[0].exists) {
      console.error('❌ user_progress table does not exist!');
      return;
    }
    
    console.log('✅ user_progress table exists');
    
    // Check users in the table
    const users = await sql`SELECT * FROM user_progress`;
    console.log(`Found ${users.length} users in the database:`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  User ID: ${user.user_id}`);
      console.log(`  Mood: ${user.mood}`);
      console.log(`  All-time completed: ${user.all_time_completed}`);
      console.log(`  Created at: ${user.created_at}`);
      console.log('---');
    });
    
    // Create a test user if needed
    if (users.length === 0) {
      console.log('\nNo users found. Creating a test user...');
      
      const testUserId = `test_user_${Date.now()}`;
      const newUser = await sql`
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
          0, 
          0, 
          0, 
          'neutral', 
          0, 
          0, 
          0, 
          ${new Date().toISOString()}, 
          ${new Date().toISOString()}, 
          ${new Date().toISOString()}
        )
        RETURNING *
      `;
      
      console.log('✅ Test user created:', newUser[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkUserCreation()
  .then(() => console.log('Check completed'))
  .catch(console.error);