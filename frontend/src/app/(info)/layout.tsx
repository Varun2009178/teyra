import LandingNavbar from '@/lib/components/landing-navbar';
import React from 'react';

export default function InfoPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <LandingNavbar />
      {/* Add padding-top to account for the fixed navbar height (h-16 = 4rem or 64px) */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
} 