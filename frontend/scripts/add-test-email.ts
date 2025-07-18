import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qaixpzbbqocssdznztev.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhaXhwemJicW9jc3Nkem56dGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDcxODIsImV4cCI6MjA2ODI4MzE4Mn0.8A4y5Xoe-kWQhCqS1kSQtBZQHHEvfK1z2xBxFDEPsD8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addTestEmail() {
  console.log('📧 Adding test email to user...')
  
  try {
    // Update the test user with an email
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_stats')
      .update({ 
        email: 'test@example.com',
        notifications_enabled: true
      })
      .eq('user_id', 'user_2zz9kVGorX2zHx5zFNwF4cbKg1I')
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to update user:', updateError)
      return
    }

    console.log('✅ User updated with test email:', {
      userId: updatedUser.user_id,
      email: updatedUser.email,
      notificationsEnabled: updatedUser.notifications_enabled
    })

    console.log('\n🎯 Now you can test the email system:')
    console.log('1. Start your dev server: npm run dev')
    console.log('2. Visit: http://localhost:3000/api/test-email-system')
    console.log('3. Check the console for email processing logs')
    console.log('4. Check the database to see if mood_checkins_today and ai_splits_today were reset to 0')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

addTestEmail() 