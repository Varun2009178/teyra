import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addProColumns() {
  try {
    console.log('🔄 Adding Pro subscription columns to user_progress table...');

    // Use Supabase RPC to execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE user_progress
        ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
        ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
        ADD COLUMN IF NOT EXISTS pro_since TIMESTAMP WITH TIME ZONE;
      `
    });

    if (error) {
      // If RPC doesn't exist, we need to add columns via SQL editor in Supabase dashboard
      console.log('ℹ️ Cannot add columns via API. Please run this SQL in your Supabase SQL Editor:');
      console.log('\n---SQL TO RUN---\n');
      console.log(`ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS pro_since TIMESTAMP WITH TIME ZONE;`);
      console.log('\n---END SQL---\n');
    } else {
      console.log('✅ Successfully added Pro subscription columns!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\nℹ️ Please run this SQL in your Supabase SQL Editor:');
    console.log('\n---SQL TO RUN---\n');
    console.log(`ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS pro_since TIMESTAMP WITH TIME ZONE;`);
    console.log('\n---END SQL---\n');
  }
}

addProColumns();
