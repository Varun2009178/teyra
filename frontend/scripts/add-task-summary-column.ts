import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Database connection
const NEW_SUPABASE_URL = 'https://qaixpzbbqocssdznztev.supabase.co'
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY!

// Initialize client
const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY)

async function addTaskSummaryColumn() {
  console.log('🔧 Adding last_task_summary column to user_stats table...')

  try {
    // Add the column using SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_stats 
        ADD COLUMN IF NOT EXISTS last_task_summary TEXT;
        
        COMMENT ON COLUMN user_stats.last_task_summary IS 'JSON string containing task summary from last daily reset (completed tasks, missed tasks, counts)';
      `
    })

    if (error) {
      console.error('❌ Error adding column:', error)
      
      // Try alternative approach - check if column already exists
      console.log('🔄 Checking if column already exists...')
      const { data: columns, error: checkError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'user_stats')
        .eq('column_name', 'last_task_summary')

      if (checkError) {
        console.error('❌ Error checking columns:', checkError)
        return
      }

      if (columns && columns.length > 0) {
        console.log('✅ Column already exists!')
      } else {
        console.log('❌ Column does not exist and could not be added')
      }
    } else {
      console.log('✅ Successfully added last_task_summary column!')
    }

    // Verify the column exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('user_stats')
      .select('user_id, last_task_summary')
      .limit(1)

    if (testError) {
      console.error('❌ Error testing column access:', testError)
    } else {
      console.log('✅ Column is accessible and working!')
    }

  } catch (error) {
    console.error('❌ Error during column addition:', error)
  }
}

// Run the column addition
addTaskSummaryColumn() 