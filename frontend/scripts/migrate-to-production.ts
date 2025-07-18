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

async function migrateUsersToProduction() {
  console.log('🚀 Starting migration to production...')
  
  try {
    // Read the user mapping file
    const userMappingPath = path.join(__dirname, 'user-mapping.json')
    const userMappingData: UserMigrationData[] = JSON.parse(fs.readFileSync(userMappingPath, 'utf8'))
    
    console.log(`📊 Found ${userMappingData.length} users to migrate`)
    
    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const userData of userMappingData) {
      try {
        // Skip if already migrated
        if (userData.migrated) {
          console.log(`⏭️ Skipping ${userData.email} (already migrated)`)
          skippedCount++
          continue
        }
        
        // Skip if no email
        if (!userData.email || userData.email.trim() === '') {
          console.log(`⚠️ Skipping user with no email: ${userData.name}`)
          skippedCount++
          continue
        }
        
        console.log(`🔄 Migrating ${userData.email} (${userData.name})...`)
        
        // Create user stats entry in production
        const userStatsData = {
          user_id: userData.old_user_id, // Use old user ID as the new user_id
          all_time_completed: parseInt(userData.tasks_completed) || 0,
          current_streak: parseInt(userData.current_streak) || 0,
          completed_this_week: 0, // Reset for new system
          completed_today: 0, // Reset for new system
          last_completed_date: userData.last_task_completed || null,
          subscription_level: 'free' as const,
          ai_suggestions_enabled: true,
          user_mood: 'neutral' as const,
          show_analytics: true,
          notifications_enabled: true, // Enable notifications for migrated users
          email: userData.email,
          mood_checkins_today: 0, // Reset for new system
          ai_splits_today: 0, // Reset for new system
          last_daily_reset: new Date().toISOString(), // Set to current time
          last_activity_at: new Date().toISOString(),
          timezone: 'UTC' // Will be updated when they first visit
        }
        
        // Check if user already exists in production
        const { data: existingUser, error: checkError } = await productionSupabase
          .from('user_stats')
          .select('user_id')
          .eq('email', userData.email)
          .single()
        
        if (existingUser) {
          console.log(`⚠️ User ${userData.email} already exists in production, skipping`)
          skippedCount++
          continue
        }
        
        // Insert user stats
        const { data: insertedUser, error: insertError } = await productionSupabase
          .from('user_stats')
          .insert([userStatsData])
          .select()
          .single()
        
        if (insertError) {
          console.error(`❌ Error migrating ${userData.email}:`, insertError.message)
          errorCount++
          continue
        }
        
        console.log(`✅ Successfully migrated ${userData.email}`)
        migratedCount++
        
        // Update the mapping file to mark as migrated
        userData.migrated = true
        userData.new_user_id = insertedUser.user_id
        
      } catch (error) {
        console.error(`❌ Error processing ${userData.email}:`, error)
        errorCount++
      }
    }
    
    // Save updated mapping file
    fs.writeFileSync(userMappingPath, JSON.stringify(userMappingData, null, 2))
    
    console.log('\n📊 Migration Summary:')
    console.log(`✅ Successfully migrated: ${migratedCount}`)
    console.log(`⏭️ Skipped (already migrated/no email): ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📝 Total processed: ${userMappingData.length}`)
    
    if (migratedCount > 0) {
      console.log('\n🎉 Migration completed successfully!')
      console.log('📧 These users will now receive email notifications when they visit the app.')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run the migration
migrateUsersToProduction() 