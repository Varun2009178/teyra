import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serviceSupabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

type SyncTaskPayload = {
  serverId?: number;
  clientId?: string;
  userId?: string;
  title?: string;
  description?: string | null;
  isCompleted?: boolean;
  hasBeenSplit?: boolean;
  limit?: string | null;
  scheduledTime?: string | null;
  googleEventId?: string | null;
  durationMinutes?: number | null;
  dueDate?: string | null;
  priority?: string | null;
  project?: string | null;
  timeBlock?: number | null;
  parentTaskId?: number | null;
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

function buildRow(payload: SyncTaskPayload, userId: string) {
  const now = new Date().toISOString();
  const row: Record<string, any> = {
    user_id: userId,
    title: payload.title ?? 'task',
    description: payload.description ?? null,
    completed: payload.isCompleted ?? false,
    has_been_split: payload.hasBeenSplit ?? false,
    limit: payload.limit ?? null,
    scheduled_time: payload.scheduledTime ?? null,
    google_event_id: payload.googleEventId ?? null,
    duration_minutes: payload.durationMinutes ?? null,
    due_date: payload.dueDate ?? null,
    priority: payload.priority ?? null,
    project: payload.project ?? null,
    time_block: payload.timeBlock ?? null,
    parent_task_id: payload.parentTaskId ?? null,
    updated_at: now,
  };
  if (payload.clientId) {
    row.client_task_id = payload.clientId;
  }
  return row;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tasks = (body.tasks as SyncTaskPayload[]) ?? [];
    const fallbackUserId = body.userId as string | undefined;
    const userId = await resolveUserId(fallbackUserId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const createdMappings: { clientId: string; serverId: number }[] = [];

    for (const task of tasks) {
      if (!task.clientId) {
        continue;
      }

      const row = buildRow(task, userId);

      if (task.serverId) {
        await serviceSupabase
          .from('tasks')
          .update(row)
          .eq('user_id', userId)
          .eq('id', task.serverId);
      } else {
        const { data, error } = await serviceSupabase
          .from('tasks')
          .upsert(row, { onConflict: 'client_task_id' })
          .select('id, client_task_id')
          .single();

        if (error) {
          console.error('❌ Error syncing task:', error);
          return NextResponse.json({ error: 'Failed to sync tasks' }, { status: 500 });
        }

        if (data?.id && data?.client_task_id) {
          createdMappings.push({ clientId: data.client_task_id, serverId: data.id });
        }
      }
    }

    return NextResponse.json({ success: true, created: createdMappings });
  } catch (error) {
    console.error('❌ Unexpected error in POST /api/ios/tasks/sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
