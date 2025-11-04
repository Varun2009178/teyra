import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  console.log('🔧 Creating behavior tracking tables...');

  // First, let's check existing tables
  const { data: tables, error: listError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  console.log('📋 Existing tables:', tables?.map(t => t.table_name) || []);

  // Try to create behavior events table by inserting a test record
  console.log('🧪 Testing behavior events table...');
  const { data, error } = await supabase
    .from('user_behavior_events')
    .select('count')
    .limit(1);

  if (error && error.message.includes('does not exist')) {
    console.log('❌ user_behavior_events table does not exist');
    console.log('Please create it manually in Supabase SQL editor:');
    console.log(`
CREATE TABLE user_behavior_events (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  task_id INTEGER,
  mood TEXT,
  completion_time TIMESTAMP,
  time_of_day INTEGER,
  device_type TEXT DEFAULT 'unknown',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_behavior_analysis (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  task_completion_rate INTEGER DEFAULT 0,
  productive_hours INTEGER[] DEFAULT '{}',
  common_moods TEXT[] DEFAULT '{}',
  notification_responsiveness INTEGER DEFAULT 0,
  task_patterns JSONB DEFAULT '{}',
  behavioral_insights TEXT[] DEFAULT '{}',
  last_analyzed TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_behavior_events_user_id ON user_behavior_events(user_id);
CREATE INDEX idx_behavior_events_event_type ON user_behavior_events(event_type);
    `);
  } else {
    console.log('✅ user_behavior_events table exists');
  }

  // Test behavior analysis table
  const { data: analysisData, error: analysisError } = await supabase
    .from('user_behavior_analysis')
    .select('count')
    .limit(1);

  if (analysisError && analysisError.message.includes('does not exist')) {
    console.log('❌ user_behavior_analysis table does not exist');
  } else {
    console.log('✅ user_behavior_analysis table exists');
  }
}

createTables().catch(console.error);