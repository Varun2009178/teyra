import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runMigration() {
  try {
    console.log('🔧 Running RLS fix migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/002_fix_rls_for_clerk.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Executing:', statement.substring(0, 50) + '...')
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          console.error('❌ Error executing statement:', error)
          console.log('💡 You may need to run this manually in the Supabase SQL Editor')
          return
        }
      }
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('🎉 Your app should now work with Clerk authentication')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n📝 Manual Setup Required:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the content from: supabase/migrations/002_fix_rls_for_clerk.sql')
    console.log('4. Run the migration')
  }
}

runMigration() 