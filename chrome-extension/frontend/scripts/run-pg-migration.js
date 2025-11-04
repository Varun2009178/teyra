import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  console.error('Please add DATABASE_URL to your .env.local file');
  console.error('You can find it in: Supabase Dashboard → Project Settings → Database → Connection string → URI');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Running AI usage tracking migration...\n');

    // Run the migration SQL
    const sql = `
      -- Add AI usage tracking columns
      ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_mood_checks INTEGER DEFAULT 0;
      ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_parses INTEGER DEFAULT 0;
      ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS ai_schedule_uses INTEGER DEFAULT 0;
    `;

    console.log('➡️  Executing SQL...');
    await client.query(sql);
    console.log('✅ SQL executed successfully\n');

    // Verify the columns exist
    console.log('🔍 Verifying columns...');
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_progress'
        AND column_name IN ('daily_mood_checks', 'daily_parses', 'ai_schedule_uses')
      ORDER BY column_name;
    `);

    if (result.rows.length === 3) {
      console.log('✅ All columns verified:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type}, default: ${row.column_default})`);
      });
      console.log('\n🎉 Migration complete!\n');
    } else {
      console.error('❌ Some columns are missing!');
      console.error('Found:', result.rows.map(r => r.column_name));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
