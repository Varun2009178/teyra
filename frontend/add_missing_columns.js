import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to user_progress table...');
  
  try {
    // Add total_tasks_completed column for cactus milestones
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0;'
    });
    
    if (error1) {
      console.log('Note: total_tasks_completed column might already exist or there was an issue:', error1.message);
    } else {
      console.log('✅ Added total_tasks_completed column');
    }
    
    // Add stored_tasks_completed column for progress points
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS stored_tasks_completed INTEGER DEFAULT 0;'
    });
    
    if (error2) {
      console.log('Note: stored_tasks_completed column might already exist or there was an issue:', error2.message);
    } else {
      console.log('✅ Added stored_tasks_completed column');
    }
    
    // Add tasks_completed_today column
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS tasks_completed_today INTEGER DEFAULT 0;'
    });
    
    if (error3) {
      console.log('Note: tasks_completed_today column might already exist or there was an issue:', error3.message);
    } else {
      console.log('✅ Added tasks_completed_today column');
    }
    
    // Add last_reset_email_sent column
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_reset_email_sent TIMESTAMP WITH TIME ZONE;'
    });
    
    if (error4) {
      console.log('Note: last_reset_email_sent column might already exist or there was an issue:', error4.message);
    } else {
      console.log('✅ Added last_reset_email_sent column');
    }
    
    console.log('🎉 Schema update complete!');
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
  }
}

addMissingColumns();
