'use client';

import { useEffect } from 'react';
import { trackReferral } from '@/lib/referral';

export function ReferralTracker() {
  useEffect(() => {
    // Track referral on client side
    trackReferral();
  }, []);

  return null; // This component doesn't render anything
}
