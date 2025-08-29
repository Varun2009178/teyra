import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting immediate sync of ALL users from Clerk to Supabase...');
    
    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 100, // Adjust if you have more users
    });
    
    console.log(`📊 Found ${clerkUsers.length} users in Clerk`);
    
    let syncedCount = 0;
    let errors = 0;
    let existingCount = 0;
    
    for (const clerkUser of clerkUsers) {
      try {
        const userId = clerkUser.id;
        const email = clerkUser.emailAddresses[0]?.emailAddress || 'unknown@example.com';
        const firstName = clerkUser.firstName || 'Unknown';
        const lastName = clerkUser.lastName || 'User';
        
        console.log(`👤 Processing user: ${firstName} ${lastName} (${email})`);
        
        // Check if user already exists in user_progress
        const { data: existingUser, error: checkError } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`❌ Error checking user ${userId.slice(-8)}:`, checkError);
          errors++;
          continue;
        }
        
        if (existingUser) {
          console.log(`✅ User ${userId.slice(-8)} already exists in Supabase`);
          existingCount++;
          continue;
        }
        
        // User doesn't exist - create them in all tables
        console.log(`🆕 Creating new user ${userId.slice(-8)} in Supabase`);
        
        // 1. Create in user_progress
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
        
        // 2. Create in user_ai_patterns
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
        
        // 3. Create in user_behavior (if table exists)
        try {
          const { error: behaviorError } = await supabase
            .from('user_behavior')
            .insert({
              user_id: userId,
              action: 'user_created',
              data: { email, firstName, lastName },
              timestamp: new Date().toISOString()
            });
          
          if (behaviorError) {
            console.warn(`⚠️ Could not create user_behavior for ${userId.slice(-8)}:`, behaviorError.message);
          }
        } catch (e) {
          console.warn(`⚠️ user_behavior table might not exist`);
        }
        
        syncedCount++;
        console.log(`✅ Successfully synced user ${userId.slice(-8)} to Supabase`);
        
      } catch (userError) {
        console.error(`❌ Error processing user ${clerkUser.id?.slice(-8)}:`, userError);
        errors++;
      }
    }
    
    console.log('\n🎯 Sync completed!');
    console.log(`✅ Successfully synced: ${syncedCount} new users`);
    console.log(`✅ Already existed: ${existingCount} users`);
    console.log(`❌ Errors: ${errors}`);
    
    // Verify the final sync
    const { data: finalSupabaseUsers, error: countError } = await supabase
      .from('user_progress')
      .select('user_id');
    
    if (countError) {
      console.error('❌ Error counting final Supabase users:', countError);
    } else {
      console.log(`📊 Final count: ${finalSupabaseUsers?.length || 0} users in Supabase`);
      console.log(`📊 Clerk users: ${clerkUsers.length}`);
      
      if (finalSupabaseUsers?.length === clerkUsers.length) {
        console.log('🎉 Perfect! All users are now synced!');
      } else {
        console.log('⚠️ Some users may still be missing. Check the errors above.');
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'All users synced from Clerk to Supabase',
      stats: {
        clerkUsers: clerkUsers.length,
        supabaseUsers: finalSupabaseUsers?.length || 0,
        newlySynced: syncedCount,
        alreadyExisted: existingCount,
        errors
      }
    });
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    return NextResponse.json({ 
      error: 'Failed to sync users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
