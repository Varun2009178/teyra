import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  return NextResponse.json({
    message: 'Daily resets cron endpoint is active. Use POST method with proper authorization.',
    status: 'ready',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting daily resets cron job...');

    // For Vercel cron jobs, we can use a different auth method
    const userAgent = request.headers.get('user-agent');
    const isVercelCron = userAgent?.includes('vercel') || request.headers.get('x-vercel-cron') === '1';

    // Check authorization - either Vercel cron or manual with secret
    const cronSecret = request.headers.get('authorization');
    if (!isVercelCron && cronSecret !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = {
      usersProcessed: 0,
      resetsTriggered: 0,
      errors: 0,
      emailsSent: 0
    };

    // Get all users who might need resets
    const { data: users, error: usersError } = await supabase
      .from('user_progress')
      .select('user_id, daily_start_time, created_at, is_locked')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    console.log(`👥 Found ${users?.length || 0} users to check for resets`);

    const now = new Date();

    for (const userProgress of users || []) {
      try {
        stats.usersProcessed++;

        // Check if this user needs a reset (24+ hours since last reset)
        const lastReset = new Date(userProgress.daily_start_time || userProgress.created_at);
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

        if (hoursSinceReset >= 24) {
          console.log(`🔄 User ${userProgress.user_id.slice(-8)} needs reset (${hoursSinceReset.toFixed(1)}h since last)`);

          // Trigger individual user reset via admin endpoint
          const resetResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/trigger-reset`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET_KEY}`
            },
            body: JSON.stringify({ userId: userProgress.user_id })
          });

          if (resetResponse.ok) {
            const resetResult = await resetResponse.json();
            console.log(`✅ Reset completed for user ${userProgress.user_id.slice(-8)}`);
            stats.resetsTriggered++;

            // Check if email was sent
            if (resetResult.emailSent) {
              stats.emailsSent++;
            }
          } else {
            console.error(`❌ Reset failed for user ${userProgress.user_id.slice(-8)}:`, await resetResponse.text());
            stats.errors++;
          }
        } else {
          console.log(`⏭️ User ${userProgress.user_id.slice(-8)} doesn't need reset yet (${(24 - hoursSinceReset).toFixed(1)}h remaining)`);
        }

      } catch (userError) {
        console.error(`❌ Error processing user ${userProgress.user_id}:`, userError);
        stats.errors++;
      }
    }

    console.log('✅ Daily resets cron job completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Daily resets cron job completed',
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Critical daily resets cron error:', error);
    return NextResponse.json({
      error: 'Critical daily resets cron failure',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}