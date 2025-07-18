import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// Configuration
const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL!
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_SERVICE_KEY!
const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY!

// Initialize clients
const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY)
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY)

// Prisma table names - UPDATE THESE TO MATCH YOUR SCHEMA
const PRISMA_TABLES = {
  users: 'User', // or 'users' - your main user table
  tasks: 'Task', // or 'tasks' - your tasks table
  user_backup: 'User_backup', // your user backup table
  sessions: 'Session', // or 'sessions' - NextAuth sessions
  accounts: 'Account', // or 'accounts' - NextAuth accounts
  // Add other tables as needed
}

interface PrismaUser {
  id: string
  email: string
  name?: string
  emailVerified?: Date
  image?: string
  createdAt: Date
  updatedAt: Date
}

interface PrismaTask {
  id: string
  userId: string // or user_id depending on your schema
  text: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
  // Add other task fields you have
}

interface PrismaUserStats {
  userId: string // or user_id
  allTimeCompleted?: number
  currentStreak?: number
  completedThisWeek?: number
  completedToday?: number
  lastCompletedDate?: string
  subscriptionLevel?: 'free' | 'basic' | 'pro'
  aiSuggestionsEnabled?: boolean
  userMood?: 'energized' | 'focused' | 'neutral' | 'tired' | 'stressed'
  showAnalytics?: boolean
  // Add other stats fields you have
}

async function migratePrismaUsers() {
  console.log('🚀 Starting Prisma user migration...')

  try {
    // 1. First, let's see what tables exist in your old database
    console.log('📋 Checking available tables...')
    const { data: tables, error: tablesError } = await oldSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (tablesError) {
      console.log('Could not fetch table list, proceeding with default tables...')
    } else {
      console.log('Available tables:', tables?.map(t => t.table_name))
    }

    // 2. Get all users from your Prisma User table
    console.log('📥 Fetching users from Prisma database...')
    let oldUsers: PrismaUser[] = []
    const { data: usersData, error: usersError } = await oldSupabase
      .from(PRISMA_TABLES.users)
      .select('*')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      console.log('Trying alternative table names...')
      
      // Try common variations
      const variations = ['users', 'user', 'Users', 'User']
      for (const tableName of variations) {
        try {
          const { data, error } = await oldSupabase.from(tableName).select('*')
          if (!error && data) {
            console.log(`✅ Found users in table: ${tableName}`)
            oldUsers = data
            break
          }
        } catch (e) {
          console.log(`❌ Table ${tableName} not found`)
        }
      }
      
      if (!oldUsers) {
        throw new Error('Could not find users table. Please check your table names.')
      }
    } else {
      oldUsers = usersData as PrismaUser[]
    }

    console.log(`Found ${oldUsers?.length || 0} users to migrate`)

    // 3. Create Clerk users and migrate data
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

        // 4. Migrate user's tasks
        await migrateUserTasks(oldUser.id, clerkUser.id, oldUser.email)

        // 5. Migrate user backup data
        await migrateUserBackup(oldUser.id, clerkUser.id, oldUser.email)

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
  }
}

async function migrateUserTasks(oldUserId: string, newUserId: string, userEmail: string) {
  // Try different possible table names and field names
  const taskTableVariations = [
    { table: PRISMA_TABLES.tasks, userIdField: 'userId' },
    { table: 'tasks', userIdField: 'user_id' },
    { table: 'Task', userIdField: 'userId' },
    { table: 'task', userIdField: 'user_id' },
  ]

  for (const variation of taskTableVariations) {
    try {
      const { data: oldTasks, error: tasksError } = await oldSupabase
        .from(variation.table)
        .select('*')
        .eq(variation.userIdField, oldUserId)

      if (!tasksError && oldTasks) {
        console.log(`✅ Found tasks in table: ${variation.table}`)
        
        if (oldTasks.length > 0) {
          // Insert tasks into new database
          const newTasks = oldTasks.map(task => ({
            user_id: newUserId,
            text: task.text || task.content || task.title, // Handle different field names
            completed: task.completed || task.done || false,
            created_at: task.createdAt || task.created_at || new Date().toISOString(),
          }))

          const { error: insertTasksError } = await newSupabase
            .from('tasks')
            .insert(newTasks)

          if (insertTasksError) {
            console.error(`❌ Error inserting tasks for ${userEmail}:`, insertTasksError)
          } else {
            console.log(`✅ Migrated ${oldTasks.length} tasks`)
          }
        }
        return // Success, exit the loop
      }
    } catch (e) {
      console.log(`❌ Table ${variation.table} not found`)
    }
  }
  
  console.log(`⚠️ No tasks found for ${userEmail}`)
}

async function migrateUserBackup(oldUserId: string, newUserId: string, userEmail: string) {
  // Try different possible table names for user backup
  const backupTableVariations = [
    PRISMA_TABLES.user_backup,
    'User_backup',
    'user_backup',
    'UserBackup',
    'userBackup',
  ]

  for (const tableName of backupTableVariations) {
    try {
      const { data: oldBackup, error: backupError } = await oldSupabase
        .from(tableName)
        .select('*')
        .eq('userId', oldUserId)
        .single()

      if (!backupError && oldBackup) {
        console.log(`✅ Found user backup in table: ${tableName}`)
        
        // Create user stats from backup data
        const { error: insertStatsError } = await newSupabase
          .from('user_stats')
          .insert({
            user_id: newUserId,
            all_time_completed: oldBackup.allTimeCompleted || oldBackup.all_time_completed || 0,
            current_streak: oldBackup.currentStreak || oldBackup.current_streak || 0,
            completed_this_week: oldBackup.completedThisWeek || oldBackup.completed_this_week || 0,
            completed_today: oldBackup.completedToday || oldBackup.completed_today || 0,
            last_completed_date: oldBackup.lastCompletedDate || oldBackup.last_completed_date || '',
            subscription_level: oldBackup.subscriptionLevel || oldBackup.subscription_level || 'basic',
            ai_suggestions_enabled: oldBackup.aiSuggestionsEnabled ?? oldBackup.ai_suggestions_enabled ?? true,
            user_mood: oldBackup.userMood || oldBackup.user_mood || 'neutral',
            show_analytics: oldBackup.showAnalytics ?? oldBackup.show_analytics ?? true,
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
}

async function migrateUserStats(oldUserId: string, newUserId: string, userEmail: string) {
  // Try different possible table names
  const statsTableVariations = [
    PRISMA_TABLES.userStats,
    'user_stats',
    'UserStats',
    'userStats',
    'UserStat',
  ]

  for (const tableName of statsTableVariations) {
    try {
      const { data: oldStats, error: statsError } = await oldSupabase
        .from(tableName)
        .select('*')
        .eq('userId', oldUserId)
        .single()

      if (!statsError && oldStats) {
        console.log(`✅ Found user stats in table: ${tableName}`)
        
        const { error: insertStatsError } = await newSupabase
          .from('user_stats')
          .insert({
            user_id: newUserId,
            all_time_completed: oldStats.allTimeCompleted || oldStats.all_time_completed || 0,
            current_streak: oldStats.currentStreak || oldStats.current_streak || 0,
            completed_this_week: oldStats.completedThisWeek || oldStats.completed_this_week || 0,
            completed_today: oldStats.completedToday || oldStats.completed_today || 0,
            last_completed_date: oldStats.lastCompletedDate || oldStats.last_completed_date || '',
            subscription_level: oldStats.subscriptionLevel || oldStats.subscription_level || 'basic',
            ai_suggestions_enabled: oldStats.aiSuggestionsEnabled ?? oldStats.ai_suggestions_enabled ?? true,
            user_mood: oldStats.userMood || oldStats.user_mood || 'neutral',
            show_analytics: oldStats.showAnalytics ?? oldStats.show_analytics ?? true,
          })

        if (insertStatsError) {
          console.error(`❌ Error inserting stats for ${userEmail}:`, insertStatsError)
        } else {
          console.log(`✅ Migrated user stats`)
        }
        return // Success, exit the loop
      }
    } catch (e) {
      console.log(`❌ Table ${tableName} not found`)
    }
  }

  // Create default stats if none found
  console.log(`⚠️ No user stats found for ${userEmail}, creating defaults`)
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
}

// Run migration
migratePrismaUsers() 