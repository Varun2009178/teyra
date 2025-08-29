import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserTasks, createTask } from '@/lib/supabase-service';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const tasks = await getUserTasks(userId);
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(e => {
      console.error('Error parsing request body:', e);
      return {};
    });
    
    const { title, hasBeenSplit = false, limit } = body;
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const userId = user.id;
    console.log(`Creating task for user ${userId}: "${title}" (hasBeenSplit: ${hasBeenSplit}, limit: ${limit})`);
    
    const newTask = await createTask(userId, title, Boolean(hasBeenSplit), limit);
    
    return NextResponse.json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { deleteAll } = body;

    if (!deleteAll) {
      return NextResponse.json({ error: 'Delete all flag required' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete all tasks for user
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting all tasks:', error);
      return NextResponse.json({ error: 'Failed to delete tasks' }, { status: 500 });
    }

    console.log(`✅ Deleted all tasks for user: ${user.id}`);
    return NextResponse.json({ message: 'All tasks deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/tasks:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}