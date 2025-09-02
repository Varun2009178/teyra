import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Anti-spam: Check if we sent a notification recently
    const recentNotification = await checkRecentNotification(user.id);
    if (recentNotification) {
      return NextResponse.json({ 
        shouldNotify: false,
        reason: 'Recent notification sent',
        lastNotification: recentNotification.sent_at
      });
    }

    // Check if user should receive a smart notification
    const shouldNotify = await checkNotificationTriggers(user.id);
    
    return NextResponse.json({ 
      shouldNotify,
      userId: user.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error checking smart notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate and send a personalized notification
    const notification = await generatePersonalizedNotification(user.id);
    
    if (notification) {
      // Send via Firebase (implement based on your setup)
      await sendFirebaseNotification(user.id, notification);
      
      // Track notification sent
      await trackNotificationSent(user.id, notification);
      
      return NextResponse.json({ 
        success: true,
        notification,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'No notification needed at this time'
      });
    }
  } catch (error) {
    console.error('❌ Error sending smart notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkNotificationTriggers(userId: string): Promise<boolean> {
  try {
    // Get user's recent activity and patterns
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20);

    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!tasks || !userProgress) return false;

    const now = new Date();
    const lastActivity = tasks[0]?.updated_at || userProgress.created_at;
    const hoursSinceActivity = (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);

    // Trigger conditions for smart notifications
    const triggers = {
      // User inactive for 4+ hours during active hours (9 AM - 8 PM)
      inactivityReminder: hoursSinceActivity >= 4 && isActiveHours(),
      
      // User has incomplete tasks and it's been 6+ hours
      incompleteTasksReminder: tasks.filter(t => !t.completed).length > 0 && hoursSinceActivity >= 6,
      
      // User completed many tasks recently (achievement notification)
      achievementCelebration: getRecentCompletionRate(tasks) > 0.8,
      
      // User struggling with completion (encouragement)
      encouragementNeeded: getRecentCompletionRate(tasks) < 0.3 && tasks.length > 3,
      
      // Daily check-in reminder (once per day)
      dailyCheckIn: shouldSendDailyCheckIn(userProgress),
      
      // Mood-based suggestion (if user hasn't set mood recently)
      moodSuggestion: shouldSuggestMoodCheck(userProgress)
    };

    // Return true if any trigger condition is met
    return Object.values(triggers).some(Boolean);

  } catch (error) {
    console.error('❌ Error checking notification triggers:', error);
    return false;
  }
}

async function generatePersonalizedNotification(userId: string): Promise<any | null> {
  try {
    // Get user data for personalization
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10);

    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!tasks || !userProgress) return null;

    const completedTasks = tasks.filter(t => t.completed);
    const incompleteTasks = tasks.filter(t => !t.completed);
    const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

    // Generate notification based on user patterns
    let notification = null;

    if (completionRate > 0.8 && completedTasks.length >= 3) {
      // High achiever - celebration
      notification = {
        title: '🏆 You\'re crushing it!',
        message: `Amazing work! You've completed ${completedTasks.length} tasks recently. Mike is so proud! 🌵`,
        type: 'achievement',
        data: { completionRate, completedCount: completedTasks.length }
      };
    } else if (completionRate < 0.3 && tasks.length > 2) {
      // Needs encouragement
      notification = {
        title: '💪 Small steps count!',
        message: 'Every task you complete helps Mike grow. Ready to tackle something small today? 🌱',
        type: 'encouragement',
        data: { completionRate, taskCount: tasks.length }
      };
    } else if (incompleteTasks.length > 0) {
      // Task reminder
      const taskTitle = incompleteTasks[0].title;
      notification = {
        title: '📝 Task waiting for you!',
        message: `"${taskTitle.length > 30 ? taskTitle.substring(0, 30) + '...' : taskTitle}" is ready to be completed!`,
        type: 'task_reminder',
        data: { taskId: incompleteTasks[0].id, taskTitle }
      };
    } else if (shouldSuggestMoodCheck(userProgress)) {
      // Mood check suggestion
      notification = {
        title: '💙 How are you feeling?',
        message: 'Take a moment to check in with your mood. It helps Mike suggest better tasks for you!',
        type: 'mood_checkin',
        data: { lastMoodUpdate: userProgress.last_mood_update }
      };
    }

    return notification;

  } catch (error) {
    console.error('❌ Error generating personalized notification:', error);
    return null;
  }
}

async function sendFirebaseNotification(userId: string, notification: any): Promise<boolean> {
  try {
    // This would integrate with your Firebase Cloud Messaging setup
    console.log(`🔔 Would send Firebase notification to ${userId}:`, notification);
    
    // Example implementation:
    // const admin = require('firebase-admin');
    // const message = {
    //   notification: {
    //     title: notification.title,
    //     body: notification.message
    //   },
    //   data: notification.data,
    //   topic: `user_${userId}` // or use FCM token
    // };
    // await admin.messaging().send(message);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending Firebase notification:', error);
    return false;
  }
}

async function trackNotificationSent(userId: string, notification: any): Promise<void> {
  try {
    // Track notification in database for analytics
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        notification_type: notification.type,
        title: notification.title,
        message: notification.message,
        sent_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('❌ Error tracking notification:', error);
  }
}

// Helper functions
function isActiveHours(): boolean {
  const hour = new Date().getHours();
  return hour >= 9 && hour <= 20; // 9 AM to 8 PM
}

function getRecentCompletionRate(tasks: any[]): number {
  if (tasks.length === 0) return 0;
  
  // Look at tasks from the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentTasks = tasks.filter(task => new Date(task.created_at) > oneDayAgo);
  
  if (recentTasks.length === 0) return 0;
  
  const completedRecent = recentTasks.filter(task => task.completed);
  return completedRecent.length / recentTasks.length;
}

function shouldSendDailyCheckIn(userProgress: any): boolean {
  if (!userProgress.last_email_sent) return true;
  
  const lastEmail = new Date(userProgress.last_email_sent);
  const now = new Date();
  const hoursSinceLastEmail = (now.getTime() - lastEmail.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastEmail >= 24; // Once per day
}

function shouldSuggestMoodCheck(userProgress: any): boolean {
  if (!userProgress.last_mood_update) return true;
  
  const lastMoodUpdate = new Date(userProgress.last_mood_update);
  const now = new Date();
  const hoursSinceLastMood = (now.getTime() - lastMoodUpdate.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastMood >= 12; // Suggest mood check every 12 hours
}

// Anti-spam function
async function checkRecentNotification(userId: string): Promise<any | null> {
  try {
    const { data: recentNotification } = await supabase
      .from('notification_logs')
      .select('sent_at, notification_type')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(1);

    if (!recentNotification || recentNotification.length === 0) {
      return null;
    }

    const lastNotification = recentNotification[0];
    const lastSent = new Date(lastNotification.sent_at);
    const now = new Date();
    const hoursSinceLastNotification = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

    // Anti-spam rules:
    // - No more than 1 notification per 2 hours
    // - No more than 3 notifications per day
    if (hoursSinceLastNotification < 2) {
      return lastNotification;
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount } = await supabase
      .from('notification_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('sent_at', today.toISOString());

    if (todayCount && todayCount >= 3) {
      return { sent_at: 'daily_limit_reached', type: 'rate_limit' };
    }

    return null;
  } catch (error) {
    console.error('❌ Error checking recent notifications:', error);
    return null;
  }
}