'use client';

import React, { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { SignIn, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  
  // Redirect to dashboard if user is already signed in
  useEffect(() => {
    if (isSignedIn && userId) {
      console.log('User already signed in, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [isSignedIn, userId, router]);
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Main content - centered both horizontally and vertically */}
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md mx-auto">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-sm border border-gray-200 rounded-lg mx-auto",
                headerTitle: "text-2xl font-bold text-gray-900",
                headerSubtitle: "text-gray-500",
                formButtonPrimary: 
                  "bg-black hover:bg-gray-800 text-white",
                formFieldInput: 
                  "border-gray-200 focus:border-black focus:ring-black",
                footerActionLink: "text-black hover:underline",
                socialButtonsIconButton: "border-gray-200 hover:bg-gray-50",
                socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50",
                main: "mx-auto",
                form: "mx-auto",
              },
              layout: {
                socialButtonsVariant: "iconButton",
                socialButtonsPlacement: "top",
              },
              variables: {
                colorPrimary: '#000000',
                colorText: '#000000',
                colorTextSecondary: '#666666',
                colorBackground: '#ffffff',
                colorInputText: '#000000',
                colorInputBackground: '#ffffff',
                colorInputBorder: '#e5e7eb',
              }
            }}
            redirectUrl="/dashboard"
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Teyra. All rights reserved.</p>
      </footer>
    </div>
  );
}