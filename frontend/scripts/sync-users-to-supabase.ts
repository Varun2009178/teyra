#!/usr/bin/env tsx

/**
 * Force sync all Clerk users to Supabase
 * Run this to fix missing users in your database
 */

import { clerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncUsersToSupabase() {
  try {
    console.log('🔄 Starting user sync from Clerk to Supabase...');
    
    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 100, // Adjust if you have more users
    });
    
    console.log(`📊 Found ${clerkUsers.length} users in Clerk`);
    
    let syncedCount = 0;
    let errors = 0;
    
    for (const clerkUser of clerkUsers) {
      try {
        const userId = clerkUser.id;
        const email = clerkUser.emailAddresses[0]?.emailAddress || 'unknown@example.com';
        const firstName = clerkUser.firstName || 'Unknown';
        const lastName = clerkUser.lastName || 'User';
        
        console.log(`👤 Processing user: ${firstName} ${lastName} (${email})`);
        
        // Check if user already exists in user_progress
        const { data: existingUser } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (existingUser) {
          console.log(`✅ User ${userId.slice(-8)} already exists in Supabase`);
          continue;
        }
        
        // Create user in user_progress
        const { error: progressError } = await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            daily_start_time: new Date().toISOString(),
            total_points: 0,
            tasks_completed: 0,
            mood_selections: 0,
            ai_splits_used: 0,
            notifications_enabled: true,
            email_notifications_enabled: true
          });
        
        if (progressError) {
          console.error(`❌ Error creating user_progress for ${userId.slice(-8)}:`, progressError);
          errors++;
          continue;
        }
        
        // Create user in user_behavior_analysis (if table exists)
        try {
          const { error: behaviorError } = await supabase
            .from('user_behavior_analysis')
            .insert({
              user_id: userId,
              analysis_data: {},
              last_updated: new Date().toISOString()
            });
          
          if (behaviorError) {
            console.warn(`⚠️ Could not create user_behavior_analysis for ${userId.slice(-8)}:`, behaviorError.message);
          }
        } catch (e) {
          console.warn(`⚠️ user_behavior_analysis table might not exist`);
        }
        
        // Create user in user_ai_patterns (if table exists)
        try {
          const { error: aiError } = await supabase
            .from('user_ai_patterns')
            .insert({
              user_id: userId,
              patterns: {},
              consistency_score: 0,
              productivity_peaks: [],
              mood_patterns: {},
              task_preferences: {}
            });
          
          if (aiError) {
            console.warn(`⚠️ Could not create user_ai_patterns for ${userId.slice(-8)}:`, aiError.message);
          }
        } catch (e) {
          console.warn(`⚠️ user_ai_patterns table might not exist`);
        }
        
        syncedCount++;
        console.log(`✅ Successfully synced user ${userId.slice(-8)} to Supabase`);
        
      } catch (userError) {
        console.error(`❌ Error processing user ${clerkUser.id?.slice(-8)}:`, userError);
        errors++;
      }
    }
    
    console.log('\n🎯 Sync completed!');
    console.log(`✅ Successfully synced: ${syncedCount} users`);
    console.log(`❌ Errors: ${errors}`);
    
    // Verify the sync
    const { data: supabaseUsers, error: countError } = await supabase
      .from('user_progress')
      .select('user_id');
    
    if (countError) {
      console.error('❌ Error counting Supabase users:', countError);
    } else {
      console.log(`📊 Total users in Supabase after sync: ${supabaseUsers?.length || 0}`);
      console.log(`📊 Total users in Clerk: ${clerkUsers.length}`);
      
      if (supabaseUsers?.length === clerkUsers.length) {
        console.log('🎉 Perfect! All users are now synced!');
      } else {
        console.log('⚠️ Some users may still be missing. Check the errors above.');
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
  }
}

// Run the sync
syncUsersToSupabase().catch(console.error);
