import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createUserProgress, serviceSupabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email, username, clerkUserId, password } = await request.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let userId: string;

    // If clerkUserId is provided, user already exists in Clerk (from iOS app)
    if (clerkUserId) {
      console.log(`📱 iOS: User ${clerkUserId} already exists in Clerk, ensuring Supabase entry exists`);
      userId = clerkUserId;
    } else {
      // Create new user in Clerk
      console.log(`📱 iOS: Creating new user in Clerk with email: ${email}`);
      
      try {
        const user = await clerkClient.users.createUser({
          emailAddress: [email],
          username: username || undefined,
          password: password || undefined,
          skipPasswordChecks: !password,
          skipPasswordRequirement: !password
        });

        userId = user.id;
        console.log(`✅ Created Clerk user: ${userId}`);
      } catch (error: any) {
        // Handle duplicate email - try to find existing user
        if (error?.errors?.[0]?.message?.includes('already exists') || 
            error?.status === 422) {
          console.log(`⚠️ User might already exist, attempting to find by email: ${email}`);
          try {
            const users = await clerkClient.users.getUserList({ emailAddress: [email] });
            if (users.data && users.data.length > 0) {
              userId = users.data[0].id;
              console.log(`✅ Found existing Clerk user: ${userId}`);
            } else {
              throw new Error('User not found and could not be created');
            }
          } catch (findError) {
            return NextResponse.json(
              { error: 'Failed to create or find user in Clerk', details: error.message },
              { status: 500 }
            );
          }
        } else {
          throw error;
        }
      }
    }

    // Ensure user exists in Supabase (create user_progress entry if needed)
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
      console.error(`❌ Error ensuring user in Supabase:`, error);
      // Don't fail the request - webhook will handle it, or we can retry later
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'User created successfully'
    });

  } catch (error: any) {
    console.error('❌ Error creating user:', error);
    
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
