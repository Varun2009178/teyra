// Script to add ai_schedule_uses column to user_progress table
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAiScheduleColumn() {
  try {
    console.log('🔧 Adding ai_schedule_uses column to user_progress table...');

    // Note: This runs a SQL command to add the column
    // You'll need to run this SQL in Supabase SQL Editor:
    const sql = `
      -- Add ai_schedule_uses column if it doesn't exist
      ALTER TABLE user_progress
      ADD COLUMN IF NOT EXISTS ai_schedule_uses INTEGER DEFAULT 0;

      -- Update existing rows to have 0 uses
      UPDATE user_progress
      SET ai_schedule_uses = 0
      WHERE ai_schedule_uses IS NULL;
    `;

    console.log('\n📋 Please run this SQL in your Supabase SQL Editor:\n');
    console.log(sql);
    console.log('\n✅ Or run it programmatically if you have admin access');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addAiScheduleColumn();
