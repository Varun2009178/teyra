import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAIRequestLogTable() {
  try {
    console.log('🔄 Creating ai_request_log table...');
    console.log('\nℹ️ Please run this SQL in your Supabase SQL Editor:\n');
    console.log('---SQL TO RUN---\n');
    console.log(`-- Create table to track AI requests for rate limiting
CREATE TABLE IF NOT EXISTS ai_request_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_request_log_user_date
ON ai_request_log(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE ai_request_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own requests
CREATE POLICY "Users can view own requests"
ON ai_request_log FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own requests
CREATE POLICY "Users can insert own requests"
ON ai_request_log FOR INSERT
WITH CHECK (auth.uid()::text = user_id);
`);
    console.log('\n---END SQL---\n');

    console.log('✅ Copy the SQL above and run it in Supabase SQL Editor!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAIRequestLogTable();
