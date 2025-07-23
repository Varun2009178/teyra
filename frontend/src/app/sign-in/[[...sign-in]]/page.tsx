'use client';

import React, { useEffect } from 'react';
import { SignIn, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

export default function SignInPage() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isSignedIn && userId) {
      router.push('/dashboard');
    }
  }, [isSignedIn, userId, router]);
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center -mt-8">
        <div className="w-full max-w-md mx-auto px-4">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-sm border border-gray-200 rounded-lg bg-white",
                headerTitle: "text-xl font-semibold text-black",
                headerSubtitle: "text-gray-600",
                formButtonPrimary: 
                  "w-full bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200",
                formFieldInput: 
                  "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all duration-200 bg-white text-black",
                socialButtonsIconButton: "w-full border-2 border-gray-300 hover:bg-gray-50 rounded-lg p-3 transition-all duration-200",
                socialButtonsBlockButton: "w-full border-2 border-gray-300 hover:bg-gray-50 rounded-lg p-3 transition-all duration-200",
                main: "w-full",
                form: "w-full space-y-4",
                formFieldLabel: "text-sm font-medium text-gray-700 mb-2 block",
                formFieldLabelRow: "mb-2",
                identityPreviewEditButton: "text-black hover:text-gray-700",
                formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-600",
                formFieldInputShowPasswordIcon: "w-4 h-4",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-500 text-sm font-medium",
                footer: "hidden",
                footerAction: "hidden",
              },
              layout: {
                socialButtonsVariant: "blockButton",
                socialButtonsPlacement: "bottom",
              },
              variables: {
                colorPrimary: '#000000',
                colorText: '#000000',
                colorTextSecondary: '#6b7280',
                colorBackground: '#ffffff',
                colorInputText: '#000000',
                colorInputBackground: '#ffffff',
                colorBorder: '#d1d5db',
              }
            }}
            redirectUrl="/dashboard"
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </div>
  );
}