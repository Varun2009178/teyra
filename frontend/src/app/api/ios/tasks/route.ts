import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'node:crypto';
import { serviceSupabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

type TaskPayload = {
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

type TaskResponse = {
  serverId: number;
  clientId: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  dueDate: string | null;
  priority: string | null;
  project: string | null;
  durationMinutes: number | null;
};

async function resolveUserId(fallback?: string): Promise<string | undefined> {
  try {
    const authResult = await auth();
    if (authResult?.userId) {
      return authResult.userId;
    }
  } catch {
    // ignore - fall back to payload
  }
  return fallback;
}

function buildRow(payload: TaskPayload, userId: string) {
  const now = new Date().toISOString();
  return {
    client_task_id: payload.clientId ?? randomUUID(),
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
}

async function ensureClientId(row: any): Promise<string> {
  if (row.client_task_id) {
    return row.client_task_id;
  }
  const newId = randomUUID();
  await serviceSupabase
    .from('tasks')
    .update({ client_task_id: newId })
    .eq('id', row.id);
  return newId;
}

async function mapRowToResponse(row: any): Promise<TaskResponse> {
  const clientId = await ensureClientId(row);
  return {
    serverId: row.id,
    clientId,
    title: row.title,
    description: row.description,
    isCompleted: Boolean(row.completed),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    dueDate: row.due_date ?? null,
    priority: row.priority ?? null,
    project: row.project ?? null,
    durationMinutes: row.duration_minutes ?? null,
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

    const tasks = await Promise.all((data ?? []).map(mapRowToResponse));
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
    const body = (await request.json().catch(() => ({}))) as TaskPayload;
    const userId = await resolveUserId(body.userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!body.title || !body.clientId) {
      return NextResponse.json({ error: 'clientId and title are required' }, { status: 400 });
    }

    const row = buildRow(body, userId);
    const { data, error } = await serviceSupabase
      .from('tasks')
      .upsert(row, { onConflict: 'client_task_id' })
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error creating iOS task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    const responsePayload = await mapRowToResponse(data);
    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ Unexpected error in POST /api/ios/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
