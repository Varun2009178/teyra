'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
// Import both Navbars
import LandingNavbar from "@/lib/components/landing-navbar"; 
import DashboardNavbar from "@/lib/components/navbar"; // This is the dashboard sidebar

// Paths where LandingNavbar is primarily intended
const landingNavbarPaths = ['/', '/login', '/signup', '/create-profile', '/about', '/contact', '/faq'];

// Paths where DashboardNavbar (sidebar) is relevant when authenticated
const dashboardSidebarPaths = ['/dashboard', '/tasks', '/calendar', '/impact', '/profile', '/badges', '/settings'];

// Paths where an explicit redirect to login should occur if unauthenticated
const protectedAppPaths = ['/dashboard', '/tasks', '/calendar', '/impact', '/profile', '/badges', 'settings'];


interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const checkAuthAndRedirect = (session: any) => {
      const isLoggedIn = !!session;
      const newAuthStatus = isLoggedIn ? 'authenticated' : 'unauthenticated';
      setAuthStatus(newAuthStatus);

      if (!isLoggedIn && protectedAppPaths.includes(pathname)) {
        console.log('(Auth Check) Redirecting to login from protected path:', pathname);
        router.push('/login');
      }
    };

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuthAndRedirect(session);
    });

    // Listen for future auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAuthAndRedirect(session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [pathname, router]); 

  const isLandingPath = landingNavbarPaths.includes(pathname);
  const isDashboardPath = dashboardSidebarPaths.includes(pathname);

  let showLandingNavbar = false;
  let showDashboardNavbar = false;

  if (authStatus === 'authenticated') {
    if (isDashboardPath && pathname !== '/create-profile') {
      showDashboardNavbar = true;
    } else if (pathname === '/') { // Show landing navbar on homepage even if authenticated
      showLandingNavbar = true;
    } else if (isLandingPath) { // Show landing navbar on other public pages like /about, /faq, /contact if authenticated
        showLandingNavbar = true;
    }
    // If authenticated and on /create-profile, neither should show based on this.
    // If on a path not in landingNavbarPaths or dashboardSidebarPaths when authenticated, no navbar shows by default.
  } else { // Unauthenticated or loading
    if (isLandingPath) {
      showLandingNavbar = true;
    }
  }

  // Handle loading state for non-public pages
  if (authStatus === 'loading' && protectedAppPaths.includes(pathname)) {
     return <div className="h-screen w-screen bg-black flex items-center justify-center"><p className='text-neutral-500'>Loading...</p></div>;
  }

  // Prevent rendering children on protected route if unauthenticated (avoids flash)
  // This check ensures that we don't show content meant for authenticated users while redirecting.
  if (authStatus === 'unauthenticated' && protectedAppPaths.includes(pathname)) {
      return <div className="h-screen w-screen bg-black"></div>; 
  }
  
  const mainContentPadding = showDashboardNavbar ? 'md:pl-64 pb-16 md:pb-0' : (showLandingNavbar ? 'pt-16' : '');

  return (
    // Ensure the root div takes up the full screen height if no navbar pushes content down.
    <div className={`flex flex-col h-screen`}> 
      {showLandingNavbar && <LandingNavbar />}
      <div className={`flex flex-1 overflow-hidden ${showLandingNavbar && !showDashboardNavbar ? 'pt-0' : ''}`}> {/* pt-0 adjustment when only landing is shown */}
        {showDashboardNavbar && <DashboardNavbar />} 
        <main className={`flex-1 overflow-y-auto ${mainContentPadding}`}> 
          {children}
        </main>
      </div>
    </div>
  );
} 