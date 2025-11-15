import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// This route handles the redirect back from Stripe
// It's public because Clerk session might have expired during checkout
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      // User is not authenticated, redirect to sign-in with the original params
      const searchParams = req.nextUrl.searchParams;
      const sessionId = searchParams.get('session_id');
      const proWelcome = searchParams.get('pro_welcome');
      const upgrade = searchParams.get('upgrade');

      // Build redirect URL to preserve state after sign-in
      const params = new URLSearchParams();
      if (sessionId) params.set('session_id', sessionId);
      if (proWelcome) params.set('pro_welcome', proWelcome);
      if (upgrade) params.set('upgrade', upgrade);

      const redirectUrl = `/dashboard?${params.toString()}`;
      return NextResponse.redirect(new URL(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`, req.url));
    }

    // User is authenticated, forward to dashboard with all params
    const searchParams = req.nextUrl.searchParams;
    const dashboardUrl = new URL('/dashboard', req.url);
    searchParams.forEach((value, key) => {
      dashboardUrl.searchParams.set(key, value);
    });

    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error('❌ Error in Stripe callback:', error);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
}
