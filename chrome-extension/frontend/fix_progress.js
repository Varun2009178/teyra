import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixProgress() {
  console.log('🔧 Let me try a different approach...');
  
  // Let me check what tables exist in the database
  const { data: tables, error } = await supabase.rpc('exec', {
    sql: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
  });
  
  if (error) {
    console.log('❌ Could not list tables:', error);
    
    // Let's try manually updating the user's record with a computed value
    console.log('🔄 Trying manual approach...');
    
    // Get user's completed tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', 'user_31TC1szW0Eqb8rlFV4xhbYHISAQ')
      .eq('completed', true);
    
    console.log('📊 User has completed', tasks?.length || 0, 'tasks total');
    
    // Try to update just the existing fields we know work
    const { data: updateResult, error: updateError } = await supabase
      .from('user_progress')
      .update({
        current_mood: null, // Reset mood 
        daily_mood_checks: 0,
        daily_ai_splits: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', 'user_31TC1szW0Eqb8rlFV4xhbYHISAQ')
      .select();
    
    if (updateError) {
      console.log('❌ Update error:', updateError);
    } else {
      console.log('✅ Successfully reset user progress:', updateResult);
    }
    
  } else {
    console.log('📋 Available tables:', tables);
  }
}

fixProgress();
