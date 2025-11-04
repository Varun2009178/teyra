import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This is a simple admin endpoint to help reset onboarding states
    // In a real app, you'd want proper admin authentication here
    console.log(`🔄 Admin: Resetting onboarding flags for user ${userId}`);

    // Return instructions for manually resetting localStorage
    const resetInstructions = {
      message: 'To reset onboarding for a user, clear these localStorage keys:',
      keysToRemove: [
        `dashboard_tour_${userId}`,
        `smart_setup_${userId}`,
        `shown_setup_${userId}` // sessionStorage key
      ],
      jsCode: `
// Run this in browser console to reset onboarding for current user
localStorage.removeItem('dashboard_tour_${userId}');
localStorage.removeItem('smart_setup_${userId}');
sessionStorage.removeItem('shown_setup_${userId}');
console.log('✅ Onboarding flags reset - refresh page to see popups');
      `,
      note: 'After clearing these keys, refresh the page to trigger onboarding popups'
    };

    return NextResponse.json(resetInstructions);

  } catch (error) {
    console.error('Error in reset-onboarding endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to reset onboarding',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Onboarding Reset Endpoint',
      userId: userId,
      instructions: 'Use POST to get reset instructions',
      currentFlags: {
        note: 'Check browser localStorage and sessionStorage for these keys:',
        keys: [
          `dashboard_tour_${userId}`,
          `smart_setup_${userId}`,
          `shown_setup_${userId}`
        ]
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}