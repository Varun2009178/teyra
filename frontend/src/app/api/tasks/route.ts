import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserTasks, createTask } from '@/lib/supabase-service';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

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

    const userId = user.id;

    // Handle bulk task creation (from AI parser)
    if (body.tasks && Array.isArray(body.tasks)) {
      // Using shared singleton

      const tasksToInsert = body.tasks.map((task: any) => ({
        user_id: userId,
        title: task.title,
        completed: false,
        has_been_split: false,
        // Store priority and deadline in the title for now, or you can add columns
      }));

      const { data: newTasks, error } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (error) throw error;

      console.log(`✅ Created ${newTasks.length} tasks for user ${userId}`);
      return NextResponse.json({ tasks: newTasks, count: newTasks.length });
    }

    // Handle single task creation (existing functionality)
    const { title, hasBeenSplit = false, limit, scheduled_time, duration_minutes } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    console.log(`Creating task for user ${userId}: "${title}" (hasBeenSplit: ${hasBeenSplit}, limit: ${limit}, scheduled: ${scheduled_time})`);

    // If scheduled_time or duration_minutes are provided, use direct Supabase client
    if (scheduled_time || duration_minutes) {
      // Using shared singleton

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title,
          completed: false,
          has_been_split: hasBeenSplit,
          limit,
          scheduled_time: scheduled_time || null,
          duration_minutes: duration_minutes || null
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(newTask);
    } else {
      const newTask = await createTask(userId, title, limit, Boolean(hasBeenSplit));
      return NextResponse.json(newTask);
    }
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
    // Using shared singleton

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