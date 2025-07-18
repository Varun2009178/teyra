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

async function createClerkAccounts() {
  console.log('🚀 Creating Clerk accounts for migrated users...')
  
  try {
    // Read the user mapping file
    const userMappingPath = path.join(__dirname, 'user-mapping.json')
    const userMappingData: UserMigrationData[] = JSON.parse(fs.readFileSync(userMappingPath, 'utf8'))
    
    console.log(`📊 Found ${userMappingData.length} users to create Clerk accounts for`)
    
    let createdCount = 0
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
        
        console.log(`🔄 Creating Clerk account for ${userData.email} (${userData.name})...`)
        
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
        
        // Create Clerk account using Clerk's API
        const clerkResponse = await fetch('https://api.clerk.com/v1/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email_address: [userData.email],
            first_name: userData.name.split(' ')[0] || userData.name,
            last_name: userData.name.split(' ').slice(1).join(' ') || '',
            password: null, // They'll need to set password on first login
            skip_password_requirement: true,
            skip_password_checks: true,
            public_metadata: {
              migrated_from_old_app: true,
              old_user_id: userData.old_user_id,
              tasks_completed: userData.tasks_completed,
              current_streak: userData.current_streak
            }
          })
        })
        
        if (!clerkResponse.ok) {
          const errorData = await clerkResponse.json()
          console.error(`❌ Error creating Clerk account for ${userData.email}:`, errorData)
          errorCount++
          continue
        }
        
        const clerkUser = await clerkResponse.json()
        console.log(`✅ Successfully created Clerk account for ${userData.email}`)
        console.log(`   Clerk User ID: ${clerkUser.id}`)
        createdCount++
        
        // Update the mapping file with Clerk user ID
        userData.new_user_id = clerkUser.id
        
      } catch (error) {
        console.error(`❌ Error processing ${userData.email}:`, error)
        errorCount++
      }
    }
    
    // Save updated mapping file
    fs.writeFileSync(userMappingPath, JSON.stringify(userMappingData, null, 2))
    
    console.log('\n📊 Clerk Account Creation Summary:')
    console.log(`✅ Successfully created: ${createdCount}`)
    console.log(`⏭️ Skipped (no email/not in Supabase): ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📝 Total processed: ${userMappingData.length}`)
    
    if (createdCount > 0) {
      console.log('\n🎉 Clerk accounts created successfully!')
      console.log('📧 Users can now sign in directly at teyra.app')
      console.log('🔑 They will need to set a password on their first login')
    }
    
  } catch (error) {
    console.error('❌ Clerk account creation failed:', error)
  }
}

// Run the account creation
createClerkAccounts() 