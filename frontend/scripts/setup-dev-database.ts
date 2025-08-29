#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.development');
dotenv.config({ path: envPath });

// Fallback to .env.local if .env.development doesn't exist
if (!process.env.DEV_SUPABASE_URL) {
  const localEnvPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: localEnvPath });
}

import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const requiredEnvVars = [
  'DEV_SUPABASE_URL',
  'DEV_SUPABASE_ANON_KEY'
];

console.log('🔍 Checking development environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required development environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Please create a .env.development file with your development Supabase credentials.');
  console.error('📝 See setup-dev-environment.ts for instructions.');
  process.exit(1);
}

// Initialize development Supabase client
const supabase = createClient(
  process.env.DEV_SUPABASE_URL!,
  process.env.DEV_SUPABASE_ANON_KEY!
);

async function setupDevelopmentDatabase() {
  console.log('🚀 Setting up development database...\n');
  
  try {
    // Test connection
    console.log('🔗 Testing connection to development database...');
    
    // Test connection by trying to access a non-existent table
    // This will fail with a "does not exist" error if connection is working
    const { data, error } = await supabase.from('_dummy_test_').select('*').limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        // This is expected - table doesn't exist, but connection works
        console.log('✅ Successfully connected to development database\n');
      } else if (error.message.includes('JWT') || error.message.includes('invalid')) {
        console.error('❌ Authentication error - check your DEV_SUPABASE_ANON_KEY');
        console.error('   Make sure you copied the "anon public" key, not the service role key');
        process.exit(1);
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        console.error('❌ Network error - check your DEV_SUPABASE_URL');
        console.error('   Make sure the URL is correct and includes https://');
        process.exit(1);
      } else {
        console.error('❌ Cannot connect to development database:', error.message);
        console.error('💡 Please check your DEV_SUPABASE_URL and DEV_SUPABASE_ANON_KEY');
        console.error('   URL should look like: https://your-project.supabase.co');
        console.error('   Key should start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
        process.exit(1);
      }
    } else {
      console.log('✅ Successfully connected to development database\n');
    }

    // Create tables
    console.log('📋 Creating database tables...');
    
    // Since we can't execute raw SQL through the client, we'll create tables
    // by trying to insert data and letting Supabase create them automatically
    // or by providing instructions for manual creation
    
    console.log('ℹ️  Tables will need to be created manually in the Supabase dashboard.');
    console.log('   Please follow these steps:');
    console.log('');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run the following SQL:');
    console.log('');
    
    const createTablesSQL = `
-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  has_been_split BOOLEAN DEFAULT FALSE,
  limit_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  current_mood TEXT,
  daily_mood_checks INTEGER DEFAULT 0,
  daily_ai_splits INTEGER DEFAULT 0,
  last_mood_update TIMESTAMP WITH TIME ZONE,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  daily_start_time TIME,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_checkins table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  emotional_state TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moods table
CREATE TABLE IF NOT EXISTS moods (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  mood TEXT NOT NULL,
  intensity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at 
  BEFORE UPDATE ON user_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;
    
    console.log(createTablesSQL);
    console.log('');
    console.log('   4. After running the SQL, come back and run:');
    console.log('      npm run test:dev-env');
    console.log('');
    
    // Try to test if tables exist
    console.log('🔍 Checking if tables already exist...');
    const tables = ['tasks', 'user_progress', 'daily_checkins', 'moods'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact' });
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`   ❌ ${table} table does not exist`);
          } else {
            console.log(`   ⚠️  ${table} table check failed: ${error.message}`);
          }
        } else {
          console.log(`   ✅ ${table} table exists (${data || 0} records)`);
        }
      } catch (err) {
        console.log(`   ❌ ${table} table does not exist`);
      }
    }

    // Enable Row Level Security
    console.log('\n🔒 Row Level Security Setup:');
    console.log('   After creating the tables, you\'ll need to set up RLS policies.');
    console.log('   Run this additional SQL in the Supabase dashboard:');
    console.log('');
    
    const rlsSQL = `
-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks table
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks
  AS PERMISSIVE FOR SELECT TO public
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks" ON tasks
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks
  AS PERMISSIVE FOR UPDATE TO public
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks
  AS PERMISSIVE FOR DELETE TO public
  USING (auth.uid()::text = user_id);

-- Create policies for user_progress table
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
CREATE POLICY "Users can view own progress" ON user_progress
  AS PERMISSIVE FOR SELECT TO public
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
CREATE POLICY "Users can insert own progress" ON user_progress
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
CREATE POLICY "Users can update own progress" ON user_progress
  AS PERMISSIVE FOR UPDATE TO public
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own progress" ON user_progress;
CREATE POLICY "Users can delete own progress" ON user_progress
  AS PERMISSIVE FOR DELETE TO public
  USING (auth.uid()::text = user_id);

-- Create policies for daily_checkins table
DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
CREATE POLICY "Users can view own checkins" ON daily_checkins
  AS PERMISSIVE FOR SELECT TO public
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own checkins" ON daily_checkins;
CREATE POLICY "Users can insert own checkins" ON daily_checkins
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own checkins" ON daily_checkins;
CREATE POLICY "Users can update own checkins" ON daily_checkins
  AS PERMISSIVE FOR UPDATE TO public
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own checkins" ON daily_checkins;
CREATE POLICY "Users can delete own checkins" ON daily_checkins
  AS PERMISSIVE FOR DELETE TO public
  USING (auth.uid()::text = user_id);

-- Create policies for moods table
DROP POLICY IF EXISTS "Users can view own moods" ON moods;
CREATE POLICY "Users can view own moods" ON moods
  AS PERMISSIVE FOR SELECT TO public
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own moods" ON moods;
CREATE POLICY "Users can insert own moods" ON moods
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own moods" ON moods;
CREATE POLICY "Users can update own moods" ON moods
  AS PERMISSIVE FOR UPDATE TO public
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own moods" ON moods;
CREATE POLICY "Users can delete own moods" ON moods
  AS PERMISSIVE FOR DELETE TO public
  USING (auth.uid()::text = user_id);
`;
    
    console.log(rlsSQL);
    console.log('');
    console.log('   Note: RLS policies are important for security. Make sure to set them up!');

    // Test the setup
    console.log('\n🧪 Testing database setup...');
    
    const testResults = await Promise.allSettled([
      supabase.from('tasks').select('count', { count: 'exact' }),
      supabase.from('user_progress').select('count', { count: 'exact' }),
      supabase.from('daily_checkins').select('count', { count: 'exact' }),
      supabase.from('moods').select('count', { count: 'exact' })
    ]);

    const tableNames = ['tasks', 'user_progress', 'daily_checkins', 'moods'];
    let allTestsPassed = true;

    testResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${tableNames[index]} table is accessible`);
      } else {
        console.error(`❌ ${tableNames[index]} table test failed:`, result.reason);
        allTestsPassed = false;
      }
    });

    if (allTestsPassed) {
      console.log('\n🎉 Development database setup completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Run "npm run test:dev-env" to verify everything works');
      console.log('   2. Start development with "npm run dev"');
      console.log('   3. Test user sync with "npm run user-sync analyze"');
    } else {
      console.log('\n⚠️  Some tables are missing. Please:');
      console.log('   1. Copy the SQL above and run it in your Supabase dashboard');
      console.log('   2. Run "npm run test:dev-env" to verify everything works');
      console.log('   3. Start development with "npm run dev"');
    }

  } catch (error) {
    console.error('❌ Error setting up development database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDevelopmentDatabase()
  .then(() => {
    console.log('\n✅ Setup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup script failed:', error);
    process.exit(1);
  });
