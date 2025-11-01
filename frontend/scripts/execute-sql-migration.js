import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running AI usage column migration...\n');

  // Try to select with new columns - if it fails, they don't exist
  const { data, error } = await supabase
    .from('user_progress')
    .select('daily_mood_checks, daily_parses, ai_schedule_uses')
    .limit(1);

  if (error) {
    console.error('❌ Columns do NOT exist yet!\n');
    console.log('Please run this SQL in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/YOUR_PROJECT/sql\n');
    console.log('Copy and paste:\n');
    console.log('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_mood_checks INTEGER DEFAULT 0;');
    console.log('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_parses INTEGER DEFAULT 0;');
    console.log('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS ai_schedule_uses INTEGER DEFAULT 0;\n');
    process.exit(1);
  }

  console.log('✅ All AI usage columns already exist!');
  console.log('   - daily_mood_checks ✓');
  console.log('   - daily_parses ✓');
  console.log('   - ai_schedule_uses ✓\n');
  console.log('🎉 Migration already complete!\n');
}

runMigration();
