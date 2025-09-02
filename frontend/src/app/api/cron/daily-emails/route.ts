import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Add GET method to handle any redirect issues
export async function GET() {
  return NextResponse.json({ 
    message: 'Daily emails cron endpoint is active. Use POST method with proper authorization.',
    status: 'ready',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployed: 'true'
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Starting daily email cron job...');
    
    // Verify cron secret for security
    const cronSecret = request.headers.get('authorization');
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const stats = {
      emailsSent: 0,
      errors: 0,
      usersProcessed: 0
    };

    // Get all users who need daily emails
    const { data: users, error: usersError } = await supabase
      .from('user_progress')
      .select(`
        user_id,
        daily_start_time,
        is_locked,
        last_reset_date,
        created_at,
        current_mood
      `);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    console.log(`👥 Found ${users?.length || 0} users to process for daily emails`);

    for (const userProgress of users || []) {
      try {
        stats.usersProcessed++;
        await processUserDailyEmail(supabase, userProgress, stats);
      } catch (userError) {
        console.error(`❌ Error processing user ${userProgress.user_id}:`, userError);
        stats.errors++;
      }
    }

    console.log('✅ Daily email cron job completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Daily email cron job completed successfully',
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Critical daily email cron error:', error);
    return NextResponse.json({ 
      error: 'Critical daily email cron failure',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function processUserDailyEmail(supabase: any, userProgress: any, stats: any) {
  const userId = userProgress.user_id;
  console.log(`📧 Processing daily email for user: ${userId}`);

  try {
    // Get user's recent activity
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10);

    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    // Calculate user activity patterns
    const now = new Date();
    const lastActivity = recentTasks?.[0]?.updated_at || userProgress.created_at;
    const hoursSinceActivity = (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
    
    // Determine email type based on user behavior
    let emailType = 'daily_checkin';
    let shouldSendEmail = false;

    // Check if user is new (less than 48 hours old)
    const userAge = (now.getTime() - new Date(userProgress.created_at).getTime()) / (1000 * 60 * 60);
    const isNewUser = userAge < 48;

    // Check if user needs daily reset email (24+ hours since start)
    if (userProgress.is_locked && userProgress.daily_start_time) {
      const startTime = new Date(userProgress.daily_start_time);
      const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceStart >= 24) {
        emailType = 'daily_reset_trigger';
        shouldSendEmail = true;
      }
    }
    // Check if new user needs first task reminder
    else if (isNewUser && (!allTasks || allTasks.length === 0)) {
      emailType = 'first_task_reminder';
      shouldSendEmail = true;
    }
    // Check if user needs motivational email (inactive for 12+ hours)
    else if (hoursSinceActivity >= 12) {
      // Only send once per day
      const lastEmailDate = new Date(userProgress.last_reset_date || userProgress.created_at).toDateString();
      const today = new Date().toDateString();
      
      if (lastEmailDate !== today) {
        emailType = 'daily_checkin';
        shouldSendEmail = true;
      }
    }

    if (!shouldSendEmail) {
      console.log(`⏭️ No email needed for user ${userId} (${emailType}, ${hoursSinceActivity.toFixed(1)}h inactive)`);
      return;
    }

    // Get user email and name (you'd integrate with Clerk here)
    const userEmail = await getUserEmail(userId);
    const userName = await getUserName(userId);
    
    if (!userEmail) {
      console.log(`⚠️ No email found for user ${userId}`);
      return;
    }

    // Prepare task summary for email
    const completedTasks = allTasks?.filter(t => t.completed) || [];
    const totalTasks = allTasks?.length || 0;
    
    // Calculate points with sustainable task bonus
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
    const mikeState = totalPoints >= 200 ? 'Happy (Maxed!)' : totalPoints >= 150 ? 'Happy' : totalPoints >= 100 ? 'Neutral' : 'Growing';

    // Send personalized email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-daily-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        name: userName || 'there',
        type: emailType,
        timezone: 'UTC', // You could get user's timezone from their profile
        hoursSinceActivity: Math.round(hoursSinceActivity),
        userData: { 
          userId,
          mood: userProgress.current_mood,
          isNewUser,
          userAge: Math.round(userAge)
        },
        taskSummary: {
          completedTasks: completedTasks.length,
          totalTasks,
          totalPoints,
          mikeState,
          regularCompleted,
          sustainableCompleted,
          recentTasks: recentTasks?.slice(0, 3).map(t => ({
            title: t.title,
            completed: t.completed,
            created_at: t.created_at
          }))
        }
      })
    });

    if (emailResponse.ok) {
      const emailResult = await emailResponse.json();
      console.log(`✅ Sent ${emailType} email to ${userEmail} for user ${userId}`);
      stats.emailsSent++;
      
      // Update last email sent timestamp
      await supabase
        .from('user_progress')
        .update({ 
          last_email_sent: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
    } else {
      const errorText = await emailResponse.text();
      console.error(`❌ Failed to send email to ${userEmail}:`, errorText);
      stats.errors++;
    }

  } catch (error) {
    console.error(`❌ Error processing daily email for user ${userId}:`, error);
    stats.errors++;
  }
}

// Helper functions to get user data from Clerk
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    return clerkUser.emailAddresses?.[0]?.emailAddress || null;
  } catch (error) {
    console.error('❌ Error getting user email:', error);
    return null;
  }
}

async function getUserName(userId: string): Promise<string | null> {
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    return clerkUser.firstName || clerkUser.username || 'there';
  } catch (error) {
    console.error('❌ Error getting user name:', error);
    return 'there';
  }
}