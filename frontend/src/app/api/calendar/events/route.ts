// API Route: Fetch Google Calendar events
import { NextRequest, NextResponse } from 'next/server';
import { fetchCalendarEvents, refreshAccessToken } from '@/lib/google-calendar';
import { serviceSupabase as supabase } from '@/lib/supabase-service';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start') || new Date().toISOString();
    const endDate = searchParams.get('end') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get user's calendar tokens from Supabase
    // Using shared singleton

    const { data: userData, error: userError } = await supabase
      .from('user_progress')
      .select('google_calendar_token, calendar_sync_enabled')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userData.calendar_sync_enabled || !userData.google_calendar_token) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 });
    }

    let accessToken = userData.google_calendar_token.access_token;
    const refreshToken = userData.google_calendar_token.refresh_token;

    // Check if token needs refresh
    const expiryDate = userData.google_calendar_token.expiry_date;
    if (expiryDate && Date.now() >= expiryDate) {
      accessToken = await refreshAccessToken(refreshToken);

      // Update token in database
      await supabase
        .from('user_progress')
        .update({
          google_calendar_token: {
            ...userData.google_calendar_token,
            access_token: accessToken,
            expiry_date: Date.now() + 3600 * 1000
          }
        })
        .eq('user_id', userId);
    }

    // Fetch calendar events
    const events = await fetchCalendarEvents(
      accessToken,
      refreshToken,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
