// API Route: Handle Google OAuth callback
import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google-calendar';
import { serviceSupabase as supabase } from '@/lib/supabase-service';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  console.log('📅 Calendar OAuth callback received', { code: !!code, error, state: !!state });

  // Handle OAuth error
  if (error) {
    console.error('OAuth error from Google:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/calendar?error=${error}`, request.url)
    );
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(
      new URL('/dashboard/calendar?error=no_code', request.url)
    );
  }

  try {
    // Get user ID from state parameter (passed during auth URL generation)
    let userId: string | null = null;

    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        userId = decodedState.userId;
        console.log('✅ User ID from state:', userId);
      } catch (e) {
        console.error('Failed to decode state parameter:', e);
      }
    }

    // Fallback to Clerk session if state is not available
    if (!userId) {
      const { userId: clerkUserId } = await auth();
      userId = clerkUserId;
      console.log('ℹ️ User ID from Clerk session:', userId);
    }

    if (!userId) {
      console.error('No user ID found in state or session');
      return NextResponse.redirect(
        new URL('/sign-in?redirect=/dashboard/calendar', request.url)
      );
    }

    console.log('✅ User authenticated:', userId);

    // Exchange code for tokens
    console.log('🔄 Exchanging authorization code for tokens...');
    const tokens = await getTokensFromCode(code);
    console.log('✅ Tokens received from Google');

    // Store tokens in Supabase
    // Using shared singleton

    // First, check if user_progress record exists
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!existingProgress) {
      console.log('📝 Creating user_progress record...');
      // Create the record first
      const { error: createError } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          google_calendar_token: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date
          },
          google_calendar_connected_at: new Date().toISOString(),
          calendar_sync_enabled: true
        });

      if (createError) {
        console.error('❌ Error creating user_progress record:', createError);
        return NextResponse.redirect(
          new URL('/dashboard/calendar?error=storage_failed', request.url)
        );
      }
    } else {
      console.log('📝 Updating existing user_progress record...');
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_progress')
        .update({
          google_calendar_token: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date
          },
          google_calendar_connected_at: new Date().toISOString(),
          calendar_sync_enabled: true
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Error updating tokens:', updateError);
        return NextResponse.redirect(
          new URL('/dashboard/calendar?error=storage_failed', request.url)
        );
      }
    }

    console.log('✅ Calendar connected successfully! Redirecting...');

    // Success! Redirect to calendar page
    const redirectUrl = new URL('/dashboard/calendar', request.url);
    redirectUrl.searchParams.set('connected', 'true');
    console.log('🔗 Redirect URL:', redirectUrl.toString());

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/calendar?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
