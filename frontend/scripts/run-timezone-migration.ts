import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

async function runTimezoneMigration() {
  console.log('🔄 Running timezone migration...')
  
  try {
    // Update existing users with current timestamp and default timezone
    const { data: users, error: updateError } = await supabase
      .from('user_stats')
      .update({ 
        last_activity_at: new Date().toISOString(),
        timezone: 'UTC' // Default timezone for existing users
      })
      .is('last_activity_at', null)

    if (updateError) {
      console.error('❌ Error updating existing users:', updateError)
      return
    }

    console.log('✅ Updated existing users with activity timestamp')
    console.log('🎉 Timezone migration completed successfully!')
    console.log('')
    console.log('📝 IMPORTANT: You still need to run the SQL migration manually:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of supabase/migrations/005_add_timezone_tracking.sql')
    console.log('4. Run the migration')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

runTimezoneMigration() 