#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 Checking current database structure...\n');

    // Check key tables by trying to query them
    const keyTables = ['tasks', 'user_progress', 'user_behavior_events', 'user_moods', 'user_behavior_analysis'];
    const existingTables: string[] = [];
    
    console.log('📋 Checking which tables exist:\n');

    for (const tableName of keyTables) {
      try {
        // Try to select from table (limit 0 to just check structure)
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);

        if (error) {
          console.log(`❌ ${tableName}: NOT FOUND (${error.message})`);
        } else {
          console.log(`✅ ${tableName}: EXISTS`);
          existingTables.push(tableName);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ERROR checking`);
      }
    }

    console.log('\n🔍 Sample data from existing tables:\n');

    // Check sample data from existing tables
    for (const tableName of existingTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);

        if (error) {
          console.log(`${tableName}: Error - ${error.message}`);
        } else {
          console.log(`📊 ${tableName}: ${data?.length || 0} sample records`);
          if (data && data.length > 0) {
            const firstRecord = data[0];
            const columns = Object.keys(firstRecord);
            console.log(`   Columns: ${columns.join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`${tableName}: Error checking data`);
      }
      console.log('');
    }

    // Recommendations
    console.log('💡 Recommendations:');
    console.log('✅ KEEP: tasks, user_progress, user_behavior_events');
    console.log('🤔 OPTIONAL: user_moods (if you want mood tracking)');
    console.log('🗑️  REMOVE: user_behavior_analysis (not needed for MVP)');

    console.log('\n✅ Database structure check complete!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkTables();