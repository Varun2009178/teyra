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

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
const devUrl = process.env.DEV_SUPABASE_URL;
const devKey = process.env.DEV_SUPABASE_ANON_KEY;
const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const prodKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Environment Variables:');
console.log(`   DEV_SUPABASE_URL: ${devUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   DEV_SUPABASE_ANON_KEY: ${devKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${prodUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${prodKey ? '✅ Set' : '❌ Missing'}`);

if (!devUrl || !devKey) {
  console.error('\n❌ Missing development environment variables!');
  console.error('💡 Please create a .env.development file with:');
  console.error('   DEV_SUPABASE_URL=your_dev_supabase_url');
  console.error('   DEV_SUPABASE_ANON_KEY=your_dev_supabase_anon_key');
  process.exit(1);
}

// Check URL format
if (!devUrl.startsWith('https://')) {
  console.error('\n❌ Invalid DEV_SUPABASE_URL format!');
  console.error('   URL should start with https://');
  console.error(`   Current: ${devUrl}`);
  process.exit(1);
}

// Check key format
if (!devKey.startsWith('eyJ')) {
  console.error('\n❌ Invalid DEV_SUPABASE_ANON_KEY format!');
  console.error('   Key should start with eyJ...');
  console.error(`   Current: ${devKey.substring(0, 20)}...`);
  process.exit(1);
}

console.log('\n🔗 Testing connection...');

// Initialize development Supabase client
const supabase = createClient(devUrl, devKey);

async function testConnection() {
  try {
    // Test connection by trying to access a non-existent table
    const { data, error } = await supabase.from('_dummy_test_').select('*').limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        console.log('✅ Successfully connected to development database!');
        console.log('   The error about missing table is expected - connection is working.');
        return true;
      } else if (error.message.includes('JWT') || error.message.includes('invalid')) {
        console.error('❌ Authentication error!');
        console.error('   Make sure you copied the "anon public" key, not the service role key.');
        console.error('   Go to your Supabase dashboard > Settings > API');
        return false;
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        console.error('❌ Network error!');
        console.error('   Check your DEV_SUPABASE_URL - make sure it\'s correct.');
        console.error(`   Current URL: ${devUrl}`);
        return false;
      } else {
        console.error('❌ Connection failed:', error.message);
        return false;
      }
    } else {
      console.log('✅ Successfully connected to development database!');
      return true;
    }
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

// Run the test
testConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Connection test passed!');
      console.log('\n📝 Next steps:');
      console.log('   1. Run "npm run setup:dev-db" to get the SQL for creating tables');
      console.log('   2. Copy the SQL and run it in your Supabase dashboard');
      console.log('   3. Run "npm run test:dev-env" to verify everything works');
    } else {
      console.log('\n❌ Connection test failed!');
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Check your Supabase project is active');
      console.log('   2. Verify you copied the correct URL and key');
      console.log('   3. Make sure you\'re using the "anon public" key, not service role');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });


