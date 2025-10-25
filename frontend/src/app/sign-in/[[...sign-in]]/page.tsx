'use client';

import React, { useEffect } from 'react';
import { SignIn, useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';


export default function SignInPage() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'extension';
  const isExtension = searchParams.get('extension') === 'true';

  useEffect(() => {
    if (isSignedIn && userId) {
      // If signing in from extension, show success message instead of redirecting
      if (!isExtension) {
        router.push('/dashboard');
      }
    }
  }, [isSignedIn, userId, router, isExtension]);
  
  // Show success message if user is signed in and came from extension
  if (isSignedIn && isExtension) {
    return (
      <div className="min-h-[100svh] dark-gradient-bg noise-texture text-white flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6 animate-[fadeIn_500ms_ease-out]">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Success!</h1>
            <p className="text-white/60 text-lg">You're signed in. You can close this tab now.</p>
            <p className="text-white/60 text-sm mt-4">Go back to your Chrome extension to continue</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] dark-gradient-bg noise-texture text-white flex flex-col">
      {!isEmbed && (
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
                  />
                  <span className="text-xl font-bold text-white">teyra</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/sign-up">
                  <button className="px-6 py-2.5 text-sm font-semibold bg-white hover:bg-white/90 text-black rounded-lg transition-all duration-200"
                    style={{ outline: 'none', boxShadow: 'none' }}>
                    get started
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      <div className={`flex-1 flex items-center justify-center px-4 ${isEmbed ? 'pt-0' : 'pt-28 lg:pt-32'}`}>
        <div className="w-full max-w-md mx-auto">
          <div className="w-full animate-[fadeIn_500ms_ease-out]">
            <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "liquid-glass-strong liquid-glass-depth border-precise rounded-2xl shadow-xl",
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
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
          />
          </div>
        </div>
      </div>
    </div>
  );
}