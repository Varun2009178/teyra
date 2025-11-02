import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  // Check environment variables
  const envCheck = {
    hasClerkWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    webhookSecretPrefix: process.env.CLERK_WEBHOOK_SECRET?.substring(0, 8) + '...' || 'NOT_SET',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET'
  };

  let userDataCheck = null;
  
  if (userId) {
    // Check if user data exists in database
    try {
      const { createClient } = await import('@supabase/supabase-js');
      // Using shared singleton

      const tables = ['tasks', 'user_progress', 'user_behavior_events', 'user_behavior_analysis'];
      const checks = await Promise.allSettled(
        tables.map(table => 
          supabase.from(table).select('id', { count: 'exact' }).eq('user_id', userId)
        )
      );

      userDataCheck = {};
      checks.forEach((result, index) => {
        const tableName = tables[index];
        if (result.status === 'fulfilled') {
          userDataCheck[tableName] = {
            count: result.value.count || 0,
            error: result.value.error?.message || null
          };
        } else {
          userDataCheck[tableName] = {
            count: 0,
            error: result.reason
          };
        }
      });
    } catch (error) {
      userDataCheck = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  return NextResponse.json({
    message: 'Webhook debug information',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    userDataCheck,
    recommendations: [
      !envCheck.hasClerkWebhookSecret && '❌ Set CLERK_WEBHOOK_SECRET environment variable',
      !envCheck.hasSupabaseServiceKey && '❌ Set SUPABASE_SERVICE_ROLE_KEY environment variable',
      envCheck.appUrl === 'NOT_SET' && '⚠️ Set NEXT_PUBLIC_APP_URL for webhook URL',
      'ℹ️ Check Clerk Dashboard → Webhooks to ensure webhook is configured',
      'ℹ️ Webhook URL should be: https://your-domain.com/api/webhooks/clerk',
      'ℹ️ Make sure "user.deleted" event is selected'
    ].filter(Boolean),
    instructions: {
      testUserData: 'GET /api/debug-webhook?userId=user_XXXXXX',
      manualCleanup: 'POST /api/admin/cleanup-user with { userId: "user_XXXXXX" }',
      webhookLogs: 'Check deployment logs when deleting a user account'
    }
  });
}