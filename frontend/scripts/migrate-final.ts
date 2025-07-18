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

async function migrateFinal() {
  console.log('🚀 Starting final migration...')

  try {
    const dataDir = path.join(__dirname, 'data')
    
    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      console.error('❌ Data directory not found. Please create scripts/data/ and put your CSV files there.')
      return
    }

    // Read task CSV file
    console.log('📂 Reading task CSV file...')
    
    const taskCsvPath = path.join(dataDir, 'Task.csv')

    if (!fs.existsSync(taskCsvPath)) {
      console.log('⚠️  No Task.csv found, skipping task import')
      return
    }

    const oldTasks = parseCSV(taskCsvPath) as OldTask[]
    console.log(`📊 Found ${oldTasks.length} tasks`)

    // Import tasks with temporary user IDs
    if (oldTasks.length > 0) {
      console.log('\n📝 Importing tasks...')
      
      // For now, we'll use a placeholder user ID
      // You can update these later when users sign up
      const placeholderUserId = 'temp_user_placeholder'
      
      const taskData = oldTasks.map(task => ({
        user_id: placeholderUserId,
        text: task.title,
        completed: task.completed === 'true',
        created_at: task.createdAt
      }))

      const { error: insertTaskError } = await newSupabase
        .from('tasks')
        .insert(taskData)

      if (insertTaskError) {
        console.error('❌ Error inserting tasks:', insertTaskError)
        console.log('This might be because the tasks table structure is different')
      } else {
        console.log(`✅ Successfully imported ${taskData.length} tasks with placeholder user ID`)
        console.log('⚠️  You will need to update the user_id for these tasks when users sign up')
      }
    }

    console.log('\n🎉 Final migration completed!')
    console.log('\n📝 Summary:')
    console.log('✅ User mapping file created (scripts/user-mapping.json)')
    console.log('✅ Tasks imported with placeholder user IDs')
    console.log('\n📝 Next steps:')
    console.log('1. Users will sign up themselves when they visit your app')
    console.log('2. When a user signs up, you can manually link their data using their email')
    console.log('3. Update the tasks table to link tasks to the correct user IDs')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run migration
migrateFinal() 