import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createUserProgress, serviceSupabase } from '@/lib/supabase-service';

// Force dynamic - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// Brand new endpoint to avoid Vercel cache issues
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let userId: string | undefined;

    console.log('🔄 POST /api/ios-sync called');

    // Try to get userId from Clerk auth first
    try {
      const authResult = await auth();
      userId = authResult.userId ?? undefined;
      if (userId) {
        console.log(`✅ Authenticated via Clerk: ${userId}`);
      }
    } catch (authError) {
      console.log('⚠️ Clerk auth failed, checking request body for userId');
    }

    // Fallback to userId from request body (for iOS/mock auth)
    if (!userId && body.userId) {
      userId = body.userId;
      console.log(`⚠️ Using userId from request body (iOS): ${userId}`);
    }

    if (!userId) {
      console.error('❌ No userId provided');
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    console.log(`🔄 Syncing user: ${userId}`);

    // Ensure user exists in Supabase
    try {
      const { data: existingProgress } = await serviceSupabase
        .from('user_progress')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!existingProgress || existingProgress.length === 0) {
        console.log(`🔄 Creating user_progress entry for: ${userId}`);
        await createUserProgress(userId);
        console.log(`✅ Created user_progress entry for: ${userId}`);
      } else {
        console.log(`✅ User ${userId} already has user_progress entry`);
      }
    } catch (error: any) {
      console.error('❌ Error ensuring user in Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to sync user', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'User synced successfully'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store'
      }
    });

  } catch (error: any) {
    console.error('❌ Error in /api/ios-sync:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

