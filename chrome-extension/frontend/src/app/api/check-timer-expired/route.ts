import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, just return that timer is not expired since we're not tracking reset dates
    // In the future, this could be implemented with localStorage or a separate table
    return NextResponse.json({ 
      success: true, 
      message: 'Timer not expired',
      expired: false,
      resetDue: false
    });

  } catch (error) {
    console.error('Error checking timer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 