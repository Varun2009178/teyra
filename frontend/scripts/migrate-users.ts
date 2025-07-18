import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'

// Configuration
const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL!
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_SERVICE_KEY!
const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY!

// Initialize clients
const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY)
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY)

interface OldUser {
  id: string
  email: string
  name?: string
  created_at: string
}

interface OldTask {
  id: string
  user_id: string
  text: string
  completed: boolean
  created_at: string
}

interface OldUserStats {
  user_id: string
  all_time_completed: number
  current_streak: number
  completed_this_week: number
  completed_today: number
  last_completed_date: string
  subscription_level: 'free' | 'basic' | 'pro'
  ai_suggestions_enabled: boolean
  user_mood: 'energized' | 'focused' | 'neutral' | 'tired' | 'stressed'
  show_analytics: boolean
}

async function migrateUsers() {
  console.log('🚀 Starting user migration...')

  try {
    // 1. Get all users from old database
    console.log('📥 Fetching users from old database...')
    const { data: oldUsers, error: usersError } = await oldSupabase
      .from('users') // Adjust table name as needed
      .select('*')

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`)
    }

    console.log(`Found ${oldUsers?.length || 0} users to migrate`)

    // 2. Create Clerk users and migrate data
    for (const oldUser of oldUsers || []) {
      console.log(`\n👤 Migrating user: ${oldUser.email}`)

      try {
        // Create Clerk user
        const clerkUser = await clerkClient.users.createUser({
          emailAddress: [oldUser.email],
          firstName: oldUser.name?.split(' ')[0] || undefined,
          lastName: oldUser.name?.split(' ').slice(1).join(' ') || undefined,
        })

        console.log(`✅ Created Clerk user: ${clerkUser.id}`)

        // 3. Migrate user's tasks
        const { data: oldTasks, error: tasksError } = await oldSupabase
          .from('tasks') // Adjust table name as needed
          .select('*')
          .eq('user_id', oldUser.id)

        if (tasksError) {
          console.error(`❌ Error fetching tasks for ${oldUser.email}:`, tasksError)
          continue
        }

        if (oldTasks && oldTasks.length > 0) {
          // Insert tasks into new database
          const newTasks = oldTasks.map(task => ({
            user_id: clerkUser.id,
            text: task.text,
            completed: task.completed,
            created_at: task.created_at,
          }))

          const { error: insertTasksError } = await newSupabase
            .from('tasks')
            .insert(newTasks)

          if (insertTasksError) {
            console.error(`❌ Error inserting tasks for ${oldUser.email}:`, insertTasksError)
          } else {
            console.log(`✅ Migrated ${oldTasks.length} tasks`)
          }
        }

        // 4. Migrate user stats
        const { data: oldStats, error: statsError } = await oldSupabase
          .from('user_stats') // Adjust table name as needed
          .select('*')
          .eq('user_id', oldUser.id)
          .single()

        if (statsError && statsError.code !== 'PGRST116') {
          console.error(`❌ Error fetching stats for ${oldUser.email}:`, statsError)
        } else if (oldStats) {
          const { error: insertStatsError } = await newSupabase
            .from('user_stats')
            .insert({
              user_id: clerkUser.id,
              all_time_completed: oldStats.all_time_completed || 0,
              current_streak: oldStats.current_streak || 0,
              completed_this_week: oldStats.completed_this_week || 0,
              completed_today: oldStats.completed_today || 0,
              last_completed_date: oldStats.last_completed_date || '',
              subscription_level: oldStats.subscription_level || 'basic',
              ai_suggestions_enabled: oldStats.ai_suggestions_enabled ?? true,
              user_mood: oldStats.user_mood || 'neutral',
              show_analytics: oldStats.show_analytics ?? true,
            })

          if (insertStatsError) {
            console.error(`❌ Error inserting stats for ${oldUser.email}:`, insertStatsError)
          } else {
            console.log(`✅ Migrated user stats`)
          }
        } else {
          // Create default stats for user
          const { error: insertStatsError } = await newSupabase
            .from('user_stats')
            .insert({
              user_id: clerkUser.id,
              all_time_completed: 0,
              current_streak: 0,
              completed_this_week: 0,
              completed_today: 0,
              last_completed_date: '',
              subscription_level: 'basic',
              ai_suggestions_enabled: true,
              user_mood: 'neutral',
              show_analytics: true,
            })

          if (insertStatsError) {
            console.error(`❌ Error creating default stats for ${oldUser.email}:`, insertStatsError)
          } else {
            console.log(`✅ Created default user stats`)
          }
        }

        // 5. Store mapping for reference
        await newSupabase
          .from('user_migrations') // Create this table for tracking
          .insert({
            old_user_id: oldUser.id,
            new_user_id: clerkUser.id,
            email: oldUser.email,
            migrated_at: new Date().toISOString(),
          })

        console.log(`✅ Successfully migrated ${oldUser.email}`)

      } catch (error) {
        console.error(`❌ Failed to migrate ${oldUser.email}:`, error)
      }
    }

    console.log('\n🎉 Migration completed!')
    console.log('\n📧 Next steps:')
    console.log('1. Send email to users about the new app')
    console.log('2. Ask them to sign in with their email')
    console.log('3. Clerk will send them a magic link to sign in')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run migration
migrateUsers() 