'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

function UpgradeContent() {
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

    // Redirect to dashboard with hash to scroll to upgrade section
    if (isSignedIn) {
      // User is signed in - go to dashboard upgrade section
      router.push('/dashboard#upgrade');
    } else {
      // User not signed in - go to sign in page, then they'll come back
      router.push('/sign-in?redirect=/dashboard#upgrade');
    }
  }, [isSignedIn, isLoaded, searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white/60">redirecting to upgrade...</p>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">loading...</p>
        </div>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}
