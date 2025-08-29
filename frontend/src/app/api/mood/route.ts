import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserProgress, updateUserMood } from '@/lib/supabase-service';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProgressData = await getUserProgress(user.id);
    const mood = userProgressData?.currentMood || 'neutral';

    return NextResponse.json({ mood });
  } catch (error) {
    console.error('Error getting mood:', error);
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

    const { mood } = await request.json();
    
    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    const updatedProgress = await updateUserMood(user.id, mood);
    
    return NextResponse.json({ 
      success: true, 
      mood: updatedProgress.currentMood,
      dailyMoodChecks: updatedProgress.dailyMoodChecks,
      message: 'Mood updated successfully'
    });
  } catch (error) {
    console.error('Error updating mood:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mood } = await request.json();
    
    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    const updatedProgress = await updateUserMood(user.id, mood);
    
    return NextResponse.json({ 
      success: true, 
      mood: updatedProgress.currentMood,
      dailyMoodChecks: updatedProgress.dailyMoodChecks,
      message: 'Mood updated successfully'
    });
  } catch (error) {
    console.error('Error updating mood:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}