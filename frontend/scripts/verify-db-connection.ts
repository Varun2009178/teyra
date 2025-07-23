import { neon } from '@neondatabase/serverless';

// Hard-coded database URL for testing
const DB_URL = "postgresql://neondb_owner:npg_ps5BtDme1Yfk@ep-empty-rice-aeos99ao-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

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