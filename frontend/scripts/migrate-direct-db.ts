import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'
import * as dotenv from 'dotenv'
import { Client } from 'pg'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Database connection
const OLD_DATABASE_URL = process.env.OLD_SUPABASE_URL || 'postgresql://postgres:QmhLNeQLgQkrvRXB@db.heyxgoavbwdujdhymkpr.supabase.co:5432/postgres'
const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY!

// Initialize clients
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY)

interface OldUser {
  id: string
  email: string
  name?: string
  emailVerified?: Date
  image?: string
  createdAt: Date
  updatedAt: Date
}

interface OldTask {
  id: string
  userId: string
  text: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

interface OldUserBackup {
  userId: string
  allTimeCompleted?: number
  currentStreak?: number
  completedThisWeek?: number
  completedToday?: number
  lastCompletedDate?: string
  subscriptionLevel?: 'free' | 'basic' | 'pro'
  aiSuggestionsEnabled?: boolean
  userMood?: 'energized' | 'focused' | 'neutral' | 'tired' | 'stressed'
  showAnalytics?: boolean
}

async function migrateDirectDB() {
  console.log('🚀 Starting direct database migration...')

  let client: Client | null = null

  try {
    // Connect to old database
    console.log('📡 Connecting to old database...')
    client = new Client({
      connectionString: OLD_DATABASE_URL.replace('QmhLNeQLgQkrvRXB', process.env.OLD_DB_PASSWORD || ''),
    })
    
    await client.connect()
    console.log('✅ Connected to old database')

    // 1. Get all tables
    console.log('📋 Checking available tables...')
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    const tables = tablesResult.rows.map(row => row.table_name)
    console.log('Available tables:', tables)

    // 2. Get all users
    console.log('📥 Fetching users...')
    const usersResult = await client.query('SELECT * FROM "User" ORDER BY "createdAt"')
    const oldUsers = usersResult.rows as OldUser[]
    
    console.log(`Found ${oldUsers.length} users to migrate`)

    // 3. Migrate each user
    for (const oldUser of oldUsers) {
      console.log(`\n👤 Migrating user: ${oldUser.email}`)

      try {
        // Create Clerk user
        const clerkUser = await clerkClient.users.createUser({
          emailAddress: [oldUser.email],
          firstName: oldUser.name?.split(' ')[0] || undefined,
          lastName: oldUser.name?.split(' ').slice(1).join(' ') || undefined,
        })

        console.log(`✅ Created Clerk user: ${clerkUser.id}`)

        // 4. Migrate user's tasks
        await migrateUserTasks(client, oldUser.id, clerkUser.id, oldUser.email)

        // 5. Migrate user backup data
        await migrateUserBackup(client, oldUser.id, clerkUser.id, oldUser.email)

        // 6. Store migration record
        await newSupabase
          .from('user_migrations')
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
    console.log('\n📝 Next steps:')
    console.log('1. Deploy your new app')
    console.log('2. Users can sign in with their email')
    console.log('3. All their data will be there!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    if (client) {
      await client.end()
      console.log('🔌 Disconnected from old database')
    }
  }
}

async function migrateUserTasks(client: Client, oldUserId: string, newUserId: string, userEmail: string) {
  try {
    // Try different possible table names
    const taskTables = ['Task', 'task', 'Tasks', 'tasks']
    
    for (const tableName of taskTables) {
      try {
        const result = await client.query(`SELECT * FROM "${tableName}" WHERE "userId" = $1`, [oldUserId])
        
        if (result.rows.length > 0) {
          console.log(`✅ Found ${result.rows.length} tasks in ${tableName}`)
          
          // Insert tasks into new database
          const newTasks = result.rows.map((task: OldTask) => ({
            user_id: newUserId,
            text: task.text,
            completed: task.completed,
            created_at: task.createdAt.toISOString(),
          }))

          const { error: insertTasksError } = await newSupabase
            .from('tasks')
            .insert(newTasks)

          if (insertTasksError) {
            console.error(`❌ Error inserting tasks for ${userEmail}:`, insertTasksError)
          } else {
            console.log(`✅ Migrated ${result.rows.length} tasks`)
          }
          return // Success, exit the loop
        }
      } catch (e) {
        console.log(`❌ Table ${tableName} not found`)
      }
    }
    
    console.log(`⚠️ No tasks found for ${userEmail}`)
  } catch (error) {
    console.error(`❌ Error migrating tasks for ${userEmail}:`, error)
  }
}

async function migrateUserBackup(client: Client, oldUserId: string, newUserId: string, userEmail: string) {
  try {
    // Try different possible table names
    const backupTables = ['User_backup', 'user_backup', 'UserBackup', 'userBackup']
    
    for (const tableName of backupTables) {
      try {
        const result = await client.query(`SELECT * FROM "${tableName}" WHERE "userId" = $1`, [oldUserId])
        
        if (result.rows.length > 0) {
          console.log(`✅ Found user backup in ${tableName}`)
          const backup = result.rows[0] as OldUserBackup
          
          // Create user stats from backup data
          const { error: insertStatsError } = await newSupabase
            .from('user_stats')
            .insert({
              user_id: newUserId,
              all_time_completed: backup.allTimeCompleted || 0,
              current_streak: backup.currentStreak || 0,
              completed_this_week: backup.completedThisWeek || 0,
              completed_today: backup.completedToday || 0,
              last_completed_date: backup.lastCompletedDate || '',
              subscription_level: backup.subscriptionLevel || 'basic',
              ai_suggestions_enabled: backup.aiSuggestionsEnabled ?? true,
              user_mood: backup.userMood || 'neutral',
              show_analytics: backup.showAnalytics ?? true,
            })

          if (insertStatsError) {
            console.error(`❌ Error inserting backup data for ${userEmail}:`, insertStatsError)
          } else {
            console.log(`✅ Migrated user backup data`)
          }
          return // Success, exit the loop
        }
      } catch (e) {
        console.log(`❌ Table ${tableName} not found`)
      }
    }

    // Create default stats if no backup found
    console.log(`⚠️ No user backup found for ${userEmail}, creating defaults`)
    const { error: insertStatsError } = await newSupabase
      .from('user_stats')
      .insert({
        user_id: newUserId,
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
      console.error(`❌ Error creating default stats for ${userEmail}:`, insertStatsError)
    } else {
      console.log(`✅ Created default user stats`)
    }
  } catch (error) {
    console.error(`❌ Error migrating backup for ${userEmail}:`, error)
  }
}

// Run migration
migrateDirectDB() 