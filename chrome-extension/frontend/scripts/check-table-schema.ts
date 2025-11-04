import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function checkTableSchema() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Check user_progress table structure by trying to select
    console.log('🔍 Checking user_progress table schema...');
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ user_progress table accessible');
      console.log('📋 Sample record keys:', data?.[0] ? Object.keys(data[0]) : 'No records');
    }

    // Check tasks table
    console.log('\n🔍 Checking tasks table schema...');
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);

    if (taskError) {
      console.error('❌ Error:', taskError);
    } else {
      console.log('✅ tasks table accessible');
      console.log('📋 Sample record keys:', taskData?.[0] ? Object.keys(taskData[0]) : 'No records');
    }

  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

checkTableSchema().catch(console.error);