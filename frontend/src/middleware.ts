import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes - no wildcards, use exact paths
const isPublic = createRouteMatcher([
  '/',
  '/sign-in',
  '/sign-up',
  '/sso-callback',
  '/api/webhook/clerk',
]);

export default clerkMiddleware((auth, req) => {
  // If the route is public, allow access
  if (isPublic(req)) {
    return NextResponse.next();
  }

  // For all other routes, let Clerk handle authentication
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};