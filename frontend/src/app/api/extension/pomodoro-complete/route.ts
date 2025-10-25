import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/extension/pomodoro-complete - Award 30 points for completing a pomodoro session
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { distractionFree } = body; // Whether the session was completed without distractions

    // Create 3 special "[COMPLETED]" sustainable tasks (worth 20 points each = 60 total)
    // BUT we'll only insert 1.5 tasks worth (30 points) by creating one sustainable task
    // and one regular task, which equals exactly 30 points (20 + 10)

    // Actually, let's create a special pomodoro task worth 30 points
    // We'll represent it as 1.5 sustainable tasks conceptually
    // by creating one with a special title that the dashboard recognizes

    // Better approach: Create THREE regular tasks (3 x 10 = 30 points)
    const pomodoroTasks = [
      {
        user_id: userId,
        title: `[COMPLETED] 🍅 Pomodoro Focus Block ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
        completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: userId,
        title: `[COMPLETED] 🎯 Deep Work Session`,
        completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: userId,
        title: `[COMPLETED] ⚡ Productivity Sprint ${distractionFree ? '(Distraction-Free!)' : ''}`,
        completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insert all three tasks at once (3 x 10 points = 30 points total)
    const { error: insertError } = await supabase
      .from('tasks')
      .insert(pomodoroTasks);

    if (insertError) {
      console.error('Error creating pomodoro tasks:', insertError);
      return NextResponse.json({ error: 'Failed to create pomodoro tasks' }, { status: 500 });
    }

    console.log(`✅ User ${userId} completed pomodoro session - awarded 30 points (3 tasks)`);

    return NextResponse.json({
      success: true,
      pointsAwarded: 30,
      tasksCreated: 3,
      message: distractionFree
        ? '+30 points! Distraction-free session complete! 🎉'
        : '+30 points! Pomodoro session complete!'
    });

  } catch (error) {
    console.error('Error completing pomodoro:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
