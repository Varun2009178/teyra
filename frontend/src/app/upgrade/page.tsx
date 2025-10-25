'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    // Get referral code from URL
    const referralCode = searchParams.get('ref');

    // Store referral code in sessionStorage
    if (referralCode) {
      sessionStorage.setItem('teyra_referral', referralCode);
      console.log('✅ Referral code stored:', referralCode);
    }

    // Redirect to dashboard (where they can upgrade)
    if (isSignedIn) {
      // User is signed in - go to dashboard
      router.push('/dashboard');
    } else {
      // User not signed in - go to sign in page
      router.push('/sign-in');
    }
  }, [isSignedIn, isLoaded, searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white/60">redirecting to teyra...</p>
      </div>
    </div>
  );
}
