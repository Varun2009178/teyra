// API Route: Check if user has Google Calendar connected
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData } = await supabase
      .from('user_progress')
      .select('calendar_sync_enabled, google_calendar_connected_at')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      connected: userData?.calendar_sync_enabled || false,
      connectedAt: userData?.google_calendar_connected_at || null
    });
  } catch (error) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json({ connected: false });
  }
}
