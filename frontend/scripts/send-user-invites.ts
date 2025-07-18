import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Production Supabase client
const productionSupabase = createClient(
  'https://qaixpzbbqocssdznztev.supabase.co',
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

interface UserMigrationData {
  old_user_id: string
  email: string
  name: string
  current_streak: string
  tasks_completed: string
  last_task_completed: string
  longest_streak: string
  cactus_state: string
  new_user_id: string | null
  migrated: boolean
}

async function sendUserInvites() {
  console.log('📧 Sending invitation emails to migrated users...')
  
  try {
    // Read the user mapping file
    const userMappingPath = path.join(__dirname, 'user-mapping.json')
    const userMappingData: UserMigrationData[] = JSON.parse(fs.readFileSync(userMappingPath, 'utf8'))
    
    console.log(`📊 Found ${userMappingData.length} users to invite`)
    
    let sentCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const userData of userMappingData) {
      try {
        // Skip if no email
        if (!userData.email || userData.email.trim() === '') {
          console.log(`⚠️ Skipping user with no email: ${userData.name}`)
          skippedCount++
          continue
        }
        
        console.log(`📧 Sending invite to ${userData.email} (${userData.name})...`)
        
        // Check if user already exists in Supabase (migrated)
        const { data: existingUser, error: checkError } = await productionSupabase
          .from('user_stats')
          .select('user_id')
          .eq('email', userData.email)
          .single()
        
        if (!existingUser) {
          console.log(`⚠️ User ${userData.email} not found in Supabase, skipping`)
          skippedCount++
          continue
        }
        
        // Send invitation email
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://teyra.app'}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.email,
            name: userData.name,
            type: 'migration_invite',
            userData: {
              tasks_completed: userData.tasks_completed,
              current_streak: userData.current_streak,
              longest_streak: userData.longest_streak
            }
          }),
        })
        
        if (response.ok) {
          console.log(`✅ Invitation sent to ${userData.email}`)
          sentCount++
        } else {
          console.error(`❌ Failed to send invite to ${userData.email}`)
          errorCount++
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${userData.email}:`, error)
        errorCount++
      }
    }
    
    console.log('\n📊 Invitation Summary:')
    console.log(`✅ Successfully sent: ${sentCount}`)
    console.log(`⏭️ Skipped (no email/not in Supabase): ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📝 Total processed: ${userMappingData.length}`)
    
    if (sentCount > 0) {
      console.log('\n🎉 Invitations sent successfully!')
      console.log('📧 Users will receive emails with instructions to sign up')
      console.log('🌐 They can visit teyra.app to create their accounts')
      console.log('📊 Their data will be automatically linked when they sign up')
    }
    
  } catch (error) {
    console.error('❌ Invitation sending failed:', error)
  }
}

// Run the invitation sending
sendUserInvites() 