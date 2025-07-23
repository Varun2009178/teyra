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

async function verifyProductionDb() {
  try {
    console.log('Connecting to production database...');
    const sql = neon(DB_URL);
    
    // Check connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('Database connection successful. Current time:', result[0].current_time);
    
    // Check tables
    console.log('\nChecking database tables...');
    
    // Check tasks table
    const tasksTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      )
    `;
    
    console.log('Tasks table exists:', tasksTable[0].exists);
    
    if (tasksTable[0].exists) {
      // Check tasks table structure
      const tasksColumns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tasks'
      `;
      console.log('Tasks table columns:', tasksColumns.map(col => `${col.column_name} (${col.data_type})`).join(', '));
      
      // Count tasks
      const tasksCount = await sql`SELECT COUNT(*) FROM tasks`;
      console.log('Total tasks in database:', tasksCount[0].count);
    }
    
    // Check user_progress table
    const userProgressTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_progress'
      )
    `;
    
    console.log('User progress table exists:', userProgressTable[0].exists);
    
    if (userProgressTable[0].exists) {
      // Check user_progress table structure
      const userProgressColumns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_progress'
      `;
      console.log('User progress table columns:', userProgressColumns.map(col => `${col.column_name} (${col.data_type})`).join(', '));
      
      // Count users
      const usersCount = await sql`SELECT COUNT(*) FROM user_progress`;
      console.log('Total users in database:', usersCount[0].count);
      
      // List users
      if (parseInt(usersCount[0].count) > 0) {
        const users = await sql`SELECT user_id, mood, all_time_completed, created_at FROM user_progress`;
        console.log('\nUsers in database:');
        users.forEach((user, index) => {
          console.log(`User ${index + 1}:`);
          console.log(`  User ID: ${user.user_id}`);
          console.log(`  Mood: ${user.mood}`);
          console.log(`  All-time completed: ${user.all_time_completed}`);
          console.log(`  Created at: ${user.created_at}`);
          console.log('---');
        });
      }
    }
    
  } catch (error) {
    console.error('Error verifying production database:', error);
  }
}

// Run the verification
verifyProductionDb()
  .then(() => console.log('Verification completed'))
  .catch(console.error);