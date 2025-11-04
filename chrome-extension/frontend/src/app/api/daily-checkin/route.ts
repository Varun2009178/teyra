import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createDailyCheckin, getTodaysCheckin } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emotionalState, message } = await request.json();

    if (!emotionalState) {
      return NextResponse.json({ error: 'Emotional state is required' }, { status: 400 });
    }

    // Check if user already checked in today
    const existingCheckin = await getTodaysCheckin(userId);
    if (existingCheckin) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 409 });
    }

    const checkin = await createDailyCheckin(userId, emotionalState, message);
    
    return NextResponse.json({
      success: true,
      checkin,
      mikeResponse: checkin.mikeResponse
    });
  } catch (error) {
    console.error('Error creating daily check-in:', error);
    return NextResponse.json(
      { error: 'Failed to create daily check-in' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todaysCheckin = await getTodaysCheckin(userId);
    
    return NextResponse.json({
      checkin: todaysCheckin,
      hasCheckedInToday: !!todaysCheckin
    });
  } catch (error) {
    console.error('Error fetching daily check-in:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily check-in' },
      { status: 500 }
    );
  }
}