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

async function verifyConnection() {
  try {
    console.log('Testing database connection with hard-coded URL...');
    
    // Create SQL client with hard-coded URL
    const sql = neon(DB_URL);
    
    // Test a simple query
    console.log('Executing test query...');
    const result = await sql`SELECT NOW() as current_time`;
    
    console.log('✅ Connection successful!');
    console.log('Current server time:', result[0].current_time);
    
    // Check if tables exist
    console.log('\nChecking database tables...');
    
    const tasksTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      )
    `;
    
    console.log('Tasks table exists:', tasksTable[0].exists);
    
    const userProgressTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_progress'
      )
    `;
    
    console.log('User progress table exists:', userProgressTable[0].exists);
    
    console.log('\n✅ Database verification complete!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

// Run the verification
verifyConnection()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed with error:', error);
    process.exit(1);
  });