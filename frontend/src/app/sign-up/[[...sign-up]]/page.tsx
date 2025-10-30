'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { SignUp, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SignUpContent() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  const hasCleanedRef = useRef(false);

  // Optimized localStorage cleanup with error handling
  useEffect(() => {
    // Only run once
    if (hasCleanedRef.current) return;
    hasCleanedRef.current = true;

    // Defer cleanup to not block rendering
    const cleanupTimeout = setTimeout(() => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) return;

        const keysToRemove = Object.keys(localStorage).filter(key =>
          key.includes('user_') || key.includes('onboarding') || key.includes('mood') ||
          key.includes('notification') || key.includes('welcome') || key.includes('insight') ||
          key.includes('reflection') || key.includes('dailyTask') || key.includes('commitment') ||
          key.includes('split') || key.includes('tutorial')
        );

        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Silent fail for individual keys
          }
        });

      } catch (error) {
        // localStorage not available or quota exceeded - continue anyway
      }
    }, 100); // Defer by 100ms to not block initial render

    return () => clearTimeout(cleanupTimeout);
  }, []);

  // Navigate to dashboard if already signed in
  useEffect(() => {
    if (isSignedIn && userId) {
      router.replace('/dashboard');
    }
  }, [isSignedIn, userId, router]);

  return (
    <div className="min-h-[100svh] dark-gradient-bg noise-texture text-white flex flex-col">
      {/* Simple navbar matching the home page */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark-modern border-b border-precise">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 px-1 py-1 rounded hover:bg-white/5 transition-colors">
                <Image
                  src="/teyra-logo-64kb.png"
                  alt="Teyra"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                  priority
                />
                <span className="text-xl font-bold text-white">teyra</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                  style={{ outline: 'none', boxShadow: 'none' }}>
                  sign in
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 pt-28 lg:pt-32">
        <div className="w-full max-w-md mx-auto">
          <div className="w-full animate-[fadeIn_500ms_ease-out]">
            <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "glass-dark-modern border-precise rounded-2xl transition-all duration-300 scale-[1.02] sm:scale-100",
                headerTitle: "text-xl font-semibold text-white",
                headerSubtitle: "text-white/60",
                formButtonPrimary:
                  "w-full bg-white hover:bg-white/90 text-black py-3 px-4 rounded-xl font-medium text-base",
                formFieldInput:
                  "w-full px-4 py-3 border border-white/20 rounded-xl focus:border-white/40 focus:ring-2 focus:ring-white/10 bg-white/5 text-white text-base placeholder:text-white/40",
                socialButtonsIconButton: "w-full border border-white/20 hover:bg-white/5 rounded-xl p-3 text-base text-white",
                socialButtonsBlockButton: "w-full border border-white/20 hover:bg-white/5 rounded-xl p-3 text-base text-white",
                main: "w-full",
                form: "w-full space-y-4",
                formFieldLabel: "text-sm font-medium text-white/80 mb-2 block",
                formFieldLabelRow: "mb-2",
                identityPreviewEditButton: "text-white hover:text-white/80",
                formFieldInputShowPasswordButton: "text-white/60 hover:text-white/80",
                formFieldInputShowPasswordIcon: "w-4 h-4",
                dividerLine: "bg-white/20",
                dividerText: "text-white/60 text-sm font-medium",
                footer: "hidden",
                footerAction: "hidden",
              },
              layout: {
                socialButtonsVariant: "blockButton",
                socialButtonsPlacement: "top",
              },
              variables: {
                colorPrimary: '#ffffff',
                colorText: '#ffffff',
                colorTextSecondary: '#a1a1aa',
                colorBackground: 'rgba(255, 255, 255, 0.05)',
                colorInputText: '#ffffff',
                colorInputBackground: 'rgba(255, 255, 255, 0.05)',
                colorBorder: 'rgba(255, 255, 255, 0.2)',
              }
            }}
            redirectUrl="/dashboard"
            afterSignUpUrl="/dashboard"
            afterSignInUrl="/dashboard"
            signInUrl="/sign-in"
          />
          </div>
        </div>
      </div>
    </div>
  );
}

// Optimized loading fallback
const LoadingFallback = () => (
  <div className="min-h-[100svh] dark-gradient-bg noise-texture text-white flex items-center justify-center">
    <div className="text-white/60">loading...</div>
  </div>
);

// Custom error fallback matching app theme
const ErrorFallback = () => (
  <div className="min-h-screen dark-gradient-bg noise-texture flex items-center justify-center">
    <div className="text-center p-8 glass-dark-modern border-precise rounded-2xl max-w-md">
      <h2 className="text-2xl font-bold text-white mb-4">
        something went wrong
      </h2>
      <p className="text-white/60 mb-6">
        we encountered an error loading sign up. please refresh.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 font-medium transition-all"
      >
        refresh page
      </button>
    </div>
  </div>
);

export default function SignUpPage() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingFallback />}>
        <SignUpContent />
      </Suspense>
    </ErrorBoundary>
  );
}
