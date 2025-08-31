import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    
    // Check localStorage content (this will only work on client side)
    let localStorageData = null;
    if (typeof window !== 'undefined') {
      const tasksKey = `tasks_${userId}`;
      const progressKey = `progress_${userId}`;
      localStorageData = {
        tasks: JSON.parse(localStorage.getItem(tasksKey) || '[]'),
        progress: JSON.parse(localStorage.getItem(progressKey) || '{}')
      };
    }
    
    return NextResponse.json({
      userId,
      localStorageData,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 