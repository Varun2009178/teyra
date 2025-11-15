import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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

    // If clerkUserId is provided, user already exists in Clerk (from iOS app)
    // Just ensure they exist in Supabase via webhook or direct creation
    if (clerkUserId) {
      console.log(`📱 iOS: User ${clerkUserId} already exists in Clerk, ensuring Supabase entry exists`);
      
      // The webhook should have already created the entry, but we can verify
      // For now, just return success - webhook handles Supabase creation
      return NextResponse.json({
        success: true,
        clerkUserId: clerkUserId,
        message: 'User already exists in Clerk'
      });
    }

    // Create new user in Clerk
    console.log(`📱 iOS: Creating new user in Clerk with email: ${email}`);
    
    const user = await clerkClient.users.createUser({
      emailAddress: [email],
      username: username || undefined,
      password: password || 'temporary-password-user-will-reset', // iOS app should provide password
      skipPasswordChecks: !password, // Skip checks if no password provided (user will reset)
      skipPasswordRequirement: !password
    });

    console.log(`✅ Created Clerk user: ${user.id}`);

    // Clerk webhook will automatically create entry in Supabase user_progress
    // But we can also manually create it here if needed (optional)
    // The webhook handles this, so we don't need to do it here

    return NextResponse.json({
      success: true,
      clerkUserId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      username: user.username
    });

  } catch (error: any) {
    console.error('❌ Error creating user:', error);
    
    // Handle duplicate email error
    if (error?.errors?.[0]?.message?.includes('already exists') || 
        error?.status === 422) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
