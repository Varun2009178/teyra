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