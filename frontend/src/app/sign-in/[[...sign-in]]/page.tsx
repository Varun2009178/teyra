'use client';

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useUser, SignOutButton } from '@clerk/nextjs';

export default function SignInPage() {
  const { user, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Same as landing page */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-3"
          >
            <Image
              src="/teyra-logo-64kb.png"
              alt="Teyra Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <Link href="/" className="text-2xl font-bold text-black">
              Teyra
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex space-x-4"
          >
            {!isLoaded ? (
              <>
                <Button variant="ghost" disabled>
                  Loading...
                </Button>
                <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" disabled>
                  Loading...
                </Button>
              </>
            ) : user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <SignOutButton>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    Sign Out
                  </Button>
                </SignOutButton>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome back</h1>
          </div>
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg border border-gray-200 bg-white rounded-xl",
                headerTitle: "text-gray-900 text-2xl font-bold",
                headerSubtitle: "text-gray-600",
                formButtonPrimary: "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold",
                formFieldInput: "bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500",
                formFieldLabel: "text-gray-700 font-medium",
                footerActionLink: "text-red-600 hover:text-red-700",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-500",
                socialButtonsBlockButton: "border-gray-300 text-gray-700 hover:bg-gray-50",
              }
            }}
          />
        </div>
      </main>
    </div>
  );
} 