import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearMoodCompletely() {
  console.log('🔄 Completely clearing mood system for user...');
  
  // Reset mood in database
  const { data, error } = await supabase
    .from('user_progress')
    .update({
      current_mood: null,
      daily_mood_checks: 0,
      daily_ai_splits: 0,
      is_locked: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', 'user_31TC1szW0Eqb8rlFV4xhbYHISAQ')
    .select();
  
  if (error) {
    console.error('❌ Database update failed:', error);
  } else {
    console.log('✅ Database mood cleared:', data);
  }
  
  console.log('🧹 Remember to also clear these localStorage items in browser:');
  console.log('- moodTaskGenerator_lastUsed');
  console.log('- moodTaskGenerator_mood'); 
  console.log('- moodTaskGenerator_tasks');
  console.log('- aiSuggestionsUsedDate');
  console.log('- selectedAITasks');
  console.log('- last_mood_check_user_31TC1szW0Eqb8rlFV4xhbYHISAQ');
}

clearMoodCompletely();
