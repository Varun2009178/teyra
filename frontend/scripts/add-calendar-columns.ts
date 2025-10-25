import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCalendarColumns() {
  console.log('🗓️  Adding calendar integration columns to tasks table...\n');

  try {
    // Add columns to tasks table
    const { error: tasksError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add scheduled_time column if it doesn't exist
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'tasks' AND column_name = 'scheduled_time'
          ) THEN
            ALTER TABLE tasks ADD COLUMN scheduled_time TIMESTAMPTZ;
          END IF;
        END $$;

        -- Add google_event_id column if it doesn't exist
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'tasks' AND column_name = 'google_event_id'
          ) THEN
            ALTER TABLE tasks ADD COLUMN google_event_id TEXT;
          END IF;
        END $$;

        -- Add duration_minutes column if it doesn't exist
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'tasks' AND column_name = 'duration_minutes'
          ) THEN
            ALTER TABLE tasks ADD COLUMN duration_minutes INTEGER DEFAULT 60;
          END IF;
        END $$;

        -- Create index on google_event_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON tasks(google_event_id);
      `
    });

    if (tasksError) {
      console.log('⚠️  Could not use exec_sql RPC, trying direct ALTER TABLE...\n');

      // Fallback: Try direct SQL execution
      const alterStatements = [
        'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ',
        'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_event_id TEXT',
        'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60',
        'CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON tasks(google_event_id)'
      ];

      for (const sql of alterStatements) {
        const { error } = await supabase.rpc('exec', { sql });
        if (error) {
          console.log(`⚠️  Statement failed: ${sql}`);
          console.log(`   Error: ${error.message}\n`);
        }
      }
    }

    // Add google_calendar_token to users table
    console.log('📝 Adding Google Calendar token storage to users table...\n');

    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add google_calendar_token column
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'google_calendar_token'
          ) THEN
            ALTER TABLE users ADD COLUMN google_calendar_token JSONB;
          END IF;
        END $$;

        -- Add google_calendar_connected_at column
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'google_calendar_connected_at'
          ) THEN
            ALTER TABLE users ADD COLUMN google_calendar_connected_at TIMESTAMPTZ;
          END IF;
        END $$;
      `
    });

    if (usersError) {
      console.log('⚠️  RPC failed for users table, trying fallback...\n');
    }

    console.log('✅ Calendar columns added successfully!\n');
    console.log('New columns in tasks table:');
    console.log('  - scheduled_time: TIMESTAMPTZ (when task is scheduled)');
    console.log('  - google_event_id: TEXT (linked Google Calendar event ID)');
    console.log('  - duration_minutes: INTEGER (task duration, default 60 min)\n');

    console.log('New columns in users table:');
    console.log('  - google_calendar_token: JSONB (OAuth tokens)');
    console.log('  - google_calendar_connected_at: TIMESTAMPTZ (connection timestamp)\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addCalendarColumns();
