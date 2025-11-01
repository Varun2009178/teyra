import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserProgress } from '@/lib/supabase-service';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

const DAILY_PARSE_LIMIT = 5; // FREE users: 5 AI parses per day (Pro = unlimited)

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PRO USERS GET UNLIMITED - Check subscription status
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL must be configured in production');
      }
      const subResponse = await fetch(`${baseUrl}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });

      if (subResponse.ok) {
        const subData = await subResponse.json();
        const isPro = subData.isPro || false;

        if (isPro) {
          return NextResponse.json({
            success: true,
            message: 'Pro user - unlimited access',
            canParse: true,
            isPro: true,
            unlimited: true
          });
        }
      }
    } catch (error) {
      console.warn('Could not check Pro status, proceeding with limit check:', error);
    }

    const userProgressData = await getUserProgress(user.id);
    const dailyParses = userProgressData?.dailyParses || 0;

    if (dailyParses >= DAILY_PARSE_LIMIT) {
      return NextResponse.json({
        success: false,
        message: `You've used your ${DAILY_PARSE_LIMIT} free AI task parses. Upgrade to Pro for unlimited AI-powered parsing!`,
        canParse: false,
        dailyParses,
        limit: DAILY_PARSE_LIMIT,
        upgradeRequired: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Parse limit check completed',
      canParse: true,
      dailyParses,
      limit: DAILY_PARSE_LIMIT,
      remaining: DAILY_PARSE_LIMIT - dailyParses
    });
  } catch (error) {
    console.error('Error checking parse limit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
