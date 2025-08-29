#!/usr/bin/env tsx

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { createClient } from '@supabase/supabase-js';
import { createClerkClient } from '@clerk/clerk-sdk-node';

// Check for required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'CLERK_SECRET_KEY'
];

console.log('🔍 Checking environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!
});

async function analyzeUserSync() {
  console.log('👥 Analyzing user synchronization between Clerk and Supabase...\n');
  
  try {
    // Get all users from Clerk
    console.log('📋 Fetching users from Clerk...');
    
    // Get total count first
    const totalCount = await clerkClient.users.getCount();
    console.log(`📊 Total users in Clerk: ${totalCount}`);
    
    // Get all users (the API returns an array directly)
    const clerkUsers = await clerkClient.users.getUserList({
      limit: totalCount > 100 ? totalCount : 100 // Get all users
    });
    
    console.log(`✅ Found ${clerkUsers.length} users in Clerk`);
    
    // Display Clerk users
    console.log('\n👤 Clerk Users:');
    clerkUsers.forEach((user, index) => {
      const email = user.emailAddresses[0]?.emailAddress || 'no-email';
      const createdAt = new Date(user.createdAt).toLocaleDateString();
      console.log(`   ${index + 1}. ${user.id} (${email}) - Created: ${createdAt}`);
    });

    // Get all user data from Supabase
    console.log('\n📋 Fetching users from Supabase...');
    const [tasksResult, progressResult] = await Promise.allSettled([
      supabase.from('tasks').select('user_id, id, title, created_at'),
      supabase.from('user_progress').select('user_id, id, current_mood, created_at')
    ]);

    const supabaseData = {
      tasks: tasksResult.status === 'fulfilled' ? tasksResult.value.data || [] : [],
      progress: progressResult.status === 'fulfilled' ? progressResult.value.data || [] : []
    };

    // Get unique user IDs from Supabase
    const supabaseUserIds = new Set<string>();
    supabaseData.tasks.forEach(row => supabaseUserIds.add(row.user_id));
    supabaseData.progress.forEach(row => supabaseUserIds.add(row.user_id));

    console.log(`✅ Found ${supabaseUserIds.size} unique users in Supabase`);
    
    // Create sets for comparison
    const clerkUserIds = new Set(clerkUsers.map(user => user.id));
    
    // Find users only in Clerk (should have Supabase data created)
    const clerkOnlyUsers = Array.from(clerkUserIds).filter(id => !supabaseUserIds.has(id));
    
    // Find users only in Supabase (orphaned data)
    const supabaseOnlyUsers = Array.from(supabaseUserIds).filter(id => !clerkUserIds.has(id));
    
    // Find users in both (properly synced)
    const syncedUsers = Array.from(clerkUserIds).filter(id => supabaseUserIds.has(id));

    console.log('\n📊 Synchronization Analysis:');
    console.log(`   🔗 Properly synced users: ${syncedUsers.length}`);
    console.log(`   ⚠️  Users in Clerk but missing Supabase data: ${clerkOnlyUsers.length}`);
    console.log(`   🗑️  Users in Supabase but not in Clerk (orphaned): ${supabaseOnlyUsers.length}`);

    // Show properly synced users
    if (syncedUsers.length > 0) {
      console.log('\n✅ Properly Synced Users:');
      syncedUsers.forEach(userId => {
        const clerkUser = clerkUsers.find(u => u.id === userId);
        const email = clerkUser?.emailAddresses[0]?.emailAddress || 'no-email';
        const taskCount = supabaseData.tasks.filter(t => t.user_id === userId).length;
        const hasProgress = supabaseData.progress.some(p => p.user_id === userId);
        console.log(`   ✅ ${userId} (${email}): ${taskCount} tasks, ${hasProgress ? 'has' : 'no'} progress`);
      });
    }

    // Show users missing from Supabase (webhook likely failed)
    if (clerkOnlyUsers.length > 0) {
      console.log('\n⚠️  Users in Clerk but Missing Supabase Data:');
      clerkOnlyUsers.forEach(userId => {
        const clerkUser = clerkUsers.find(u => u.id === userId);
        const email = clerkUser?.emailAddresses[0]?.emailAddress || 'no-email';
        const createdAt = clerkUser ? new Date(clerkUser.createdAt).toLocaleDateString() : 'unknown';
        console.log(`   ⚠️  ${userId} (${email}) - Created: ${createdAt}`);
        console.log(`       ❌ Missing user_progress record (webhook likely failed)`);
      });
    }

    // Show orphaned users in Supabase
    if (supabaseOnlyUsers.length > 0) {
      console.log('\n🗑️  Orphaned Users in Supabase (Not in Clerk):');
      supabaseOnlyUsers.forEach(userId => {
        const taskCount = supabaseData.tasks.filter(t => t.user_id === userId).length;
        const hasProgress = supabaseData.progress.some(p => p.user_id === userId);
        console.log(`   🗑️  ${userId}: ${taskCount} tasks, ${hasProgress ? 'has' : 'no'} progress`);
        console.log(`       ❌ User deleted from Clerk but data remains in Supabase`);
      });
    }

    console.log('\n🔧 Recommended Actions:');
    
    if (clerkOnlyUsers.length > 0) {
      console.log(`   1. Create missing user_progress records for ${clerkOnlyUsers.length} Clerk users:`);
      console.log(`      npm run fix:missing-progress`);
    }
    
    if (supabaseOnlyUsers.length > 0) {
      console.log(`   2. Clean up orphaned data for ${supabaseOnlyUsers.length} deleted users:`);
      console.log(`      npm run cleanup:orphaned`);
    }
    
    if (clerkOnlyUsers.length === 0 && supabaseOnlyUsers.length === 0) {
      console.log('   🎉 All users are properly synchronized!');
    }

    console.log('\n✅ Analysis completed.');

  } catch (error) {
    console.error('❌ Error during sync analysis:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeUserSync()
  .then(() => {
    console.log('✅ User sync analysis completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ User sync analysis failed:', error);
    process.exit(1);
  });