'use client';

import { useEffect } from 'react';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SSOCallback() {
  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    if (!isSignInLoaded || !isSignUpLoaded) return;

    // Handle the OAuth callback for sign-in
    if (signIn?.status === 'needs-oauth-callback') {
      signIn.authenticateWithRedirect({
        strategy: 'oauth_callback',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    }

    // Handle the OAuth callback for sign-up
    if (signUp?.status === 'needs-oauth-callback') {
      signUp.authenticateWithRedirect({
        strategy: 'oauth_callback',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    }

    // If we're not in an OAuth flow, redirect to dashboard
    if (
      signIn?.status !== 'needs-oauth-callback' &&
      signUp?.status !== 'needs-oauth-callback'
    ) {
      router.push('/dashboard');
    }
  }, [isSignInLoaded, isSignUpLoaded, signIn, signUp, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-black border-gray-200 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Completing authentication...</p>
      </div>
    </div>
  );
}