'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';

export default function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: isAuthLoaded, userId } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until both auth and user are loaded
    if (!isAuthLoaded || !isUserLoaded || !userId || !user) {
      return;
    }

    // Skip onboarding check for certain paths
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (
      currentPath === '/welcome' || 
      currentPath === '/sign-in' || 
      currentPath === '/sign-up' || 
      currentPath === '/' ||
      currentPath.startsWith('/sso-callback')
    ) {
      return;
    }

    // Check if this is a new user (created in the last 15 minutes)
    const creationTime = new Date(user.createdAt).getTime();
    const now = new Date().getTime();
    const fifteenMinutesInMs = 15 * 60 * 1000;
    const isNewUser = now - creationTime < fifteenMinutesInMs;

    // Check if user has completed onboarding
    let hasCompletedOnboarding = false;
    try {
      hasCompletedOnboarding = localStorage.getItem(`onboarded_${userId}`) === 'true';
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }

    console.log('[OnboardingProvider] User status:', {
      isNewUser,
      hasCompletedOnboarding,
      createdAt: user.createdAt,
      timeSinceCreation: (now - creationTime) / 1000 / 60 + ' minutes',
      currentPath
    });

    // Redirect new users who haven't completed onboarding to the welcome page
    if (isNewUser && !hasCompletedOnboarding) {
      console.log('[OnboardingProvider] Redirecting new user to welcome page');
      
      // Use both router.replace and direct window.location for maximum reliability
      router.replace('/welcome');
      
      // Also use direct navigation as a backup
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/welcome') {
          console.log('Forcing redirect to welcome page via window.location');
          window.location.href = '/welcome';
        }
      }, 100);
    }
  }, [isAuthLoaded, isUserLoaded, userId, user, router]);

  return <>{children}</>;
}