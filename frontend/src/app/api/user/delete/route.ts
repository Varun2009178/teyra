import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const serverClerk = clerkSecretKey
  ? createClerkClient({ secretKey: clerkSecretKey })
  : null;

// Also accept POST for iOS app compatibility
export async function POST(request: NextRequest) {
  return handleDelete(request);
}

export async function DELETE(request: NextRequest) {
  return handleDelete(request);
}

async function handleDelete(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Try to get userId from auth() first (for web)
    let userId: string | undefined;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (authError) {
      userId = body.userId;
    }

    if (!userId) {
      userId = body.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - userId required' }, { status: 401 });
    }

    console.log(`🗑️ Starting account deletion for user: ${userId}`);

    const [tasksCheck, progressCheck, checkinsCheck] = await Promise.allSettled([
      supabase.from('tasks').select('count', { count: 'exact' }).eq('user_id', userId),
      supabase.from('user_progress').select('count', { count: 'exact' }).eq('user_id', userId),
      supabase.from('daily_checkins').select('count', { count: 'exact' }).eq('user_id', userId)
    ]);

    console.log('📊 Data count before deletion:', {
      tasks: tasksCheck.status === 'fulfilled' ? tasksCheck.value.count : 'error',
      userProgress: progressCheck.status === 'fulfilled' ? progressCheck.value.count : 'error',
      dailyCheckins: checkinsCheck.status === 'fulfilled' ? checkinsCheck.value.count : 'error'
    });

    const deletePromises = [
      supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .then((result) => {
          console.log(`📋 Tasks deletion result:`, result);
          return result;
        }),
      supabase
        .from('user_progress')
        .delete()
        .eq('user_id', userId)
        .then((result) => {
          console.log(`📈 User progress deletion result:`, result);
          return result;
        }),
      supabase
        .from('daily_checkins')
        .delete()
        .eq('user_id', userId)
        .then((result) => {
          console.log(`💙 Daily check-ins deletion result:`, result);
          return result;
        }),
      supabase
        .from('moods')
        .delete()
        .eq('user_id', userId)
        .then((result) => {
          console.log(`😊 Moods deletion result:`, result);
          return result;
        })
        .catch((error) => {
          console.log('No moods table or no moods to delete:', error.message);
          return { error: null };
        }),
    ];

    console.log('🔄 Executing database deletions...');
    const results = await Promise.allSettled(deletePromises);

    const tableNames = ['tasks', 'user_progress', 'daily_checkins', 'moods'];
    let hasFailures = false;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const dbResult = result.value;
        if (dbResult.error) {
          console.error(`❌ Failed to delete ${tableNames[index]} for user ${userId}:`, dbResult.error);
          hasFailures = true;
        } else {
          console.log(`✅ Successfully deleted ${tableNames[index]} for user ${userId}`);
        }
      } else {
        console.error(`❌ Promise failed for ${tableNames[index]} deletion:`, result.reason);
        hasFailures = true;
      }
    });

    if (hasFailures) {
      console.warn(`⚠️ Some database deletions failed for user ${userId}, but continuing with Clerk deletion`);
    }

    if (!serverClerk) {
      console.error('❌ Missing CLERK_SECRET_KEY - cannot delete Clerk user');
      return NextResponse.json({
        error: 'Clerk backend not configured',
      }, { status: 500 });
    }

    try {
      await serverClerk.users.deleteUser(userId);
      console.log(`✅ Successfully deleted Clerk user: ${userId}`);
    } catch (clerkError: any) {
      console.error('❌ Error deleting Clerk user:', clerkError);

      if (clerkError?.message?.includes('verification') ||
          clerkError?.message?.includes('auth factor') ||
          clerkError?.status === 422) {
        return NextResponse.json({
          error: 'Account deletion requires additional verification. Please contact support or try again later.',
          code: 'VERIFICATION_REQUIRED'
        }, { status: 422 });
      }

      return NextResponse.json({
        error: 'Failed to delete user account from authentication service',
        details: clerkError.message || 'Unknown error'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Account and all associated data deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({
      error: 'Failed to delete account'
    }, { status: 500 });
  }
}
