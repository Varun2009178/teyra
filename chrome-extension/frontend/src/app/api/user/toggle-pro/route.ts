import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

// Using shared singleton

// POST /api/user/toggle-pro - Toggle Pro status for testing (DEV ONLY)
export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current Pro status
    const { data: userData, error: fetchError } = await supabase
      .from('user_progress')
      .select('is_pro')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle to allow null response

    const currentProStatus = userData?.is_pro || false;
    const newProStatus = !currentProStatus;

    // Upsert Pro status (create if doesn't exist, update if does)
    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        is_pro: newProStatus,
        pro_since: newProStatus ? new Date().toISOString() : null,
        stripe_customer_id: newProStatus ? 'test_customer_dev' : null,
        stripe_subscription_id: newProStatus ? 'test_sub_dev' : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error updating Pro status:', upsertError);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    console.log(`✅ Toggled Pro status: ${currentProStatus} → ${newProStatus} for user ${userId}`);

    return NextResponse.json({
      success: true,
      was: currentProStatus,
      now: newProStatus,
      message: newProStatus ? 'Upgraded to Pro! 🎉' : 'Downgraded to Free'
    });

  } catch (error) {
    console.error('Error toggling Pro status:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
