/**
 * Script to test user cleanup functionality
 * 
 * Usage:
 * 1. Check user data: npx tsx scripts/test-user-cleanup.ts check <user_id>
 * 2. Clean up user: npx tsx scripts/test-user-cleanup.ts cleanup <user_id>
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserData(userId: string) {
  console.log(`🔍 Checking data for user: ${userId}`);
  
  const tables = ['tasks', 'user_progress', 'user_behavior_events', 'user_behavior_analysis'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .eq('user_id', userId);
      
      if (error) {
        console.log(`❌ Error checking ${table}:`, error.message);
      } else {
        console.log(`📋 ${table}: ${count || data?.length || 0} records`);
        if (data && data.length > 0 && data.length <= 5) {
          console.log(`   Sample data:`, data.slice(0, 2));
        }
      }
    } catch (error) {
      console.log(`❌ Exception checking ${table}:`, error);
    }
  }
}

async function cleanupUser(userId: string) {
  console.log(`🧹 Starting cleanup for user: ${userId}`);
  
  // First check what exists
  await checkUserData(userId);
  
  console.log(`\n🗑️  Starting deletion...`);
  
  const tables = ['tasks', 'user_progress', 'user_behavior_events', 'user_behavior_analysis'];
  
  for (const table of tables) {
    try {
      console.log(`Deleting from ${table}...`);
      
      const { data, error, count } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.log(`❌ Error deleting from ${table}:`, error.message);
      } else {
        console.log(`✅ Deleted ${count || 'unknown'} records from ${table}`);
      }
    } catch (error) {
      console.log(`❌ Exception deleting from ${table}:`, error);
    }
  }
  
  console.log(`\n🔍 Verification - checking if data still exists...`);
  await checkUserData(userId);
}

async function main() {
  const [,, action, userId] = process.argv;
  
  if (!action || !userId) {
    console.log('Usage:');
    console.log('  Check user data: npx tsx scripts/test-user-cleanup.ts check <user_id>');
    console.log('  Clean up user:   npx tsx scripts/test-user-cleanup.ts cleanup <user_id>');
    process.exit(1);
  }
  
  try {
    switch (action) {
      case 'check':
        await checkUserData(userId);
        break;
      case 'cleanup':
        await cleanupUser(userId);
        break;
      default:
        console.error('❌ Invalid action. Use "check" or "cleanup"');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  }
}

main();