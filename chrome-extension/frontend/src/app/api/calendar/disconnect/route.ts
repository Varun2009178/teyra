import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

// Using shared singleton

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔌 Disconnecting Google Calendar for user:', userId);

    // Update user_progress to remove calendar token and settings
    const { error: updateError } = await supabase
      .from('user_progress')
      .update({
        google_calendar_token: null,
        google_calendar_connected_at: null,
        calendar_sync_enabled: false
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error disconnecting calendar:', updateError);
      return NextResponse.json({ error: 'Failed to disconnect calendar' }, { status: 500 });
    }

    // Optionally: Remove google_event_id from all tasks (cleanup)
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ google_event_id: null })
      .eq('user_id', userId)
      .not('google_event_id', 'is', null);

    if (taskError) {
      console.warn('⚠️ Warning: Could not clear google_event_id from tasks:', taskError);
      // Don't fail the whole operation for this
    }

    console.log('✅ Google Calendar disconnected successfully');

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    });

  } catch (error: any) {
    console.error('❌ Error in disconnect route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}
