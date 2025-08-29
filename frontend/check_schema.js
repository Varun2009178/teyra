import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking user_progress table schema...');
  
  // Try to get one record to see the available fields
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .limit(1)
    .single();
    
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Available fields:', Object.keys(data || {}));
    console.log('📊 Sample data:', data);
  }
}

checkSchema();
