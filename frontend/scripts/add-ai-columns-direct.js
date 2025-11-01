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

async function addColumns() {
  console.log('🚀 Adding AI usage tracking columns...\n');

  // Run each ALTER TABLE command separately
  const columns = [
    { name: 'daily_mood_checks', sql: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_mood_checks INTEGER DEFAULT 0;' },
    { name: 'daily_parses', sql: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_parses INTEGER DEFAULT 0;' },
    { name: 'ai_schedule_uses', sql: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS ai_schedule_uses INTEGER DEFAULT 0;' }
  ];

  for (const column of columns) {
    console.log(`➡️  Adding ${column.name}...`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: column.sql });

    if (error) {
      console.error(`❌ Error adding ${column.name}:`, error.message);
      // Try alternative approach - direct SQL via query
      console.log('   Trying alternative method...');
      const { error: error2 } = await supabase.from('user_progress').select('daily_mood_checks, daily_parses, ai_schedule_uses').limit(1);

      if (error2 && error2.message.includes('column')) {
        console.error(`   Still failing. You need to run this SQL manually in Supabase SQL Editor:`);
        console.error(`   ${column.sql}\n`);
        continue;
      }
    }

    console.log(`✅ ${column.name} added successfully\n`);
  }

  // Verify
  console.log('🔍 Verifying columns exist...');
  const { data, error } = await supabase
    .from('user_progress')
    .select('daily_mood_checks, daily_parses, ai_schedule_uses')
    .limit(1);

  if (error) {
    console.error('\n❌ Verification failed!');
    console.error('Please run the SQL manually in Supabase SQL Editor:');
    console.error('https://supabase.com/dashboard/project/YOUR_PROJECT/sql\n');
    console.error('SQL to run:');
    console.error('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_mood_checks INTEGER DEFAULT 0;');
    console.error('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_parses INTEGER DEFAULT 0;');
    console.error('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS ai_schedule_uses INTEGER DEFAULT 0;');
    process.exit(1);
  }

  console.log('✅ All columns verified!\n');
  console.log('🎉 Migration complete!\n');
}

addColumns();
