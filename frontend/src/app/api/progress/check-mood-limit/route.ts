import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { incrementDailyMoodChecks } from '@/lib/db-service';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const result = await incrementDailyMoodChecks(userId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking mood limit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 