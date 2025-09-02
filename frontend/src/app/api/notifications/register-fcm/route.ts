import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fcmToken } = await request.json();
    
    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token required' }, { status: 400 });
    }

    // Store FCM token in user_progress table
    const { error } = await supabase
      .from('user_progress')
      .update({ 
        fcm_token: fcmToken,
        notifications_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error storing FCM token:', error);
      return NextResponse.json({ error: 'Failed to store FCM token' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'FCM token registered successfully' 
    });

  } catch (error) {
    console.error('Error registering FCM token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



