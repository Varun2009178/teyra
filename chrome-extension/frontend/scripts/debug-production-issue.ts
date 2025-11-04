#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function debugProductionIssue() {
  console.log('🔍 Debugging production issue...\n');

  try {
    // Check environment
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const environment = publishableKey?.includes('live_') ? 'PRODUCTION' : 'DEVELOPMENT';
    console.log(`🌐 Current Environment: ${environment}`);

    // Test Clerk connection
    console.log('\n🔗 Testing Clerk connection...');
    const { createClerkClient } = await import('@clerk/clerk-sdk-node');
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!
    });
    
    const userCount = await clerkClient.users.getCount();
    console.log(`   ✅ Clerk: ${userCount} users found`);

    // Test Supabase connection
    console.log('\n🗄️  Testing Supabase connection...');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: tasks, error } = await supabase.from('tasks').select('count', { count: 'exact' });
    if (error) throw error;
    
    const { data: progress } = await supabase.from('user_progress').select('count', { count: 'exact' });
    
    console.log(`   ✅ Supabase: ${tasks.count || 0} tasks, ${progress?.count || 0} progress records`);

    // Check for potential orphaned data
    console.log('\n🕵️  Looking for potential issues...');
    
    // Get a sample of user_progress records to see what user IDs exist
    const { data: sampleProgress } = await supabase
      .from('user_progress')
      .select('user_id')
      .limit(5);
    
    if (sampleProgress && sampleProgress.length > 0) {
      console.log('   📊 Sample user IDs in Supabase:');
      for (const record of sampleProgress) {
        try {
          // Check if this user exists in Clerk
          await clerkClient.users.getUser(record.user_id);
          console.log(`      ✅ ${record.user_id} - exists in Clerk`);
        } catch (error: any) {
          if (error.status === 404) {
            console.log(`      ❌ ${record.user_id} - MISSING from Clerk (orphaned)`);
          } else {
            console.log(`      ⚠️  ${record.user_id} - error checking: ${error.message}`);
          }
        }
      }
    }

    // Check for any users who might be signed in but don't exist in DB
    console.log('\n💡 Possible Issues:');
    console.log('   1. If app crashes on load, there might be a user signed in who has no Supabase data');
    console.log('   2. Check browser Application > Local Storage and clear Clerk data');
    console.log('   3. The webhook might not be configured for production Clerk environment');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

debugProductionIssue()
  .then(() => console.log('\n✅ Debug completed'))
  .catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });