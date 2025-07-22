'use client';

import { useAuth, SignIn, SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TestClerkPage() {
  const { isSignedIn, userId, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Clerk Authentication Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="space-y-2">
            <p><strong>Signed In:</strong> {isSignedIn ? 'Yes' : 'No'}</p>
            {userId && <p><strong>User ID:</strong> {userId}</p>}
            {user && (
              <div>
                <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
                <p><strong>Name:</strong> {user.fullName}</p>
              </div>
            )}
          </div>
        </div>

        {!isSignedIn ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sign In</h3>
              <div className="flex justify-center">
                <SignIn />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sign Up</h3>
              <div className="flex justify-center">
                <SignUp />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Authentication Working!</h3>
            <p className="text-green-700">You are successfully signed in with Clerk.</p>
          </div>
        )}
      </div>
    </div>
  );
} 