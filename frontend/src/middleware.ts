import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes - no wildcards, use exact paths
const isPublic = createRouteMatcher([
  '/',
  '/sign-in',
  '/sign-up',
  '/contact',
  '/sustainability',
  '/sso-callback',
  '/api/webhooks/clerk',
  '/api/cron/(.*)',
  '/api/admin/(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // If the route is public, allow access
  if (isPublic(req)) {
    return NextResponse.next();
  }

  const { userId } = auth();

  // If user is not authenticated, redirect to home page
  if (!userId) {
    return NextResponse.redirect(new URL('/', req.url));
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