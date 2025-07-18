import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Database connection
const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY!

// Initialize clients
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY)

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

async function migrateDataOnly() {
  console.log('🚀 Starting data-only migration...')

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

    if (!fs.existsSync(userCsvPath)) {
      console.error('❌ Users.csv not found in scripts/data/')
      return
    }

    const oldUsers = parseCSV(userCsvPath) as OldUser[]
    const oldTasks = fs.existsSync(taskCsvPath) ? parseCSV(taskCsvPath) as OldTask[] : []

    console.log(`📊 Found ${oldUsers.length} users, ${oldTasks.length} tasks`)

    // Store user data for later reference (when they sign up)
    console.log('\n👥 Storing user data for future reference...')
    
    const userData = oldUsers.map(user => ({
      old_user_id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      current_streak: user.currentStreak || 0,
      tasks_completed_for_cactus: user.tasksCompletedForCactus || 0,
      created_at: user.createdAt,
      last_task_completed: user.lastTaskCompleted || '',
      longest_streak: user.longestStreak || 0,
      onboarded: user.onboarded || false,
      tasks_last_generated_at: user.tasksLastGeneratedAt || '',
      has_seen_completion_popup: user.hasSeenCompletionPopup || false,
      has_seen_intro_popup: user.hasSeenIntroPopup || false,
      has_seen_streak_popup: user.hasSeenStreakPopup || false,
      has_completed_first_task: user.hasCompletedFirstTask || false,
      current_mood_progress: user.currentMoodProgress || 0,
      mood_percentage: user.moodPercentage || 0,
      last_reset_at: user.lastResetAt || '',
      cactus_progress: user.cactusProgress || 0,
      cactus_max: user.cactusMax || 10,
      cactus_state: user.cactusState || 'SAD',
    }))

    // Insert user data into a temporary table
    const { error: insertUserDataError } = await newSupabase
      .from('user_migration_data')
      .insert(userData)

    if (insertUserDataError) {
      console.error('❌ Error inserting user data:', insertUserDataError)
    } else {
      console.log(`✅ Stored ${userData.length} user records for future migration`)
    }

    // Store task data for later reference
    if (oldTasks.length > 0) {
      console.log('\n📝 Storing task data for future reference...')
      
      const taskData = oldTasks.map(task => ({
        old_task_id: task.id,
        old_user_id: task.userId,
        title: task.title,
        description: task.description || '',
        completed: task.completed === 'true',
        created_at: task.createdAt,
        completed_at: task.completedAt || '',
        assigned_date: task.assignedDate || '',
        expired: task.expired === 'true',
      }))

      const { error: insertTaskDataError } = await newSupabase
        .from('task_migration_data')
        .insert(taskData)

      if (insertTaskDataError) {
        console.error('❌ Error inserting task data:', insertTaskDataError)
      } else {
        console.log(`✅ Stored ${taskData.length} task records for future migration`)
      }
    }

    console.log('\n🎉 Data migration completed!')
    console.log('\n📝 Next steps:')
    console.log('1. Users will sign up themselves when they visit your app')
    console.log('2. You can create a script to link their data when they sign up')
    console.log('3. Or manually link their data using their email address')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run migration
migrateDataOnly() 