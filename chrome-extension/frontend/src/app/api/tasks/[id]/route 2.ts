import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { updateTask, deleteTask } from '@/lib/db-service';

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
  { params }: { params: { id: string } }
) {
  return handleTaskUpdate(request, params);
}

async function handleTaskUpdate(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get task ID from params or from URL
    let taskId: number;
    
    if (params && params.id) {
      taskId = parseInt(params.id);
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
    
    const { completed, title, hasBeenSplit } = body;
    
    const updateData: any = {};
    if (typeof completed === 'boolean') updateData.completed = completed;
    if (typeof title === 'string') updateData.title = title;
    if (typeof hasBeenSplit === 'boolean') updateData.hasBeenSplit = hasBeenSplit;
    
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const deletedTask = await deleteTask(taskId);
    
    return NextResponse.json(deletedTask);
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}