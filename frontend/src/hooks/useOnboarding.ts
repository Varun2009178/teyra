'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';

export function useOnboarding() {
  const { isLoaded: isAuthLoaded, userId } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until both auth and user are loaded
    if (!isAuthLoaded || !isUserLoaded || !userId || !user) {
      return;
    }

    // Check if this is a new user (created in the last 15 minutes - increased from 5 minutes)
    const creationTime = new Date(user.createdAt).getTime();
    const now = new Date().getTime();
    const fifteenMinutesInMs = 15 * 60 * 1000; // Increased to 15 minutes
    const isNewUser = now - creationTime < fifteenMinutesInMs;

    // Check if user has completed onboarding
    let hasCompletedOnboarding = false;
    try {
      hasCompletedOnboarding = localStorage.getItem(`onboarded_${userId}`) === 'true';
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }

    console.log('User status:', {
      isNewUser,
      hasCompletedOnboarding,
      createdAt: user.createdAt,
      timeSinceCreation: (now - creationTime) / 1000 / 60 + ' minutes',
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });

    // Only redirect if user is new AND hasn't completed onboarding
    // And we're not already on the welcome page
    if (isNewUser && !hasCompletedOnboarding) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      
      if (currentPath !== '/welcome') {
        console.log('Redirecting new user to welcome page');
        
        // Use replace instead of push to avoid back button issues
        router.replace('/welcome');
      }
    }
  }, [isAuthLoaded, isUserLoaded, userId, user, router]);

  // Function to mark onboarding as complete
  const completeOnboarding = () => {
    if (userId) {
      try {
        // Use sessionStorage for faster access
        sessionStorage.setItem(`onboarded_${userId}`, 'true');
        // Also set in localStorage for persistence
        localStorage.setItem(`onboarded_${userId}`, 'true');
        console.log('Onboarding marked as complete for user:', userId);
        return true;
      } catch (error) {
        console.error('Error marking onboarding as complete:', error);
        return false;
      }
    }
    return false;
  };

  return { completeOnboarding };
}