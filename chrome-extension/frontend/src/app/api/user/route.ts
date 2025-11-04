import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createUserProgress } from '@/lib/supabase-service';

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
