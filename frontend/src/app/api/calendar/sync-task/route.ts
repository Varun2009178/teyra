// API Route: Sync Teyra task to Google Calendar
import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, refreshAccessToken } from '@/lib/google-calendar';
import { serviceSupabase as supabase } from '@/lib/supabase-service';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, action } = body; // action: 'create' | 'update' | 'delete'

    // Using shared singleton

    // Get user's calendar tokens
    const { data: userData } = await supabase
      .from('user_progress')
      .select('google_calendar_token')
      .eq('user_id', userId)
      .single();

    if (!userData?.google_calendar_token) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 });
    }

    let accessToken = userData.google_calendar_token.access_token;
    const refreshToken = userData.google_calendar_token.refresh_token;

    // Refresh token if needed
    const expiryDate = userData.google_calendar_token.expiry_date;
    if (expiryDate && Date.now() >= expiryDate) {
      accessToken = await refreshAccessToken(refreshToken);
    }

    // Get task data
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    let eventId = task.google_event_id;

    // Handle different actions
    if (action === 'create' && task.scheduled_time) {
      eventId = await createCalendarEvent(accessToken, refreshToken, task);

      // Update task with event ID
      await supabase
        .from('tasks')
        .update({ google_event_id: eventId })
        .eq('id', taskId);

    } else if (action === 'update' && eventId && task.scheduled_time) {
      await updateCalendarEvent(accessToken, refreshToken, eventId, task);

    } else if (action === 'delete' && eventId) {
      await deleteCalendarEvent(accessToken, refreshToken, eventId);

      // Remove event ID from task
      await supabase
        .from('tasks')
        .update({ google_event_id: null })
        .eq('id', taskId);
    }

    return NextResponse.json({ success: true, eventId });

  } catch (error: any) {
    console.error('Error syncing task to calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync task' },
      { status: 500 }
    );
  }
}
