#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeDatabase() {
  console.log('🔍 COMPREHENSIVE DATABASE ANALYSIS');
  console.log('=====================================\n');

  let tasksByUser: { [key: string]: any[] } = {}; // Declare at function scope
  let orphanedTasks: any[] = [];
  let duplicateBehaviorIds: string[] = [];

  // 1. Analyze user_progress table
  console.log('👥 USER_PROGRESS TABLE ANALYSIS:');
  const { data: allUsers, error: usersError } = await supabase
    .from('user_progress')
    .select('user_id, created_at, current_mood, daily_mood_checks, is_locked')
    .order('created_at', { ascending: true });

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  console.log(`📊 Total users: ${allUsers?.length}`);
  
  // Group by creation date
  const usersByDate: { [key: string]: any[] } = {};
  allUsers?.forEach(user => {
    const date = new Date(user.created_at).toDateString();
    if (!usersByDate[date]) usersByDate[date] = [];
    usersByDate[date].push(user);
  });

  console.log('\n📅 Users by creation date:');
  Object.entries(usersByDate).forEach(([date, users]) => {
    console.log(`  ${date}: ${users.length} users`);
    if (users.length > 5) {
      console.log('    🚨 Suspicious: Many users created on same day');
    }
  });

  // 2. Check for duplicate user_ids
  const userIds = allUsers?.map(u => u.user_id) || [];
  const duplicateUserIds = userIds.filter((id, index) => userIds.indexOf(id) !== index);
  
  if (duplicateUserIds.length > 0) {
    console.log(`\n❌ DUPLICATE USER_IDS FOUND: ${duplicateUserIds.length}`);
    duplicateUserIds.forEach(id => {
      console.log(`  🔴 Duplicate: ${id}`);
    });
  } else {
    console.log('\n✅ No duplicate user_ids in user_progress');
  }

  // 3. Analyze tasks table
  console.log('\n📝 TASKS TABLE ANALYSIS:');
  const { data: allTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, user_id, title, completed, created_at')
    .order('created_at', { ascending: false });

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  } else {
    console.log(`📊 Total tasks: ${allTasks?.length}`);
    
    // Group tasks by user
    allTasks?.forEach(task => {
      if (!tasksByUser[task.user_id]) tasksByUser[task.user_id] = [];
      tasksByUser[task.user_id].push(task);
    });

    console.log(`📊 Tasks distributed among ${Object.keys(tasksByUser).length} users:`);
    
    // Find users with many tasks
    Object.entries(tasksByUser).forEach(([userId, tasks]) => {
      if (tasks.length > 3) {
        const completedCount = tasks.filter(t => t.completed).length;
        console.log(`  👤 ${userId.slice(-8)}: ${tasks.length} tasks (${completedCount} completed)`);
      }
    });

    // Find orphaned tasks
    const validUserIds = new Set(allUsers?.map(u => u.user_id));
    orphanedTasks = allTasks?.filter(task => !validUserIds.has(task.user_id)) || [];
    
    if (orphanedTasks.length > 0) {
      console.log(`\n❌ ORPHANED TASKS FOUND: ${orphanedTasks.length}`);
      orphanedTasks.forEach(task => {
        console.log(`  🔴 Task ${task.id}: "${task.title}" (User: ${task.user_id})`);
      });
    } else {
      console.log('\n✅ No orphaned tasks found');
    }
  }

  // 4. Check user_behavior_analysis table
  console.log('\n🧠 USER_BEHAVIOR_ANALYSIS TABLE:');
  const { data: behaviorData, error: behaviorError } = await supabase
    .from('user_behavior_analysis')
    .select('user_id, created_at')
    .order('created_at', { ascending: true });

  if (behaviorError) {
    if (behaviorError.message.includes('does not exist')) {
      console.log('⚠️  Table does not exist');
    } else {
      console.error('Error fetching behavior data:', behaviorError);
    }
  } else {
    console.log(`📊 Behavior records: ${behaviorData?.length}`);
    
    // Check for duplicates in behavior analysis
    const behaviorUserIds = behaviorData?.map(b => b.user_id) || [];
    duplicateBehaviorIds = behaviorUserIds.filter((id, index) => behaviorUserIds.indexOf(id) !== index);
    
    if (duplicateBehaviorIds.length > 0) {
      console.log(`❌ DUPLICATE BEHAVIOR RECORDS: ${duplicateBehaviorIds.length}`);
      duplicateBehaviorIds.forEach(id => {
        console.log(`  🔴 Duplicate behavior: ${id}`);
      });
    }
  }

  // 5. Check user_behavior_events table
  console.log('\n📊 USER_BEHAVIOR_EVENTS TABLE:');
  const { data: eventsData, error: eventsError } = await supabase
    .from('user_behavior_events')
    .select('user_id, event_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (eventsError) {
    if (eventsError.message.includes('does not exist')) {
      console.log('⚠️  Table does not exist');
    } else {
      console.error('Error fetching events data:', eventsError);
    }
  } else {
    const { count: eventsCount } = await supabase
      .from('user_behavior_events')
      .select('id', { count: 'exact', head: true });
    
    console.log(`📊 Total events: ${eventsCount}`);
    console.log('📋 Recent events:');
    eventsData?.slice(0, 5).forEach(event => {
      console.log(`  ${event.event_type} - ${event.user_id.slice(-8)} - ${new Date(event.created_at).toLocaleString()}`);
    });
  }

  // 6. Find users that might be test accounts
  console.log('\n🧪 POTENTIAL TEST ACCOUNTS:');
  if (allUsers) {
    const recentUsers = allUsers.filter(user => {
      const createdDate = new Date(user.created_at);
      const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation < 7; // Users created in last week
    });

    console.log(`📊 Users created in last 7 days: ${recentUsers.length}`);
    recentUsers.forEach(user => {
      const tasksForUser = tasksByUser[user.user_id] || [];
      console.log(`  👤 ${user.user_id.slice(-8)}: ${tasksForUser.length} tasks, mood: ${user.current_mood}, locked: ${user.is_locked}`);
    });
  }

  // 7. Summary and recommendations
  console.log('\n📋 SUMMARY & RECOMMENDATIONS:');
  console.log('===============================');
  
  const actualUserCount = allUsers?.length || 0;
  const expectedUserCount = 67;
  
  if (actualUserCount > expectedUserCount) {
    console.log(`🔍 Database has ${actualUserCount - expectedUserCount} extra users than expected`);
    console.log(`💡 These might be from development testing or duplicate accounts`);
  }
  
  if (orphanedTasks && orphanedTasks.length > 0) {
    console.log(`🧹 Should clean up ${orphanedTasks.length} orphaned tasks`);
  }
  
  if (duplicateUserIds.length > 0 || (behaviorData && duplicateBehaviorIds && duplicateBehaviorIds.length > 0)) {
    console.log(`🧹 Should clean up duplicate records`);
  }
  
  console.log('\n✅ Analysis complete!');
}

analyzeDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  });