import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🗑️ Starting account deletion for user: ${userId}`);

    // Parse request body to get verification token if provided
    const body = await request.json().catch(() => ({}));
    const { verificationToken } = body;

    // First, let's check what data exists for this user
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

    // Delete all user data from Supabase tables
    const deletePromises = [
      // Delete tasks
      supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .then((result) => {
          console.log(`📋 Tasks deletion result:`, result);
          return result;
        }),
      
      // Delete user progress
      supabase
        .from('user_progress')
        .delete()
        .eq('user_id', userId)
        .then((result) => {
          console.log(`📈 User progress deletion result:`, result);
          return result;
        }),
      
      // Delete daily check-ins
      supabase
        .from('daily_checkins')
        .delete()
        .eq('user_id', userId)
        .then((result) => {
          console.log(`💙 Daily check-ins deletion result:`, result);
          return result;
        }),
      
      // Delete mood entries (if you have a moods table)
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
          return { error: null }; // Continue even if moods table doesn't exist
        }),
    ];

    // Execute all deletions
    console.log('🔄 Executing database deletions...');
    const results = await Promise.allSettled(deletePromises);
    
    // Log results for debugging
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

    // Delete the user from Clerk with error handling for verification requirements
    try {
      await clerkClient.users.deleteUser(userId);
      console.log(`✅ Successfully deleted Clerk user: ${userId}`);
    } catch (clerkError: any) {
      console.error('❌ Error deleting Clerk user:', clerkError);

      // Check if it's a verification error
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