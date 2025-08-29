#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function checkEnvironment() {
  console.log('🔍 Environment Configuration Check\n');

  // Check basic env vars
  const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT SET',
    'CLERK_WEBHOOK_SECRET': process.env.CLERK_WEBHOOK_SECRET ? 'SET' : 'NOT SET'
  };

  console.log('📋 Environment Variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  // Determine environment based on Clerk publishable key
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  let environment = 'unknown';
  
  if (publishableKey) {
    if (publishableKey.includes('test_')) {
      environment = 'development';
    } else if (publishableKey.includes('live_')) {
      environment = 'production';
    }
  }

  console.log(`\n🌐 Detected Environment: ${environment.toUpperCase()}`);

  // Test connections
  console.log('\n🔗 Testing Connections...');
  
  try {
    // Test Clerk connection
    const { createClerkClient } = await import('@clerk/clerk-sdk-node');
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!
    });
    
    const userCount = await clerkClient.users.getCount();
    console.log(`   ✅ Clerk: ${userCount} users found`);
    
    // Test Supabase connection  
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: tasks, error } = await supabase.from('tasks').select('count', { count: 'exact' });
    if (error) throw error;
    
    const { data: progress } = await supabase.from('user_progress').select('count', { count: 'exact' });
    
    console.log(`   ✅ Supabase: ${tasks.count || 0} tasks, ${progress?.count || 0} progress records`);
    
  } catch (error) {
    console.error('   ❌ Connection Error:', error);
  }

  console.log('\n💡 Recommendations:');
  
  if (environment === 'development') {
    console.log('   🧪 You\'re in DEVELOPMENT mode');
    console.log('   - Safe to test user deletion');
    console.log('   - Webhook testing: npm run test:webhook');
    console.log('   - Create test users to verify deletion flow');
  } else if (environment === 'production') {
    console.log('   🚀 You\'re in PRODUCTION mode');
    console.log('   - ⚠️  BE CAREFUL with user deletion testing');
    console.log('   - Use webhook simulation: npm run test:webhook');
    console.log('   - Consider creating a test user first');
  } else {
    console.log('   ❓ Environment unclear - check your Clerk keys');
  }

  console.log('\n🔧 Available Testing Commands:');
  console.log('   npm run test:webhook      - Test webhook deletion flow safely');
  console.log('   npm run sync:analyze      - Check user synchronization');
  console.log('   npm run analyze:database  - Analyze orphaned data');
}

checkEnvironment()
  .then(() => console.log('\n✅ Environment check completed'))
  .catch(error => {
    console.error('❌ Environment check failed:', error);
    process.exit(1);
  });