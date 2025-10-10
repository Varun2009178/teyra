import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/contact',
  '/sustainability',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // Allow all public routes without any checks
  if (isPublicRoute(req)) {
    return;
  }

  // For protected routes, protect them (Clerk handles the redirect internally)
  auth().protect();
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};