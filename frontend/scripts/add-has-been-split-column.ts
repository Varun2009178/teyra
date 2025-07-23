import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function addHasBeenSplitColumn() {
  try {
    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log('Adding has_been_split column to tasks table...');
    
    // Add the column if it doesn't exist
    await sql`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS has_been_split BOOLEAN DEFAULT FALSE NOT NULL
    `;
    
    // Update existing tasks to have has_been_split = false
    await sql`
      UPDATE tasks 
      SET has_been_split = FALSE 
      WHERE has_been_split IS NULL
    `;
    
    console.log('✅ Successfully added has_been_split column to tasks table');
    
    // Verify the column was added
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'has_been_split'
    `;
    
    if (result.length > 0) {
      console.log('✅ Column verification successful:', result[0]);
    } else {
      console.log('❌ Column verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error adding has_been_split column:', error);
    throw error;
  }
}

// Run the script
addHasBeenSplitColumn()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 