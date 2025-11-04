import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

// Using shared singleton

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preferences } = await request.json();
    
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Preferences object required' }, { status: 400 });
    }

    // Store notification preferences in user_progress table
    const { error } = await supabase
      .from('user_progress')
      .update({ 
        notification_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification preferences updated successfully' 
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



