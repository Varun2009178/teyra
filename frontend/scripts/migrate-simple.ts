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

async function migrateSimple() {
  console.log('🚀 Starting simple migration...')

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

    // Create user mapping file
    console.log('\n👥 Creating user mapping file...')
    
    const userMapping = oldUsers.map(user => ({
      old_user_id: user.id,
      email: user.email,
      name: user.name,
      current_streak: user.currentStreak || 0,
      tasks_completed: user.tasksCompletedForCactus || 0,
      last_task_completed: user.lastTaskCompleted || '',
      longest_streak: user.longestStreak || 0,
      cactus_state: user.cactusState || 'SAD',
      // This will be filled when user signs up
      new_user_id: null,
      migrated: false
    }))

    // Save user mapping to file
    const mappingPath = path.join(__dirname, 'user-mapping.json')
    fs.writeFileSync(mappingPath, JSON.stringify(userMapping, null, 2))
    console.log(`✅ Saved user mapping to ${mappingPath}`)

    // Import tasks with temporary user IDs (you can update these later)
    if (oldTasks.length > 0) {
      console.log('\n📝 Importing tasks...')
      
      // For now, we'll use a placeholder user ID
      // You can update these later when users sign up
      const placeholderUserId = 'temp_user_placeholder'
      
      const taskData = oldTasks.map(task => ({
        user_id: placeholderUserId,
        text: task.title,
        completed: task.completed === 'true',
        created_at: task.createdAt,
        // Store old task ID for reference
        old_task_id: task.id,
        old_user_id: task.userId
      }))

      const { error: insertTaskError } = await newSupabase
        .from('tasks')
        .insert(taskData)

      if (insertTaskError) {
        console.error('❌ Error inserting tasks:', insertTaskError)
      } else {
        console.log(`✅ Imported ${taskData.length} tasks with placeholder user ID`)
        console.log('⚠️  You will need to update the user_id for these tasks when users sign up')
      }
    }

    console.log('\n🎉 Simple migration completed!')
    console.log('\n📝 Next steps:')
    console.log('1. Users will sign up themselves when they visit your app')
    console.log('2. Check the user-mapping.json file to see all your users')
    console.log('3. When a user signs up, you can manually link their data using their email')
    console.log('4. Update the tasks table to link tasks to the correct user IDs')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run migration
migrateSimple() 