import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testNeonConnection() {
  try {
    console.log('Testing Neon DB connection...');
    
    // Check if environment variables are set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('DATABASE_URL is set');
    
    // Test connection
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    // Test a simple query
    console.log('Executing test query...');
    const result = await sql`SELECT NOW() as current_time`;
    
    console.log('Connection successful!');
    console.log('Current server time:', result[0].current_time);
    
    // Test schema tables
    console.log('\nChecking database tables...');
    
    // Check tasks table
    try {
      const tasksResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'tasks'
        )
      `;
      console.log('Tasks table exists:', tasksResult[0].exists);
      
      if (tasksResult[0].exists) {
        // Check tasks table structure
        const tasksColumns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'tasks'
        `;
        console.log('Tasks table columns:', tasksColumns);
      }
    } catch (error) {
      console.error('Error checking tasks table:', error);
    }
    
    // Check user_progress table
    try {
      const progressResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_progress'
        )
      `;
      console.log('User_progress table exists:', progressResult[0].exists);
      
      if (progressResult[0].exists) {
        // Check user_progress table structure
        const progressColumns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'user_progress'
        `;
        console.log('User_progress table columns:', progressColumns);
      }
    } catch (error) {
      console.error('Error checking user_progress table:', error);
    }
    
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

// Run the test
testNeonConnection()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });