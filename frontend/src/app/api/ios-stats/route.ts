import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createUserProgress, serviceSupabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

type MobileStats = {
  currentStreak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  lastActiveDate?: string | null;
  consecutiveDaysActive: number;
  lastNotificationTapDate?: string | null;
  notificationTapCount: number;
};

const defaultStats: MobileStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalTasksCompleted: 0,
  lastActiveDate: null,
  consecutiveDaysActive: 0,
  lastNotificationTapDate: null,
  notificationTapCount: 0,
};

async function resolveUserId(fallback?: string): Promise<string | undefined> {
  try {
    const authResult = await auth();
    if (authResult?.userId) {
      return authResult.userId;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function extractStats(row: any): MobileStats {
  const prefs = (row?.notification_preferences ?? {}) as Record<string, any>;
  const stored = prefs.roki_stats as Partial<MobileStats> | undefined;
  return {
    currentStreak: stored?.currentStreak ?? row?.current_streak ?? 0,
    longestStreak: stored?.longestStreak ?? row?.longest_streak ?? 0,
    totalTasksCompleted: stored?.totalTasksCompleted ?? row?.tasks_completed ?? 0,
    lastActiveDate: stored?.lastActiveDate ?? row?.last_active_date ?? null,
    consecutiveDaysActive: stored?.consecutiveDaysActive ?? row?.consecutive_days_active ?? 0,
    lastNotificationTapDate:
      stored?.lastNotificationTapDate ?? row?.last_notification_tap_date ?? null,
    notificationTapCount: stored?.notificationTapCount ?? row?.notification_tap_count ?? 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const fallbackUserId = url.searchParams.get('userId') ?? undefined;
    const userId = await resolveUserId(fallbackUserId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await serviceSupabase
      .from('user_progress')
      .select('notification_preferences, tasks_completed')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching iOS stats:', error);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    if (!data) {
      await createUserProgress(userId);
      return NextResponse.json(defaultStats);
    }

    return NextResponse.json(extractStats(data));
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/ios-stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const stats: MobileStats = {
      ...defaultStats,
      ...body,
    };
    const fallbackUserId = body.userId as string | undefined;
    const userId = await resolveUserId(fallbackUserId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existing } = await serviceSupabase
      .from('user_progress')
      .select('notification_preferences')
      .eq('user_id', userId)
      .maybeSingle();

    const existingPrefs = (existing?.notification_preferences ?? {}) as Record<string, any>;
    const updatedPrefs = {
      ...existingPrefs,
      roki_stats: stats,
    };

    const { error } = await serviceSupabase.from('user_progress').upsert({
      user_id: userId,
      notification_preferences: updatedPrefs,
      tasks_completed: stats.totalTasksCompleted,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('❌ Error saving iOS stats:', error);
      return NextResponse.json({ error: 'Failed to sync stats' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Unexpected error in POST /api/ios-stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


