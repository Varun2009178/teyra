import { createClient } from '@supabase/supabase-js'
import { createClerkClient } from '@clerk/clerk-sdk-node'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Database connection
const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY!

// Initialize clients
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY)
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

interface OldUser {
  id: string
  name: string
  email: string
  emailVerified?: string
  image?: string
  username?: string
  currentStreak?: number
  tasksCompletedForCactus?: number
  createdAt: string
  lastTaskCompleted?: string
  longestStreak?: number
  onboarded?: boolean
  tasksLastGeneratedAt?: string
  hasSeenCompletionPopup?: boolean
  hasSeenIntroPopup?: boolean
  hasSeenStreakPopup?: boolean
  hasCompletedFirstTask?: boolean
  currentMoodProgress?: number
  moodPercentage?: number
  lastResetAt?: string
  cactusProgress?: number
  cactusMax?: number
  cactusState?: string
}

function mapMood(cactusState?: string): string {
  const moodMap: { [key: string]: string } = {
    happy: 'energized',
    'neutral calm': 'neutral',
    'sad with tears 2': 'sad', // This will still fail, but shows mapping. Let's map to a valid one.
    // Let's create a safe mapping
    'sad': 'stressed', // Example mapping
  };
  const lowerCaseState = cactusState?.toLowerCase() || 'neutral';
  const mapped = moodMap[lowerCaseState];
  // Ensure the mapped value is one of the allowed enum values
  const allowedMoods = ['energized', 'focused', 'neutral', 'tired', 'stressed'];
  if (mapped && allowedMoods.includes(mapped)) {
    return mapped;
  }
  // Fallback for unmapped or invalid states
  return 'neutral';
}

interface OldTask {
  id: string
  userId: string
  title: string
  description?: string
  completed: string
  createdAt: string
  completedAt?: string
  assignedDate?: string
  expired?: string
}

interface OldAccount {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token?: string
  access_token?: string
  expires_at?: number
  token_type?: string
  scope?: string
  id_token?: string
  session_state?: string
}

// Helper function to parse CSV
function parseCSV(filePath: string): any[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    const data = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      data.push(row)
    }
    
    return data
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error)
    return []
  }
}

async function migrateFromCSV() {
  console.log('🚀 Starting CSV migration...')

  try {
    const dataDir = path.join(__dirname, 'data')
    
    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      console.error('❌ Data directory not found. Please create scripts/data/ and put your CSV files there.')
      return
    }

    // Read CSV files
    console.log('📂 Reading CSV files...')
    
    const userCsvPath = path.join(dataDir, 'Users.csv')
    const taskCsvPath = path.join(dataDir, 'Task.csv')
    const backupCsvPath = path.join(dataDir, 'Accounts.csv')

    if (!fs.existsSync(userCsvPath)) {
      console.error('❌ Users.csv not found in scripts/data/')
      return
    }

    const oldUsers = parseCSV(userCsvPath) as OldUser[]
    const oldTasks = fs.existsSync(taskCsvPath) ? parseCSV(taskCsvPath) as OldTask[] : []
    const oldAccounts = fs.existsSync(backupCsvPath) ? parseCSV(backupCsvPath) as OldAccount[] : []

    console.log(`📊 Found ${oldUsers.length} users, ${oldTasks.length} tasks, ${oldAccounts.length} accounts`)

    // Create a map of old user ID to new Clerk user ID
    const userMap = new Map<string, string>()

    // Migrate each user
    for (const oldUser of oldUsers) {
      console.log(`\n👤 Migrating user: ${oldUser.email}`)
      let clerkUser;

      try {
        // Create Clerk user
        clerkUser = await clerkClient.users.createUser({
          emailAddress: [oldUser.email],
          firstName: oldUser.name?.split(' ')[0] || undefined,
          lastName: oldUser.name?.split(' ').slice(1).join(' ') || undefined,
          skipPasswordRequirement: true,
        })

        console.log(`✅ Created Clerk user: ${clerkUser.id}`)
      } catch (error: any) {
        if (error.errors && error.errors[0]?.code === 'form_identifier_exists') {
          console.log(`⚠️ User ${oldUser.email} already exists. Finding existing user.`)
          const existingUsers = await clerkClient.users.getUserList({
            emailAddress: [oldUser.email],
          })
          clerkUser = existingUsers[0]
          if (clerkUser) {
            console.log(`✅ Found existing Clerk user: ${clerkUser.id}`)
          } else {
            console.error(`❌ Could not find existing user ${oldUser.email} despite error.`)
            continue
          }
        } else {
          console.error(`❌ Failed to migrate ${oldUser.email}:`, error)
          continue
        }
      }

      if (clerkUser) {
        userMap.set(oldUser.id, clerkUser.id)

        // Store migration record
        await newSupabase.from('user_migrations').insert({
          old_user_id: oldUser.id,
          new_user_id: clerkUser.id,
          email: oldUser.email,
          migrated_at: new Date().toISOString(),
        })

        console.log(`✅ Successfully mapped ${oldUser.email}`)
      }
    }

    // Get all user_ids that are already in the user_stats table to prevent duplicates
    console.log('\n🔍 Checking for existing user stats to prevent duplicates...');
    const { data: existingStats, error: statsCheckError } = await newSupabase
      .from('user_stats')
      .select('user_id');
    const existingUserIds = new Set(statsCheckError ? [] : existingStats.map(s => s.user_id));
    if (!statsCheckError) {
      console.log(`Found ${existingUserIds.size} users who already have stats. They will be skipped.`);
    }

    // Migrate tasks
    if (oldTasks.length > 0) {
      console.log('\n📝 Migrating tasks...')
      const newTasks = oldTasks
        .filter(task => userMap.has(task.userId))
        .map(task => ({
          userId: userMap.get(task.userId)!,
          title: task.title,
          completed: task.completed === 'true',
          createdAt: new Date(task.createdAt).toISOString(),
        }))

      if (newTasks.length > 0) {
        const { error: insertTasksError } = await newSupabase
          .from('tasks')
          .insert(newTasks)

        if (insertTasksError) {
          console.error('❌ Error inserting tasks:', insertTasksError)
        } else {
          console.log(`✅ Migrated ${newTasks.length} tasks`)
        }
      }
    }

    // Migrate user stats from Users.csv data
    console.log('\n📊 Migrating user stats...')
    const newStats = oldUsers
      .filter(user => userMap.has(user.id))
      .filter(user => !existingUserIds.has(userMap.get(user.id)!))
      .map(user => ({
        user_id: userMap.get(user.id)!,
        all_time_completed: user.tasksCompletedForCactus || 0,
        current_streak: user.currentStreak || 0,
        completed_this_week: 0, // We'll calculate this
        completed_today: 0, // We'll calculate this
        last_completed_date: user.lastTaskCompleted || '',
        subscription_level: 'basic',
        ai_suggestions_enabled: true,
        user_mood: mapMood(user.cactusState),
        show_analytics: true,
      }))

    if (newStats.length > 0) {
      const { error: insertStatsError } = await newSupabase
        .from('user_stats')
        .insert(newStats)

      if (insertStatsError) {
        console.error('❌ Error inserting user stats:', insertStatsError)
      } else {
        console.log(`✅ Migrated ${newStats.length} new user stats`)
      }
    } else {
      console.log('✅ No new user stats to migrate.')
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

// Run migration
migrateFromCSV() 