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
    // ignore
  }
  return fallback;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tasks = (body.tasks as MobileTask[]) ?? [];
    const fallbackUserId = body.userId as string | undefined;
    const userId = await resolveUserId(fallbackUserId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (tasks.length === 0) {
      await serviceSupabase.from('tasks').delete().eq('user_id', userId);
      return NextResponse.json({ success: true });
    }

    const rows = tasks.map((task) => mapTaskToRow(task, userId));
    const { error } = await serviceSupabase
      .from('tasks')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error syncing iOS tasks:', error);
      return NextResponse.json({ error: 'Failed to sync tasks' }, { status: 500 });
    }

    // Remove tasks that no longer exist on the device
    const incomingIds = new Set(tasks.map((task) => task.id));
    const { data: existing, error: fetchError } = await serviceSupabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId);

    if (!fetchError && existing) {
      const idsToDelete = existing
        .map((row) => row.id?.toString())
        .filter((id): id is string => Boolean(id) && !incomingIds.has(id as string));

      if (idsToDelete.length > 0) {
        await serviceSupabase.from('tasks').delete().in('id', idsToDelete);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Unexpected error in POST /api/ios/tasks/sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


