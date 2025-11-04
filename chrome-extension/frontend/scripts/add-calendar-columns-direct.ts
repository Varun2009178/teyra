import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCalendarColumns() {
  console.log('🗓️  Adding calendar integration columns...\n');

  try {
    // First, check current tasks table structure
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching tasks:', fetchError);
      return;
    }

    const sampleTask = tasks?.[0];
    console.log('📋 Current task structure:', sampleTask ? Object.keys(sampleTask) : 'No tasks found');

    // Test if columns already exist by trying to select them
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('id, scheduled_time, google_event_id, duration_minutes')
      .limit(1);

    if (testError) {
      console.log('⚠️  Columns may not exist yet. This is normal for first run.');
      console.log('   Error:', testError.message);
    } else {
      console.log('✅ Calendar columns may already exist!');
      if (testData && testData.length > 0) {
        console.log('   Sample:', testData[0]);
      }
    }

    console.log('\n🔧 To add these columns manually, run this SQL in your Supabase SQL Editor:\n');
    console.log('-------------------------------------------');
    console.log(`
-- Add columns to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON tasks(google_event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_time ON tasks(scheduled_time) WHERE scheduled_time IS NOT NULL;

-- Add columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_calendar_token JSONB,
  ADD COLUMN IF NOT EXISTS google_calendar_connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS calendar_sync_enabled BOOLEAN DEFAULT false;

-- Comment the columns
COMMENT ON COLUMN tasks.scheduled_time IS 'When the task is scheduled to be done';
COMMENT ON COLUMN tasks.google_event_id IS 'Linked Google Calendar event ID for two-way sync';
COMMENT ON COLUMN tasks.duration_minutes IS 'Estimated duration in minutes';
COMMENT ON COLUMN users.google_calendar_token IS 'Encrypted Google OAuth tokens';
COMMENT ON COLUMN users.google_calendar_connected_at IS 'When user connected Google Calendar';
COMMENT ON COLUMN users.calendar_sync_enabled IS 'Whether calendar sync is active';
    `);
    console.log('-------------------------------------------\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

addCalendarColumns();
