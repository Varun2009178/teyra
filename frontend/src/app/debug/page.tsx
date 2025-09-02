'use client';

import { useAuth, useUser } from '@clerk/nextjs';

export default function DebugPage() {
  const { isLoaded: authLoaded, userId, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl mb-6">🐛 Debug Authentication Status</h1>
      
      <div className="space-y-4 font-mono text-sm">
        <div>
          <strong>Auth Status:</strong>
          <ul className="ml-4 mt-2 space-y-1">
            <li>authLoaded: {String(authLoaded)}</li>
            <li>isSignedIn: {String(isSignedIn)}</li>
            <li>userId: {userId || 'null'}</li>
          </ul>
        </div>
        
        <div>
          <strong>User Status:</strong>
          <ul className="ml-4 mt-2 space-y-1">
            <li>userLoaded: {String(userLoaded)}</li>
            <li>user.id: {user?.id || 'null'}</li>
            <li>user.emailAddresses: {user?.emailAddresses?.[0]?.emailAddress || 'null'}</li>
            <li>user.createdAt: {user?.createdAt ? new Date(user.createdAt).toISOString() : 'null'}</li>
          </ul>
        </div>
        
        <div>
          <strong>Current URL:</strong>
          <p className="ml-4">{typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
        </div>
        
        <div>
          <strong>Environment:</strong>
          <ul className="ml-4 mt-2 space-y-1">
            <li>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 20) || 'null'}...</li>
            <li>App URL: {process.env.NEXT_PUBLIC_APP_URL || 'null'}</li>
          </ul>
        </div>

        <div className="mt-8 space-x-4">
          <a href="/dashboard" className="bg-blue-600 px-4 py-2 rounded">
            Go to Dashboard
          </a>
          <a href="/welcome" className="bg-green-600 px-4 py-2 rounded">
            Go to Welcome
          </a>
          <button onClick={() => window.location.reload()} className="bg-gray-600 px-4 py-2 rounded">
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}