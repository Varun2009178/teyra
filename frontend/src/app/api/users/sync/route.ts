import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createUserProgress, serviceSupabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse request body first (might contain userId as fallback)
    const body = await request.json().catch(() => ({}));
    
    // Verify the session token from Authorization header (if provided)
    const authHeader = request.headers.get('Authorization');
    let userId: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Try to verify session using Clerk's auth() (works for web cookies)
      try {
        const { userId: verifiedUserId } = await auth();
        if (verifiedUserId) {
          userId = verifiedUserId;
          console.log(`✅ Verified user via auth(): ${userId}`);
        }
      } catch (authError) {
        console.log(`⚠️ auth() failed, trying fallback methods`);
      }
    }
    
    // Fallback: Use userId from request body (for mobile apps with mock auth)
    if (!userId && body.userId) {
      userId = body.userId;
      console.log(`⚠️ Using userId from request body (fallback): ${userId}`);
    }
    
    // Final check: require userId
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required. Provide Authorization header or userId in body.' },
        { status: 401 }
      );
    }

    console.log(`🔄 Syncing user: ${userId}`);

    // Ensure user exists in Supabase (creates user_progress entry if needed)
    try {
      // Check if user_progress already exists
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
        { error: 'Failed to sync user to database', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'User synced successfully',
    });
  } catch (error: any) {
    console.error('❌ Error in /api/users/sync:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

