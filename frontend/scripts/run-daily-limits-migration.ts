import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

async function runDailyLimitsMigration() {
  console.log('🔄 Running daily limits migration...')
  
  try {
    // Update existing users with default daily limits
    const { data: users, error: updateError } = await supabase
      .from('user_stats')
      .update({ 
        mood_checkins_today: 0,
        ai_splits_today: 0,
        last_daily_reset: new Date().toISOString()
      })
      .is('mood_checkins_today', null)

    if (updateError) {
      console.error('❌ Error updating existing users:', updateError)
      return
    }

    console.log('✅ Updated existing users with daily limits')
    console.log('🎉 Daily limits migration completed successfully!')
    console.log('')
    console.log('📝 IMPORTANT: You still need to run the SQL migration manually:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of supabase/migrations/006_add_daily_limits.sql')
    console.log('4. Run the migration')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

runDailyLimitsMigration() 