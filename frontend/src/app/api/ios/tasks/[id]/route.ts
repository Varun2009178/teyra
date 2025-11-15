import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serviceSupabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

type TaskPayload = {
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
  clientId?: string;
  userId?: string;
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

function buildRow(payload: TaskPayload) {
  const now = new Date().toISOString();
  return {
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
}

async function resolveServerId(paramId: string, clientId?: string, userId?: string) {
  const parsed = Number.parseInt(paramId, 10);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  if (clientId && userId) {
    const { data } = await serviceSupabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('client_task_id', clientId)
      .maybeSingle();
    return data?.id;
  }
  return undefined;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json().catch(() => ({}))) as TaskPayload;
    const userId = await resolveUserId(body.userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverId = await resolveServerId(params.id, body.clientId, userId);
    if (!serverId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const row = buildRow(body);
    const { data, error } = await serviceSupabase
      .from('tasks')
      .update(row)
      .eq('user_id', userId)
      .eq('id', serverId)
      .select('*')
      .single();

    if (error) {
      console.error(`❌ Error updating iOS task ${serverId}:`, error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    return NextResponse.json({
      serverId: data.id,
      clientId: data.client_task_id,
      title: data.title,
      description: data.description,
      isCompleted: Boolean(data.completed),
      updatedAt: data.updated_at ?? null,
      dueDate: data.due_date ?? null,
      priority: data.priority ?? null,
      project: data.project ?? null,
      durationMinutes: data.duration_minutes ?? null,
    });
  } catch (error) {
    console.error('❌ Unexpected error in PUT /api/ios/tasks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    let fallbackUserId = url.searchParams.get('userId') ?? undefined;
    let clientId: string | undefined = url.searchParams.get('clientId') ?? undefined;

    if (!fallbackUserId) {
      const body = await request.json().catch(() => ({}));
      fallbackUserId = body.userId;
      clientId = clientId ?? body.clientId;
    }

    const userId = await resolveUserId(fallbackUserId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverId = await resolveServerId(params.id, clientId, userId);
    if (!serverId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { error } = await serviceSupabase
      .from('tasks')
      .delete()
      .eq('user_id', userId)
      .eq('id', serverId);

    if (error) {
      console.error(`❌ Error deleting iOS task ${serverId}:`, error);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ Unexpected error in DELETE /api/ios/tasks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
