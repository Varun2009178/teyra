import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is a new user (you might want to add a custom field to track this)
    // For now, we'll just check if they have any tasks
    const isNewUser = true; // This would be determined by your logic
    
    if (isNewUser) {
      return NextResponse.json({ redirect: '/welcome' });
    } else {
      return NextResponse.json({ redirect: '/dashboard' });
    }
  } catch (error) {
    console.error('Error in auth route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}