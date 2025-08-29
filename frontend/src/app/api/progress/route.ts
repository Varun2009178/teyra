import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { calculateUserProgress } from '@/lib/supabase-service';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    
    const progress = await calculateUserProgress(userId);
    
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

    // For now, just return success since we're not storing mood in database
    // In the future, this could store mood in localStorage or a separate table
    return NextResponse.json({ 
      success: true, 
      mood,
      message: 'Mood updated successfully'
    });
  } catch (error) {
    console.error('Error updating mood:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}