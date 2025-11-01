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

async function runMigration() {
  console.log('🚀 Running AI usage tracking migration...\n');

  try {
    // Add daily_mood_checks column
    console.log('➡️  Adding daily_mood_checks column...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_mood_checks INTEGER DEFAULT 0;'
    }).catch(async () => {
      // Fallback: try direct SQL execution
      return await supabase.from('user_progress').select('daily_mood_checks').limit(1);
    });

    // Add daily_parses column
    console.log('➡️  Adding daily_parses column...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_parses INTEGER DEFAULT 0;'
    }).catch(async () => {
      return await supabase.from('user_progress').select('daily_parses').limit(1);
    });

    // Add ai_schedule_uses column
    console.log('➡️  Adding ai_schedule_uses column...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS ai_schedule_uses INTEGER DEFAULT 0;'
    }).catch(async () => {
      return await supabase.from('user_progress').select('ai_schedule_uses').limit(1);
    });

    // Verify columns were added
    console.log('\n🔍 Verifying columns...');
    const { data: testData, error: verifyError } = await supabase
      .from('user_progress')
      .select('daily_mood_checks, daily_parses, ai_schedule_uses')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      console.log('\n⚠️  Migration may have failed. Please run the SQL manually in Supabase SQL editor:');
      console.log('   File: scripts/add-ai-usage-columns.sql\n');
      process.exit(1);
    }

    console.log('✅ Columns verified successfully!');
    console.log('   - daily_mood_checks ✓');
    console.log('   - daily_parses ✓');
    console.log('   - ai_schedule_uses ✓');

    // Check existing data
    const { data: allProgress, error: countError } = await supabase
      .from('user_progress')
      .select('user_id, daily_mood_checks, daily_parses, ai_schedule_uses');

    if (!countError && allProgress) {
      console.log(`\n📊 Found ${allProgress.length} user_progress records`);
      const needsReset = allProgress.filter(p =>
        (p.daily_mood_checks || 0) > 0 ||
        (p.daily_parses || 0) > 0 ||
        (p.ai_schedule_uses || 0) > 0
      ).length;

      if (needsReset > 0) {
        console.log(`   ${needsReset} users have existing AI usage (will reset tomorrow)`);
      } else {
        console.log('   All counters are at 0 (fresh start)');
      }
    }

    console.log('\n🎉 AI usage tracking migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. ✅ Database schema updated');
    console.log('2. ✅ Unified modal ready');
    console.log('3. ⏳ Test the limits in your app');
    console.log('4. ⏳ Decide on Pro tier limits (10x recommended vs unlimited)\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n⚠️  Please run the SQL manually in Supabase SQL editor:');
    console.log('   File: scripts/add-ai-usage-columns.sql\n');
    process.exit(1);
  }
}

runMigration();
