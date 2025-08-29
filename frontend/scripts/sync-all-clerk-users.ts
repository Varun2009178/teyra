#!/usr/bin/env ts-node

/**
 * Sync All Clerk Users to Database
 * 
 * This script fetches all users from both development and production Clerk instances
 * and ensures they have corresponding user_progress records in the database.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Clerk configuration
const PRODUCTION_CLERK_SECRET = 'your_production_clerk_secret_key_here'; // Replace with actual production key
const DEVELOPMENT_CLERK_SECRET = process.env.CLERK_SECRET_KEY!;

interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string; }>;
  createdAt: number;
  environment: 'development' | 'production';
}

async function createUserProgress(userId: string) {
  try {
    console.log(`👤 Creating user progress for ${userId}`);

    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        current_mood: 'neutral',
        daily_mood_checks: 0,
        last_mood_update: new Date().toISOString(),
        last_reset_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Check if user already exists
      if (error.message.includes('duplicate key')) {
        console.log(`✅ User ${userId} already exists in database`);
        return true;
      }
      throw error;
    }

    console.log(`✅ Created user progress for ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating user progress for ${userId}:`, error);
    return false;
  }
}

async function fetchClerkUsers(secretKey: string, environment: 'development' | 'production'): Promise<ClerkUser[]> {
  try {
    console.log(`🔍 Fetching users from ${environment} Clerk...`);
    
    // Note: You'll need to use Clerk's REST API directly for production
    // For now, this will only work with the current environment
    if (environment === 'development') {
      const users = await clerkClient.users.getUserList({ limit: 500 });
      return users.data.map(user => ({
        id: user.id,
        emailAddresses: user.emailAddresses,
        createdAt: user.createdAt,
        environment
      }));
    } else {
      console.log(`⚠️  Production Clerk sync requires manual setup with production secret key`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching ${environment} users:`, error);
    return [];
  }
}

async function syncUsersToDatabase() {
  console.log('🚀 Starting Clerk users sync to database...\n');
  
  // Fetch users from both environments
  const devUsers = await fetchClerkUsers(DEVELOPMENT_CLERK_SECRET, 'development');
  const prodUsers = await fetchClerkUsers(PRODUCTION_CLERK_SECRET, 'production');
  
  const allUsers = [...devUsers, ...prodUsers];
  console.log(`📊 Total users found: ${allUsers.length} (Dev: ${devUsers.length}, Prod: ${prodUsers.length})\n`);
  
  if (allUsers.length === 0) {
    console.log('❌ No users found to sync');
    return;
  }
  
  // Check existing users in database
  console.log('🔍 Checking existing users in database...');
  const { data: existingUsers, error: fetchError } = await supabase
    .from('user_progress')
    .select('user_id');
  
  if (fetchError) {
    console.error('❌ Error fetching existing users:', fetchError);
    return;
  }
  
  const existingUserIds = new Set(existingUsers?.map(u => u.user_id) || []);
  console.log(`📋 Found ${existingUserIds.size} existing users in database\n`);
  
  // Sync users
  let createdCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  
  console.log('🔄 Syncing users...');
  for (const user of allUsers) {
    if (existingUserIds.has(user.id)) {
      console.log(`⏩ Skipping ${user.id} (${user.environment}) - already exists`);
      skippedCount++;
      continue;
    }
    
    const success = await createUserProgress(user.id);
    if (success) {
      createdCount++;
      console.log(`✅ Synced ${user.id} (${user.environment}) - ${user.emailAddresses[0]?.emailAddress || 'no email'}`);
    } else {
      failedCount++;
    }
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Sync Summary:');
  console.log(`✅ Created: ${createdCount} users`);
  console.log(`⏩ Skipped: ${skippedCount} users (already existed)`);
  console.log(`❌ Failed: ${failedCount} users`);
  console.log(`📋 Total processed: ${allUsers.length} users`);
  
  if (prodUsers.length === 0) {
    console.log('\n⚠️  Note: Production users were not synced. To sync production users:');
    console.log('1. Update PRODUCTION_CLERK_SECRET in this script');
    console.log('2. Implement Clerk REST API calls for production environment');
    console.log('3. Re-run this script');
  }
}

// Run the sync
syncUsersToDatabase()
  .then(() => {
    console.log('\n🎉 Sync completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Sync failed:', error);
    process.exit(1);
  });