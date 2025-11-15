import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ iOS: Deleting user ${userId} from Clerk`);

    // Delete from Clerk (webhook will clean up Supabase)
    await clerkClient.users.deleteUser(userId);

    console.log(`✅ Successfully deleted Clerk user: ${userId}`);
    console.log(`📝 Webhook will handle Supabase cleanup for user: ${userId}`);

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully. Supabase cleanup will be handled by webhook.'
    });

  } catch (error: any) {
    console.error('❌ Error deleting user:', error);

    // Check if it's a verification error
    if (error?.message?.includes('verification') ||
        error?.message?.includes('auth factor') ||
        error?.status === 422) {
      return NextResponse.json({
        error: 'Account deletion requires additional verification. Please contact support or try again later.',
        code: 'VERIFICATION_REQUIRED'
      }, { status: 422 });
    }

    // Handle user not found
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
