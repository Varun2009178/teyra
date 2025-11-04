import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  console.log('🔍 Checking if AI usage tracking columns exist...\n');

  try {
    // Try to select the columns - if they don't exist, this will error
    const { data, error } = await supabase
      .from('user_progress')
      .select('daily_mood_checks, daily_parses, ai_schedule_uses')
      .limit(1);

    if (error) {
      console.error('❌ Columns do NOT exist yet!\n');
      console.log('📝 You need to run this SQL in Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/sql\n');
      console.log('Copy and paste this SQL:\n');
      console.log('----------------------------------------');
      console.log('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_mood_checks INTEGER DEFAULT 0;');
      console.log('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_parses INTEGER DEFAULT 0;');
      console.log('ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS ai_schedule_uses INTEGER DEFAULT 0;');
      console.log('----------------------------------------\n');
      console.log('Or use the file: scripts/add-ai-usage-columns.sql\n');
      process.exit(1);
    }

    console.log('✅ All AI usage tracking columns exist!');
    console.log('   - daily_mood_checks ✓');
    console.log('   - daily_parses ✓');
    console.log('   - ai_schedule_uses ✓\n');

    // Check existing data
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('user_id, daily_mood_checks, daily_parses, ai_schedule_uses');

    if (allProgress) {
      console.log(`📊 Status: ${allProgress.length} user_progress records found`);
      const activeUsage = allProgress.filter(p =>
        (p.daily_mood_checks || 0) > 0 ||
        (p.daily_parses || 0) > 0 ||
        (p.ai_schedule_uses || 0) > 0
      );

      if (activeUsage.length > 0) {
        console.log(`   ${activeUsage.length} users have active AI usage today`);
      } else {
        console.log('   All AI usage counters at 0 (fresh or reset)');
      }
    }

    console.log('\n🎉 Migration is complete! Ready to test AI limits.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkColumns();
