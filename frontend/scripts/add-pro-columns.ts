import { config } from 'dotenv';
import pg from 'pg';

config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addProColumns() {
  const client = await pool.connect();

  try {
    console.log('🔄 Adding Pro subscription columns to user_progress table...');

    await client.query(`
      ALTER TABLE user_progress
      ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
      ADD COLUMN IF NOT EXISTS pro_since TIMESTAMP WITH TIME ZONE;
    `);

    console.log('✅ Successfully added Pro subscription columns!');

    // Verify columns were added
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_progress'
      AND column_name IN ('is_pro', 'stripe_customer_id', 'stripe_subscription_id', 'pro_since');
    `);

    console.log('\n📊 Columns added:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error adding Pro columns:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addProColumns();
