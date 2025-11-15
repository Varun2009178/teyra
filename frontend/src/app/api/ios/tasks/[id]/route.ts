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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const body = await request.json().catch(() => ({}));
    const fallbackUserId = body.userId as string | undefined;
    const userId = await resolveUserId(fallbackUserId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const row = mapTaskToRow({ ...body, id: taskId }, userId);
    const { data, error } = await serviceSupabase
      .from('tasks')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error updating iOS task ${taskId}:`, error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
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
    const fallbackUserId =
      url.searchParams.get('userId') ?? (await request.json().catch(() => ({}))).userId;
    const userId = await resolveUserId(fallbackUserId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await serviceSupabase
      .from('tasks')
      .delete()
      .eq('user_id', userId)
      .eq('id', params.id);

    if (error) {
      console.error(`❌ Error deleting iOS task ${params.id}:`, error);
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


