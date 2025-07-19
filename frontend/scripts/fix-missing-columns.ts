import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function fixMissingColumns() {
  console.log('🔧 Fixing Missing Columns...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.NEW_SUPABASE_SERVICE_KEY!

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    console.log('📊 Checking current table structure...')
    
    // Check what columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1)
    
    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError)
      return
    }

    console.log('✅ Table structure check successful')
    console.log('Available columns:', Object.keys(columns[0] || {}))
    console.log('')

    // Add missing columns manually
    console.log('🔧 Adding missing columns...')
    
    // Add completedAt column
    try {
      const { error: completedAtError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE'
      })
      
      if (completedAtError) {
        console.log('⚠️ completedAt column error (might already exist):', completedAtError.message)
      } else {
        console.log('✅ completedAt column added')
      }
    } catch (err) {
      console.log('⚠️ completedAt column already exists or error:', err)
    }

    // Add assignedDate column
    try {
      const { error: assignedDateError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "assignedDate" DATE'
      })
      
      if (assignedDateError) {
        console.log('⚠️ assignedDate column error (might already exist):', assignedDateError.message)
      } else {
        console.log('✅ assignedDate column added')
      }
    } catch (err) {
      console.log('⚠️ assignedDate column already exists or error:', err)
    }

    // Add expired column
    try {
      const { error: expiredError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS expired BOOLEAN DEFAULT FALSE'
      })
      
      if (expiredError) {
        console.log('⚠️ expired column error (might already exist):', expiredError.message)
      } else {
        console.log('✅ expired column added')
      }
    } catch (err) {
      console.log('⚠️ expired column already exists or error:', err)
    }

    console.log('')
    console.log('🔍 Testing columns again...')
    
    // Test the columns
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('id, userId, title, completed, createdAt, updatedAt, expired, completedAt, assignedDate, has_been_split')
      .limit(1)
    
    if (testError) {
      console.error('❌ Column test failed:', testError.message)
    } else {
      console.log('✅ All columns are now accessible!')
      console.log('Available columns:', Object.keys(testData[0] || {}))
    }

  } catch (error) {
    console.error('❌ Error fixing columns:', error)
  }
}

fixMissingColumns().catch(console.error) 