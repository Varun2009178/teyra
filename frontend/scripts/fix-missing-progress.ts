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

async function fixMissingUserProgress() {
  console.log('🔧 Fixing missing user_progress records...\n');
  
  try {
    // Get all users from Clerk
    const totalCount = await clerkClient.users.getCount();
    const clerkUsers = await clerkClient.users.getUserList({
      limit: totalCount > 100 ? totalCount : 100
    });
    
    console.log(`📊 Found ${clerkUsers.length} users in Clerk`);

    // Get existing user_progress records
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('user_id');
    
    const existingUserIds = new Set((existingProgress || []).map(p => p.user_id));
    console.log(`📊 Found ${existingUserIds.size} existing user_progress records`);

    // Find users missing progress records
    const missingProgressUsers = clerkUsers.filter(user => !existingUserIds.has(user.id));
    
    console.log(`\n⚠️  Users missing user_progress records: ${missingProgressUsers.length}`);

    if (missingProgressUsers.length === 0) {
      console.log('🎉 All users already have progress records!');
      return;
    }

    console.log('\n🔄 Creating missing user_progress records...');

    let successCount = 0;
    let errorCount = 0;

    for (const user of missingProgressUsers) {
      try {
        const email = user.emailAddresses[0]?.emailAddress || 'no-email';
        console.log(`   Creating progress for: ${user.id} (${email})`);

        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            current_mood: 'neutral',
            daily_mood_checks: 0,
            daily_ai_splits: 0,
            last_mood_update: new Date().toISOString(),
            last_reset_date: new Date().toISOString(),
            is_locked: false,
            daily_start_time: null
          });

        if (error) {
          console.error(`   ❌ Error for ${user.id}:`, error.message);
          errorCount++;
        } else {
          console.log(`   ✅ Created progress record for ${user.id}`);
          successCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ Exception for ${user.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Successfully created: ${successCount} records`);
    console.log(`   ❌ Failed: ${errorCount} records`);
    console.log(`   📊 Total processed: ${missingProgressUsers.length} users`);

    if (successCount > 0) {
      console.log(`\n🎉 Successfully synchronized ${successCount} users!`);
    }

    if (errorCount > 0) {
      console.log(`\n⚠️  ${errorCount} users still need manual attention.`);
    }

    console.log('\n✅ Fix completed.');

  } catch (error) {
    console.error('❌ Error during fix:', error);
    process.exit(1);
  }
}

// Run the fix
fixMissingUserProgress()
  .then(() => {
    console.log('✅ Missing progress fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Missing progress fix failed:', error);
    process.exit(1);
  });