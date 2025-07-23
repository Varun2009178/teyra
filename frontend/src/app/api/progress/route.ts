import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserProgress, updateUserMood } from '@/lib/db-service';
import { ensureUserExists } from '@/lib/ensure-user';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    
    // Ensure user exists in the database
    await ensureUserExists(userId);
    
    const progress = await getUserProgress(userId);
    
    // Add cache-busting headers
    const response = NextResponse.json(progress);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching progress:', error);
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
    
    if (!mood || typeof mood !== 'string') {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    const userId = user.id;
    
    // Ensure user exists in the database
    await ensureUserExists(userId);
    
    const result = await updateUserMood(userId, mood);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}