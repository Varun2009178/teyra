import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { updateTask, deleteTask } from '@/lib/supabase-service';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleTaskUpdate(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing properties
    const resolvedParams = await params;
    
    // Try to get task ID from params or from URL
    let taskId: number;
    
    if (resolvedParams && resolvedParams.id) {
      taskId = parseInt(resolvedParams.id);
    } else {
      // Fallback: extract from URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const idFromUrl = pathParts[pathParts.length - 1];
      taskId = parseInt(idFromUrl);
    }
    
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const body = await request.json().catch(e => {
      console.error('Error parsing request body:', e);
      return {};
    });

    const { completed, title, hasBeenSplit, scheduled_time, duration_minutes, google_event_id, priority, due_date, subtasks, tags } = body;

    const updateData: any = {};
    if (typeof completed === 'boolean') updateData.completed = completed;
    if (typeof title === 'string') updateData.title = title;
    if (typeof hasBeenSplit === 'boolean') updateData.has_been_split = hasBeenSplit;
    if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time;
    if (typeof duration_minutes === 'number') updateData.duration_minutes = duration_minutes;
    if (google_event_id !== undefined) updateData.google_event_id = google_event_id;
    if (priority !== undefined) updateData.priority = priority;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (subtasks !== undefined) updateData.subtasks = subtasks;
    if (tags !== undefined) updateData.tags = tags;
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedTask = await updateTask(taskId, updateData);
    
    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      if (error.message.includes('Failed to update')) {
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
      }
      if (error.message.includes('Database connection failed')) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing properties
    const resolvedParams = await params;
    const taskId = parseInt(resolvedParams.id);
    
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    console.log(`🗑️ API: Attempting to delete task ${taskId} for user ${user.id}`);

    // Use the service function which properly handles the deletion
    const deletedTask = await deleteTask(taskId);
    
    console.log(`✅ Task ${taskId} deleted successfully:`, deletedTask);
    return NextResponse.json(deletedTask);
    
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      if (error.message.includes('Failed to delete')) {
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}