import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🕐 Starting comprehensive cron job execution...');
    
    // Verify cron secret for security
    const cronSecret = request.headers.get('authorization');
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = {
      dailyResets: 0,
      notifications: 0,
      errors: 0
    };

    // Import Supabase service
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('📊 Fetching users for cron processing...');

    // Get all users who need daily processing
    const { data: users, error: usersError } = await supabase
      .from('user_progress')
      .select(`
        user_id,
        daily_start_time,
        is_locked,
        last_reset_date,
        created_at
      `);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      stats.errors++;
    } else {
      console.log(`👥 Found ${users?.length || 0} users to process`);

      for (const userProgress of users || []) {
        try {
          await processUserCronTasks(supabase, userProgress, stats);
        } catch (userError) {
          console.error(`❌ Error processing user ${userProgress.user_id}:`, userError);
          stats.errors++;
        }
      }
    }

    // Send summary notification to admin (optional)
    if (process.env.ADMIN_EMAIL) {
      try {
        await sendAdminSummary(stats);
      } catch (adminError) {
        console.error('❌ Error sending admin summary:', adminError);
      }
    }

    console.log('✅ Cron job completed successfully:', stats);

    return NextResponse.json({
      success: true,
      message: 'Comprehensive cron job completed successfully',
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Critical cron job error:', error);
    return NextResponse.json({ 
      error: 'Critical cron job failure',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function processUserCronTasks(supabase: any, userProgress: any, stats: any) {
  const userId = userProgress.user_id;
  console.log(`🔄 Processing user: ${userId}`);

  // Check if user needs daily reset (24 hours since daily_start_time)
  if (userProgress.is_locked && userProgress.daily_start_time) {
    const startTime = new Date(userProgress.daily_start_time);
    const now = new Date();
    const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceStart >= 24) {
      console.log(`⏰ User ${userId} needs daily reset (${hoursSinceStart.toFixed(1)} hours)`);
      await performDailyReset(supabase, userId, stats);
    }
  }

  // Check if user needs motivational email
  await checkAndSendMotivationalEmail(supabase, userId, userProgress, stats);

  // Send personalized notifications based on user behavior
  await sendPersonalizedNotifications(supabase, userId, stats);
}

async function performDailyReset(supabase: any, userId: string, stats: any) {
  try {
    console.log(`🔄 Performing daily reset for user: ${userId}`);

    // Get user's tasks for summary
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    const completedTasks = tasks?.filter(t => t.completed) || [];
    const totalTasks = tasks?.length || 0;

    // Calculate points
    const sustainableTasks = [
      "🌱 Use a reusable water bottle",
      "♻️ Put one item in recycling",
      "🚶 Take stairs instead of elevator",
      "💡 Turn off lights when leaving room",
      "🌿 Save food scraps for composting"
    ];

    const regularCompleted = completedTasks.filter(t => 
      !sustainableTasks.some(st => t.title.includes(st.replace(/🌱|♻️|🚶|💡|🌿/g, '').trim()))
    ).length;
    
    const sustainableCompleted = completedTasks.filter(t => 
      sustainableTasks.some(st => t.title.includes(st.replace(/🌱|♻️|🚶|💡|🌿/g, '').trim()))
    ).length;

    const totalPoints = (regularCompleted * 10) + (sustainableCompleted * 20);

    // Archive completed tasks
    if (completedTasks.length > 0) {
      const archivePromises = completedTasks.map(task => 
        supabase
          .from('tasks')
          .update({ 
            title: `[ARCHIVED ${new Date().toLocaleDateString()}] ${task.title}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)
      );
      
      await Promise.all(archivePromises);
      console.log(`📦 Archived ${completedTasks.length} completed tasks for user ${userId}`);
    }

    // Delete incomplete tasks
    const incompleteTasks = tasks?.filter(t => !t.completed) || [];
    if (incompleteTasks.length > 0) {
      await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', false);
      
      console.log(`🗑️ Deleted ${incompleteTasks.length} incomplete tasks for user ${userId}`);
    }

    // Reset user progress
    await supabase
      .from('user_progress')
      .update({
        is_locked: false,
        daily_start_time: null,
        daily_mood_checks: 0,
        last_reset_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    stats.dailyResets++;
    console.log(`✅ Daily reset completed for user ${userId}`);

  } catch (error) {
    console.error(`❌ Error in daily reset for user ${userId}:`, error);
    throw error;
  }
}

async function checkAndSendMotivationalEmail(supabase: any, userId: string, userProgress: any, stats: any) {
  // Motivational emails disabled
  return;
}

async function sendPersonalizedNotifications(supabase: any, userId: string, stats: any) {
  try {
    // Get user's task patterns for personalized notifications
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!tasks || tasks.length === 0) return;

    // Analyze patterns (this is where AI learning comes in)
    const completedTasks = tasks.filter(t => t.completed);
    const completionRate = completedTasks.length / tasks.length;
    
    // Send Firebase notification based on patterns
    if (completionRate > 0.8) {
      // High performer - send achievement notification
      await sendFirebaseNotification(userId, {
        title: '🏆 You\'re on fire!',
        body: `Amazing work! You've completed ${Math.round(completionRate * 100)}% of your recent tasks. Mike is so proud! 🌵`,
        data: { type: 'achievement', completionRate }
      });
      stats.notifications++;
    } else if (completionRate < 0.3) {
      // Needs encouragement
      await sendFirebaseNotification(userId, {
        title: '💪 Small steps count!',
        body: 'Every task you complete helps Mike grow. Ready to tackle something small today? 🌱',
        data: { type: 'encouragement', completionRate }
      });
      stats.notifications++;
    }

  } catch (error) {
    console.error(`❌ Error sending personalized notifications for user ${userId}:`, error);
  }
}

async function sendFirebaseNotification(userId: string, notification: any) {
  try {
    // This would integrate with your Firebase notification system
    console.log(`🔔 Would send Firebase notification to ${userId}:`, notification);
    // Implementation depends on your Firebase setup
  } catch (error) {
    console.error('❌ Error sending Firebase notification:', error);
  }
}

async function sendAdminSummary(stats: any) {
  try {
    console.log('📊 Daily cron summary:', stats);
    // Could send admin email here if needed
  } catch (error) {
    console.error('❌ Error sending admin summary:', error);
  }
}