import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function fixDatabaseSchema() {
  try {
    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log('Checking and fixing database schema...');
    
    // 1. Check and fix tasks table
    console.log('Checking tasks table...');
    const tasksExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      )
    `;
    
    if (!tasksExists[0].exists) {
      console.log('Creating tasks table...');
      await sql`
        CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          title TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          has_been_split BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
      console.log('✅ Tasks table created');
    } else {
      console.log('Tasks table exists, checking columns...');
      
      // Check has_been_split column
      const hasBeenSplitExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'tasks' 
          AND column_name = 'has_been_split'
        )
      `;
      
      if (!hasBeenSplitExists[0].exists) {
        console.log('Adding has_been_split column...');
        await sql`
          ALTER TABLE tasks 
          ADD COLUMN has_been_split BOOLEAN NOT NULL DEFAULT FALSE
        `;
        console.log('✅ has_been_split column added');
      } else {
        console.log('✅ has_been_split column exists');
      }
    }
    
    // 2. Check and fix user_progress table
    console.log('\nChecking user_progress table...');
    const userProgressExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_progress'
      )
    `;
    
    if (!userProgressExists[0].exists) {
      console.log('Creating user_progress table...');
      await sql`
        CREATE TABLE user_progress (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL UNIQUE,
          completed_tasks INTEGER NOT NULL DEFAULT 0,
          total_tasks INTEGER NOT NULL DEFAULT 0,
          all_time_completed INTEGER NOT NULL DEFAULT 0,
          mood VARCHAR(50) NOT NULL DEFAULT 'overwhelmed',
          daily_completed_tasks INTEGER NOT NULL DEFAULT 0,
          daily_mood_checks INTEGER NOT NULL DEFAULT 0,
          daily_ai_splits INTEGER NOT NULL DEFAULT 0,
          last_reset_date TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
      console.log('✅ user_progress table created');
    } else {
      console.log('user_progress table exists, checking columns...');
      
      // Check all_time_completed column
      const allTimeCompletedExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'user_progress' 
          AND column_name = 'all_time_completed'
        )
      `;
      
      if (!allTimeCompletedExists[0].exists) {
        console.log('Adding all_time_completed column...');
        await sql`
          ALTER TABLE user_progress 
          ADD COLUMN all_time_completed INTEGER NOT NULL DEFAULT 0
        `;
        console.log('✅ all_time_completed column added');
      } else {
        console.log('✅ all_time_completed column exists');
      }
      
      // Check daily_completed_tasks column
      const dailyCompletedTasksExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'user_progress' 
          AND column_name = 'daily_completed_tasks'
        )
      `;
      
      if (!dailyCompletedTasksExists[0].exists) {
        console.log('Adding daily_completed_tasks column...');
        await sql`
          ALTER TABLE user_progress 
          ADD COLUMN daily_completed_tasks INTEGER NOT NULL DEFAULT 0
        `;
        console.log('✅ daily_completed_tasks column added');
      } else {
        console.log('✅ daily_completed_tasks column exists');
      }
      
      // Check daily_mood_checks column
      const dailyMoodChecksExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'user_progress' 
          AND column_name = 'daily_mood_checks'
        )
      `;
      
      if (!dailyMoodChecksExists[0].exists) {
        console.log('Adding daily_mood_checks column...');
        await sql`
          ALTER TABLE user_progress 
          ADD COLUMN daily_mood_checks INTEGER NOT NULL DEFAULT 0
        `;
        console.log('✅ daily_mood_checks column added');
      } else {
        console.log('✅ daily_mood_checks column exists');
      }
      
      // Check daily_ai_splits column
      const dailyAISplitsExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'user_progress' 
          AND column_name = 'daily_ai_splits'
        )
      `;
      
      if (!dailyAISplitsExists[0].exists) {
        console.log('Adding daily_ai_splits column...');
        await sql`
          ALTER TABLE user_progress 
          ADD COLUMN daily_ai_splits INTEGER NOT NULL DEFAULT 0
        `;
        console.log('✅ daily_ai_splits column added');
      } else {
        console.log('✅ daily_ai_splits column exists');
      }
      
      // Check last_reset_date column
      const lastResetDateExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'user_progress' 
          AND column_name = 'last_reset_date'
        )
      `;
      
      if (!lastResetDateExists[0].exists) {
        console.log('Adding last_reset_date column...');
        await sql`
          ALTER TABLE user_progress 
          ADD COLUMN last_reset_date TIMESTAMP NOT NULL DEFAULT NOW()
        `;
        console.log('✅ last_reset_date column added');
      } else {
        console.log('✅ last_reset_date column exists');
      }
    }
    
    // 3. Create indexes for better performance
    console.log('\nCreating or checking indexes...');
    
    // Tasks indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`;
    
    // User progress indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)`;
    
    console.log('✅ Indexes created or already exist');
    
    console.log('\n✅ Database schema check and fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    throw error;
  }
}

// Run the script
fixDatabaseSchema()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });