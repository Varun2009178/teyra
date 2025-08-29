#!/usr/bin/env tsx

// Check for required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

console.log('🔍 Checking environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Please ensure your .env.local file contains all required variables.');
  console.error('📝 Check .env.example for the list of required variables.');
  process.exit(1);
}

import { clerkClient } from '@clerk/nextjs/server';
import { supabase } from '../src/lib/supabase';

// This script ONLY analyzes and reports orphaned data - it does NOT delete anything
async function analyzeOrphanedData() {
  console.log('🔍 Analyzing database for orphaned data (READ ONLY)...');
  
  try {
    // Get all user IDs from Supabase tables
    const [tasksResult, progressResult, checkinsResult] = await Promise.allSettled([
      supabase.from('tasks').select('user_id, id, title, created_at'),
      supabase.from('user_progress').select('user_id, id, current_mood, created_at'),
      supabase.from('daily_checkins').select('user_id, id, emotional_state, created_at')
    ]);

    const allUserData = {
      tasks: tasksResult.status === 'fulfilled' ? tasksResult.value.data || [] : [],
      progress: progressResult.status === 'fulfilled' ? progressResult.value.data || [] : [],
      checkins: checkinsResult.status === 'fulfilled' ? checkinsResult.value.data || [] : []
    };

    // Get unique user IDs
    const allUserIds = new Set<string>();
    allUserData.tasks.forEach(row => allUserIds.add(row.user_id));
    allUserData.progress.forEach(row => allUserIds.add(row.user_id));
    allUserData.checkins.forEach(row => allUserIds.add(row.user_id));

    console.log(`\n📊 Database Analysis:`);
    console.log(`   Total unique user IDs: ${allUserIds.size}`);
    console.log(`   Tasks records: ${allUserData.tasks.length}`);
    console.log(`   Progress records: ${allUserData.progress.length}`);
    console.log(`   Check-ins records: ${allUserData.checkins.length}`);

    const orphanedUserIds: string[] = [];
    const validUserIds: string[] = [];
    const userDetails: { [key: string]: { exists: boolean, tasks: number, progress: number, checkins: number } } = {};

    // Check each user ID against Clerk
    console.log(`\n🔍 Checking users against Clerk...`);
    for (const userId of allUserIds) {
      try {
        const user = await clerkClient.users.getUser(userId);
        validUserIds.push(userId);
        
        const taskCount = allUserData.tasks.filter(t => t.user_id === userId).length;
        const progressCount = allUserData.progress.filter(p => p.user_id === userId).length;
        const checkinCount = allUserData.checkins.filter(c => c.user_id === userId).length;
        
        userDetails[userId] = { 
          exists: true, 
          tasks: taskCount, 
          progress: progressCount, 
          checkins: checkinCount 
        };
        
        console.log(`   ✅ ${userId} (${user.emailAddresses[0]?.emailAddress}): ${taskCount} tasks, ${progressCount} progress, ${checkinCount} checkins`);
      } catch (error: any) {
        if (error.status === 404) {
          orphanedUserIds.push(userId);
          
          const taskCount = allUserData.tasks.filter(t => t.user_id === userId).length;
          const progressCount = allUserData.progress.filter(p => p.user_id === userId).length;
          const checkinCount = allUserData.checkins.filter(c => c.user_id === userId).length;
          
          userDetails[userId] = { 
            exists: false, 
            tasks: taskCount, 
            progress: progressCount, 
            checkins: checkinCount 
          };
          
          console.log(`   ❌ ${userId} (ORPHANED): ${taskCount} tasks, ${progressCount} progress, ${checkinCount} checkins`);
        } else {
          console.error(`   ⚠️  Error checking user ${userId}:`, error.message);
        }
      }
    }

    console.log(`\n📈 Summary Report:`);
    console.log(`   Valid users in Clerk: ${validUserIds.length}`);
    console.log(`   Orphaned users (not in Clerk): ${orphanedUserIds.length}`);

    if (orphanedUserIds.length > 0) {
      console.log(`\n🗑️  ORPHANED DATA DETECTED:`);
      let totalOrphanedTasks = 0;
      let totalOrphanedProgress = 0;
      let totalOrphanedCheckins = 0;

      orphanedUserIds.forEach(userId => {
        const details = userDetails[userId];
        totalOrphanedTasks += details.tasks;
        totalOrphanedProgress += details.progress;
        totalOrphanedCheckins += details.checkins;
        
        console.log(`     User ID: ${userId}`);
        console.log(`       - ${details.tasks} tasks`);
        console.log(`       - ${details.progress} progress records`);
        console.log(`       - ${details.checkins} check-ins`);
      });

      console.log(`\n   Total orphaned records:`);
      console.log(`     - ${totalOrphanedTasks} tasks`);
      console.log(`     - ${totalOrphanedProgress} progress records`);
      console.log(`     - ${totalOrphanedCheckins} check-ins`);
      
      console.log(`\n⚠️  To clean up this data, run:`);
      console.log(`   npm run cleanup:orphaned`);
      console.log(`   (CAUTION: This will permanently delete the orphaned data)`);
    } else {
      console.log(`\n🎉 No orphaned data found! Database is clean.`);
    }

    console.log(`\n✅ Analysis completed. No data was modified.`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeOrphanedData()
  .then(() => {
    console.log('✅ Analysis script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis script failed:', error);
    process.exit(1);
  });