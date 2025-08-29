import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Add admin check here if needed
    // const user = await clerkClient.users.getUser(userId);
    // if (user.emailAddresses[0]?.emailAddress !== 'admin@example.com') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    console.log('🧹 Starting orphaned data cleanup via API...');
    
    // Get all user IDs from Supabase tables
    const [tasksResult, progressResult, checkinsResult] = await Promise.allSettled([
      supabase.from('tasks').select('user_id'),
      supabase.from('user_progress').select('user_id'),
      supabase.from('daily_checkins').select('user_id')
    ]);

    const allUserIds = new Set<string>();

    // Collect all user IDs from all tables
    if (tasksResult.status === 'fulfilled') {
      tasksResult.value.data?.forEach(row => allUserIds.add(row.user_id));
    }
    if (progressResult.status === 'fulfilled') {
      progressResult.value.data?.forEach(row => allUserIds.add(row.user_id));
    }
    if (checkinsResult.status === 'fulfilled') {
      checkinsResult.value.data?.forEach(row => allUserIds.add(row.user_id));
    }

    console.log(`📊 Found ${allUserIds.size} unique user IDs in database`);

    const orphanedUserIds: string[] = [];
    const validUserIds: string[] = [];

    // Check each user ID against Clerk
    for (const userId of allUserIds) {
      try {
        await clerkClient.users.getUser(userId);
        validUserIds.push(userId);
      } catch (error: any) {
        if (error.status === 404) {
          orphanedUserIds.push(userId);
        } else {
          console.error(`⚠️  Error checking user ${userId}:`, error.message);
        }
      }
    }

    if (orphanedUserIds.length === 0) {
      return NextResponse.json({
        message: 'No orphaned data found. Database is clean.',
        summary: {
          totalUsers: allUserIds.size,
          validUsers: validUserIds.length,
          orphanedUsers: 0,
          deleted: { tasks: 0, progress: 0, checkins: 0 }
        }
      });
    }

    console.log(`🗑️  Cleaning up data for ${orphanedUserIds.length} orphaned users...`);

    // Delete orphaned data for each user
    let totalDeleted = { tasks: 0, progress: 0, checkins: 0 };

    for (const orphanedUserId of orphanedUserIds) {
      const deletionResults = await Promise.allSettled([
        supabase.from('tasks').delete().eq('user_id', orphanedUserId),
        supabase.from('user_progress').delete().eq('user_id', orphanedUserId),
        supabase.from('daily_checkins').delete().eq('user_id', orphanedUserId)
      ]);

      deletionResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const count = result.value.count || 0;
          if (index === 0) totalDeleted.tasks += count;
          else if (index === 1) totalDeleted.progress += count;
          else if (index === 2) totalDeleted.checkins += count;
        }
      });
    }

    console.log('🎉 Cleanup completed via API');

    return NextResponse.json({
      message: 'Orphaned data cleanup completed successfully',
      summary: {
        totalUsers: allUserIds.size,
        validUsers: validUserIds.length,
        orphanedUsers: orphanedUserIds.length,
        deleted: totalDeleted
      }
    });

  } catch (error) {
    console.error('❌ Error during API cleanup:', error);
    return NextResponse.json({
      error: 'Failed to cleanup orphaned data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}