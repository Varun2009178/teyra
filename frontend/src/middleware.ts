import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/contact',
  '/sustainability',
  '/terms(.*)',
  '/privacy(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
  '/api/calendar/callback', // Google OAuth callback - validates auth internally
  '/api/stripe/callback', // Stripe checkout return - handles auth internally
  '/api/ios-signup',
  '/api/ios-sync',
  '/api/ios-avatar',
  '/api/ios/tasks',
  '/api/ios/tasks/(.*)',
  '/api/ios/stats',
  '/api/test-ios',
  '/api/user', // iOS fallback create route
  '/api/user/sync',
  '/api/user/delete',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes without auth
  if (isPublicRoute(req)) return;

  // Protect all other routes
  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};