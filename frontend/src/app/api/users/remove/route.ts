import { clerkClient, auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { serviceSupabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('🗑️ POST /api/users/remove called');
  
  try {
    const body = await request.json();
    const { userId } = body;
    
    console.log('Request body userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify the session token from Authorization header
    const authHeader = request.headers.get('Authorization');
    let authenticatedUserId: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { userId: verifiedUserId } = await auth();
        if (verifiedUserId) {
          authenticatedUserId = verifiedUserId;
        }
      } catch (authError) {
        console.log(`⚠️ Auth verification failed, using userId from request`);
      }
    }

    // Verify that the authenticated user matches the userId being deleted
    if (authenticatedUserId && authenticatedUserId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot delete another user\'s account' },
        { status: 403 }
      );
    }

    console.log(`🗑️ Deleting user ${userId}`);

    // Delete from Supabase first
    try {
      const userTables = ['tasks', 'user_progress', 'user_behavior_events', 
                         'user_behavior_analysis', 'daily_checkins', 'moods', 
                         'user_ai_patterns', 'user_behavior'];
      
      for (const table of userTables) {
        try {
          await serviceSupabase.from(table).delete().eq('user_id', userId);
          console.log(`✅ Deleted from ${table} for user ${userId}`);
        } catch (error) {
          console.error(`⚠️ Error deleting from ${table}:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Error deleting Supabase data:`, error);
    }

    // Delete from Clerk
    try {
      await clerkClient.users.deleteUser(userId);
      console.log(`✅ Successfully deleted Clerk user: ${userId}`);
    } catch (error: any) {
      if (error?.status === 404) {
        console.log(`⚠️ User ${userId} not found in Clerk (may already be deleted)`);
      } else {
        throw error;
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting user:', error);
    
    if (error?.status === 404 || error?.message?.includes('not found')) {
      return NextResponse.json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

