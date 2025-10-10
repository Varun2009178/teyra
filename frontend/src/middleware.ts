import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes - no wildcards, use exact paths
const isPublic = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sign-in/sso-callback(.*)',
  '/sign-up/sso-callback(.*)',
  '/contact',
  '/sustainability',
  '/sso-callback(.*)',
  '/api/webhooks/clerk',
  '/api/cron/(.*)',
  '/api/admin/(.*)',
]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();

  // Always allow public routes
  if (isPublic(req)) {
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access protected route, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // For authenticated users, allow access to all protected routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};