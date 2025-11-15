import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serviceSupabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

type MobileTask = {
  id: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  createdAt?: string;
  completedAt?: string | null;
  dueDate?: string | null;
  category?: string;
  lastNotificationSent?: string | null;
  notificationCount?: number;
  escalationLevel?: number;
  hasEverBeenCompleted?: boolean;
};

async function resolveUserId(fallback?: string): Promise<string | undefined> {
  try {
    const authResult = await auth();
    if (authResult?.userId) {
      return authResult.userId;
    }
  } catch {
    // Ignore - we'll fall back to body/query
  }
  return fallback;
}

function mapRowToTask(row: any): MobileTask {
  return {
    id: row.id?.toString(),
    title: row.title ?? '',
    description: row.description ?? null,
    isCompleted: Boolean(row.completed),
    createdAt: row.created_at ?? null,
    completedAt: row.completed_at ?? null,
    dueDate: row.due_date ?? null,
    category: row.category ?? 'none',
    lastNotificationSent: row.last_notification_sent ?? null,
    notificationCount: row.notification_count ?? 0,
    escalationLevel: row.escalation_level ?? 0,
    hasEverBeenCompleted: row.has_ever_been_completed ?? Boolean(row.completed),
  };
}

function mapTaskToRow(task: MobileTask, userId: string) {
  const createdAt = task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString();
  return {
    id: task.id,
    user_id: userId,
    title: task.title ?? 'task',
    description: task.description ?? null,
    completed: Boolean(task.isCompleted),
    created_at: createdAt,
    completed_at: task.completedAt ?? null,
    due_date: task.dueDate ?? null,
    category: task.category ?? 'none',
    last_notification_sent: task.lastNotificationSent ?? null,
    notification_count: task.notificationCount ?? 0,
    escalation_level: task.escalationLevel ?? 0,
    has_ever_been_completed: task.hasEverBeenCompleted ?? Boolean(task.isCompleted),
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
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching iOS tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    const tasks = (data ?? []).map(mapRowToTask);
    return NextResponse.json(tasks, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/ios/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const fallbackUserId = body.userId as string | undefined;
    const userId = await resolveUserId(fallbackUserId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!body.id || !body.title) {
      return NextResponse.json({ error: 'Task id and title are required' }, { status: 400 });
    }

    const row = mapTaskToRow(body, userId);
    const { data, error } = await serviceSupabase
      .from('tasks')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating iOS task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json(mapRowToTask(data), {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ Unexpected error in POST /api/ios/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


