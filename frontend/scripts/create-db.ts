import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/schema';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// This script creates the database tables
async function main() {
  // Get the direct database URL from environment variables
  const directUrl = process.env.DIRECT_URL;
  
  if (!directUrl) {
    console.error('DIRECT_URL environment variable is not set');
    console.log('Please set both DATABASE_URL and DIRECT_URL in your .env.local file');
    process.exit(1);
  }

  try {
    console.log('Connecting to database using direct connection...');
    
    // Use direct connection for schema operations
    const sql = neon(directUrl);
    const db = drizzle(sql);

    console.log('Creating tables...');
    
    // Create tables one by one (Neon doesn't support multiple commands in a single prepared statement)
    console.log('Creating tasks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        has_been_split BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    
    console.log('Creating user_progress table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        completed_tasks INTEGER NOT NULL DEFAULT 0,
        total_tasks INTEGER NOT NULL DEFAULT 0,
        all_time_completed INTEGER NOT NULL DEFAULT 0,
        mood VARCHAR(50) NOT NULL DEFAULT 'overwhelmed',
        daily_completed_tasks INTEGER NOT NULL DEFAULT 0,
        daily_mood_checks INTEGER NOT NULL DEFAULT 0,
        daily_ai_splits INTEGER NOT NULL DEFAULT 0,
        last_reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    
    // Create indexes separately
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)`;
    
    // Create trigger function if it doesn't exist
    console.log('Creating trigger function...');
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    
    // Create triggers
    console.log('Creating triggers...');
    await sql`
      CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;
    await sql`
      CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;
    
    console.log('Database setup complete!');
    console.log('You can now run your application with: npm run dev');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main();