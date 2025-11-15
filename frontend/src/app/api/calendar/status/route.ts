// API Route: Check if user has Google Calendar connected
import { NextRequest, NextResponse } from 'next/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    // Using shared singleton

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
