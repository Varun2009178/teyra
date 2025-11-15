import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createUserProgress, serviceSupabase } from '@/lib/supabase-service';

// Force dynamic - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Brand new endpoint to avoid Vercel cache issues
export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json();

    console.log(`📱 iOS signup request: email=${email}, username=${username}`);

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let userId: string;

    console.log(`🔄 Creating new Clerk user for: ${email}`);
    
    try {
      // Check if user already exists by email
      const existingUsers = await clerkClient.users.getUserList({
        emailAddress: [email],
      });

      if (existingUsers.data.length > 0) {
        console.log(`✅ User already exists in Clerk: ${email}`);
        userId = existingUsers.data[0].id;
      } else {
        // Create new Clerk user
        const newUser = await clerkClient.users.createUser({
          emailAddress: [email],
          username: username || undefined,
          password: password || `temp_${Math.random().toString(36).substring(7)}`,
        });
        
        userId = newUser.id;
        console.log(`✅ Created new Clerk user: ${userId}`);
      }
    } catch (clerkError: any) {
      console.error('❌ Clerk user creation error:', clerkError);
      
      if (clerkError.errors?.[0]?.code === 'form_identifier_exists') {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create user account', details: clerkError.message },
        { status: 500 }
      );
    }

    // Ensure user exists in Supabase (create user_progress entry if needed)
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
      console.error(`❌ Error ensuring user in Supabase:`, error);
    }

    console.log(`✅ User creation complete for: ${email} (${userId})`);

    return NextResponse.json({
      success: true,
      userId,
      message: 'User created successfully'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store'
      }
    });

  } catch (error: any) {
    console.error('❌ Error in POST /api/ios-signup:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

