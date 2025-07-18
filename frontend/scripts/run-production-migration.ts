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

async function runProductionMigration() {
  console.log('🚀 Running production database migration...')
  
  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/010_add_missing_columns.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📋 Migration SQL:')
    console.log(migrationSQL)
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    console.log(`\n🔧 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n📝 Statement ${i + 1}: ${statement.substring(0, 50)}...`)
      
      try {
        const { data, error } = await productionSupabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err)
      }
    }
    
    // Verify the migration worked
    console.log('\n🔍 Verifying migration...')
    
    // Check tasks table
    const { data: tasksData, error: tasksError } = await productionSupabase
      .from('tasks')
      .select('*')
      .limit(1)
    
    if (tasksError) {
      console.error('❌ Error checking tasks table:', tasksError)
    } else {
      console.log('✅ Tasks table accessible')
      if (tasksData && tasksData.length > 0) {
        console.log('📊 Tasks columns after migration:', Object.keys(tasksData[0]))
      }
    }
    
    // Check user_stats table
    const { data: userStatsData, error: userStatsError } = await productionSupabase
      .from('user_stats')
      .select('*')
      .limit(1)
    
    if (userStatsError) {
      console.error('❌ Error checking user_stats table:', userStatsError)
    } else {
      console.log('✅ User_stats table accessible')
      if (userStatsData && userStatsData.length > 0) {
        console.log('📊 User_stats columns after migration:', Object.keys(userStatsData[0]))
      }
    }
    
    console.log('\n🎉 Migration completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

runProductionMigration() 