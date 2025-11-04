#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.development');
dotenv.config({ path: envPath });

// Fallback to .env.local if .env.development doesn't exist
if (!process.env.DEV_SUPABASE_URL) {
  const localEnvPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: localEnvPath });
}

import { createClient } from '@supabase/supabase-js';
import { createClerkClient } from '@clerk/clerk-sdk-node';

console.log('🧪 Testing Development Environment Setup...\n');

// Check environment variables
const requiredEnvVars = [
  'DEV_SUPABASE_URL',
  'DEV_SUPABASE_ANON_KEY',
  'CLERK_SECRET_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Please create a .env.development file with your development credentials.');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(
  process.env.DEV_SUPABASE_URL!,
  process.env.DEV_SUPABASE_ANON_KEY!
);

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!
});

async function testDevelopmentEnvironment() {
  try {
    console.log('🔗 Testing Supabase connection...');
    
    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('count', { count: 'exact' });
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test all tables
    console.log('\n📋 Testing database tables...');
    const tables = ['tasks', 'user_progress', 'daily_checkins', 'moods'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact' });
        
        if (error) {
          console.error(`❌ ${table} table test failed:`, error.message);
        } else {
          console.log(`✅ ${table} table is accessible (${data || 0} records)`);
        }
      } catch (err) {
        console.error(`❌ ${table} table test failed:`, err);
      }
    }
    
    // Test Clerk connection
    console.log('\n👤 Testing Clerk connection...');
    try {
      const userCount = await clerkClient.users.getCount();
      console.log(`✅ Clerk connection successful (${userCount} users total)`);
    } catch (error: any) {
      console.error('❌ Clerk connection failed:', error.message);
      return false;
    }
    
    // Test environment variable configuration
    console.log('\n⚙️  Environment Configuration:');
    console.log(`   Supabase URL: ${process.env.DEV_SUPABASE_URL?.substring(0, 30)}...`);
    console.log(`   Supabase Key: ${process.env.DEV_SUPABASE_ANON_KEY?.substring(0, 20)}...`);
    console.log(`   Clerk Key: ${process.env.CLERK_SECRET_KEY?.substring(0, 20)}...`);
    
    // Check if we're using development vs production
    const isUsingDevSupabase = process.env.DEV_SUPABASE_URL !== process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (isUsingDevSupabase) {
      console.log('✅ Using separate development Supabase project');
    } else {
      console.warn('⚠️  Using same Supabase project for dev and production');
      console.warn('   Consider creating a separate development project');
    }
    
    console.log('\n🎉 Development environment test completed successfully!');
    console.log('\n📝 You can now:');
    console.log('   - Run "npm run dev" to start development');
    console.log('   - Test user sync with "npm run user-sync analyze"');
    console.log('   - Create test data without affecting production');
    
    return true;
    
  } catch (error) {
    console.error('❌ Environment test failed:', error);
    return false;
  }
}

// Run the test
testDevelopmentEnvironment()
  .then((success) => {
    if (success) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please check the setup.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });


