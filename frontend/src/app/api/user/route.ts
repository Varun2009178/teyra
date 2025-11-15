import { NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { createUserProgress, serviceSupabase } from '@/lib/supabase-service';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Auto-create user in Supabase if they don't exist (for development Clerk users)
    try {
      await createUserProgress(user.id);
      console.log(`✅ Ensured user ${user.id} exists in Supabase`);
    } catch (error) {
      // Log but don't fail - user might already exist
      console.log(`ℹ️ User creation check for ${user.id}:`, error);
    }

    // Return user data in the format the extension expects
    return NextResponse.json({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      imageUrl: user.imageUrl || '',
    });
  } catch (error) {
    console.error('Error in /api/user route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for iOS app user creation
export async function POST(request: Request) {
  try {
    const { email, username, clerkUserId, password } = await request.json();

    console.log(`📱 iOS app user creation request: email=${email}, username=${username}, hasClerkUserId=${!!clerkUserId}`);

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let userId = clerkUserId;

    // If no Clerk user ID provided, create a new Clerk user
    if (!userId) {
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
    });

  } catch (error: any) {
    console.error('❌ Error in POST /api/user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
