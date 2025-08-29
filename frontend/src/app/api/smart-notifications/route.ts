import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Send smart notification based on user behavior
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's behavior analysis and current mood
    const [{ data: analysis, error: analysisError }, { data: userProgress }] = await Promise.all([
      supabase
        .from('user_behavior_analysis')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('user_progress')
        .select('current_mood, daily_mood_checks')
        .eq('user_id', user.id)
        .single()
    ]);

    if (analysisError) {
      console.error('Error fetching behavior analysis:', analysisError);
      return NextResponse.json({ error: 'Could not fetch behavior analysis' }, { status: 500 });
    }

    if (!analysis) {
      return NextResponse.json({ error: 'No behavior analysis found' }, { status: 404 });
    }

    // Get current user tasks
    const { data: currentTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json({ error: 'Could not fetch tasks' }, { status: 500 });
    }

    // Determine what type of notification to send
    const notificationStrategy = determineNotificationStrategy(analysis, currentTasks || [], userProgress);
    
    if (!notificationStrategy) {
      return NextResponse.json({ message: 'No notification needed at this time' });
    }

    // Send the notification (this would integrate with push notification service)
    const notificationSent = await sendSmartNotification(user.id, notificationStrategy);

    if (notificationSent) {
      // Log the notification
      await supabase
        .from('user_behavior_events')
        .insert({
          user_id: user.id,
          event_type: 'notification_sent',
          event_data: {
            notification_type: notificationStrategy.type,
            message: notificationStrategy.message,
            strategy: notificationStrategy.strategy
          },
          created_at: new Date().toISOString()
        });

      return NextResponse.json({ 
        message: 'Smart notification sent successfully',
        notification: notificationStrategy
      });
    } else {
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending smart notification:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Check if user should receive notification
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get('type') || 'general';

    // Get user's behavior analysis
    const { data: analysis } = await supabase
      .from('user_behavior_analysis')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get recent events to check when last notification was sent
    const { data: recentEvents } = await supabase
      .from('user_behavior_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_type', 'notification_sent')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get current tasks
    const { data: currentTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const shouldNotify = shouldSendNotification(analysis, recentEvents || [], currentTasks || [], checkType);

    return NextResponse.json({ 
      shouldNotify,
      analysis: analysis ? {
        completion_rate: analysis.task_completion_rate,
        productive_hours: analysis.productive_hours,
        notification_responsiveness: analysis.notification_responsiveness
      } : null
    });

  } catch (error) {
    console.error('Error checking notification status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function determineNotificationStrategy(analysis: any, currentTasks: any[], userProgress: any) {
  const now = new Date();
  const currentHour = now.getHours();
  const incompleteTasks = currentTasks.filter(t => !t.completed);
  const hasActiveTasks = incompleteTasks.length > 0;
  const currentMood = userProgress?.current_mood;
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Mood-based notification adjustments
  const getMoodAdjustedMessage = (baseMessage: string, mood: string) => {
    const moodAdjustments = {
      'sad': '💙 Take it one step at a time. ',
      'stressed': '🧘 Let\'s focus on just one thing. ',
      'tired': '☕ Small progress is still progress. ',
      'angry': '🔥 Channel that energy into action! ',
      'motivated': '🚀 You\'re feeling great - let\'s keep the momentum! ',
      'happy': '😊 Your positive energy is perfect for getting things done! ',
      'neutral': ''
    };
    return (moodAdjustments[mood as keyof typeof moodAdjustments] || '') + baseMessage;
  };

  // Don't send notifications during sleeping hours (11 PM - 7 AM)
  if (currentHour >= 23 || currentHour <= 7) {
    return null;
  }

  // Weekend vs weekday intelligence
  const isWeekendLazy = isWeekend && currentHour > 10 && incompleteTasks.length === 0;
  if (isWeekendLazy && currentMood !== 'motivated') {
    return {
      type: 'weekend_gentle_nudge',
      message: getMoodAdjustedMessage('Weekend vibes are nice, but maybe add one small task to feel accomplished?', currentMood || 'neutral'),
      strategy: 'weekend_motivation',
      urgency: 'low'
    };
  }

  // High completion rate users (80%+) - Gentle encouragement
  if (analysis.task_completion_rate >= 80) {
    if (hasActiveTasks && analysis.productive_hours.includes(currentHour)) {
      const baseMessage = currentMood === 'tired' 
        ? 'This is usually your productive time, but take it easy if you need to.'
        : currentMood === 'motivated' 
        ? 'Perfect timing! This is when you typically crush your tasks.'
        : `You're usually more productive now! Ready to tackle your tasks?`;
      
      return {
        type: 'productive_time_reminder',
        message: getMoodAdjustedMessage(baseMessage, currentMood || 'neutral'),
        strategy: 'productive_hour_reminder',
        urgency: 'low'
      };
    }
    return null; // High performers don't need much nudging
  }

  // Medium completion rate (40-79%) - Strategic reminders
  if (analysis.task_completion_rate >= 40) {
    if (hasActiveTasks) {
      // Check if it's been more than 3 hours since last activity
      const lastTaskTime = new Date(Math.max(...currentTasks.map(t => new Date(t.created_at).getTime())));
      const hoursSinceLastTask = (now.getTime() - lastTaskTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastTask >= 3) {
        const baseMessage = currentMood === 'stressed'
          ? `You have ${incompleteTasks.length} task${incompleteTasks.length === 1 ? '' : 's'} waiting, but let's just pick one to start with.`
          : currentMood === 'motivated'
          ? `You've got ${incompleteTasks.length} task${incompleteTasks.length === 1 ? '' : 's'} ready to conquer!`
          : `Quick check-in: You have ${incompleteTasks.length} task${incompleteTasks.length === 1 ? '' : 's'} waiting. Ready to make progress?`;
        
        return {
          type: 'gentle_reminder',
          message: getMoodAdjustedMessage(baseMessage, currentMood || 'neutral'),
          strategy: 'inactive_user_nudge',
          urgency: 'medium'
        };
      }
    }
    return null;
  }

  // Low completion rate (0-39%) - Motivational support with mood intelligence
  if (hasActiveTasks) {
    if (incompleteTasks.length > 5) {
      const simplestTask = incompleteTasks.sort((a, b) => a.title.length - b.title.length)[0];
      const baseMessage = currentMood === 'sad' || currentMood === 'stressed'
        ? `Let's start super simple. Just try: "${simplestTask.title}"`
        : currentMood === 'angry'
        ? `Use that energy! Start with: "${simplestTask.title}"`
        : `Feeling overwhelmed? Let's start small! Try: "${simplestTask.title}"`;
      
      return {
        type: 'overwhelm_support',
        message: getMoodAdjustedMessage(baseMessage, currentMood || 'neutral'),
        strategy: 'overwhelm_reduction',
        urgency: 'high'
      };
    } else {
      const baseMessage = currentMood === 'tired'
        ? 'Even small steps count today. Pick just one task to complete.'
        : currentMood === 'motivated'
        ? 'Your motivation is perfect - time to turn it into action!'
        : 'Small wins lead to big victories! Ready to tackle your tasks?';
      
      return {
        type: 'motivation_boost',
        message: getMoodAdjustedMessage(baseMessage, currentMood || 'neutral'),
        strategy: 'motivation_support',
        urgency: 'medium'
      };
    }
  }

  // User has no active tasks - mood-aware task creation prompts
  if (!hasActiveTasks && currentTasks.length === 0) {
    const baseMessage = currentMood === 'motivated'
      ? 'You\'re feeling great! What would you like to accomplish today?'
      : currentMood === 'sad' || currentMood === 'tired'
      ? 'Maybe start with something small that will make you feel good?'
      : currentMood === 'happy'
      ? 'Your good mood is perfect for setting some exciting goals!'
      : isWeekend
      ? 'Weekend goals can be different - what would make this weekend fulfilling?'
      : 'Ready to make today productive? What\'s one thing you\'d like to accomplish?';
    
    return {
      type: 'task_creation_prompt',
      message: getMoodAdjustedMessage(baseMessage, currentMood || 'neutral'),
      strategy: 'new_user_activation',
      urgency: 'low'
    };
  }

  return null;
}

function shouldSendNotification(analysis: any, recentEvents: any[], currentTasks: any[], checkType: string): boolean {
  if (!analysis) return false;

  const now = new Date();
  const currentHour = now.getHours();
  
  // No notifications during sleeping hours
  if (currentHour >= 23 || currentHour <= 7) {
    return false;
  }

  // Check if we sent a notification recently (within last 2 hours)
  const lastNotification = recentEvents[0];
  if (lastNotification) {
    const lastNotificationTime = new Date(lastNotification.created_at);
    const hoursSinceLastNotification = (now.getTime() - lastNotificationTime.getTime()) / (1000 * 60 * 60);
    
    // Respect user's notification responsiveness
    const minHoursBetweenNotifications = analysis.notification_responsiveness > 60 ? 2 : 4;
    
    if (hoursSinceLastNotification < minHoursBetweenNotifications) {
      return false;
    }
  }

  // Check if it's user's productive time
  const isProductiveTime = analysis.productive_hours.includes(currentHour);
  
  // High responders can get notifications during productive hours
  if (analysis.notification_responsiveness > 60 && isProductiveTime) {
    return true;
  }

  // Low responders only get critical notifications
  if (analysis.notification_responsiveness < 30) {
    const incompleteTasks = currentTasks.filter(t => !t.completed);
    // Only send if they have many incomplete tasks and it's been a while
    return incompleteTasks.length > 3;
  }

  return true; // Default for medium responders
}

async function sendSmartNotification(userId: string, strategy: any): Promise<boolean> {
  try {
    // This would integrate with your push notification service
    // For now, we'll just log it and return true
    console.log(`📱 Smart notification for user ${userId}:`, strategy);
    
    // You would implement actual push notification sending here
    // Example with web push:
    /*
    const subscription = await getUserPushSubscription(userId);
    if (subscription) {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: 'Teyra',
        body: strategy.message,
        tag: strategy.type,
        data: { strategy: strategy.strategy }
      }));
    }
    */
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}