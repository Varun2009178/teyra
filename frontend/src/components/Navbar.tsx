'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  
  // Don't show navbar on dashboard
  if (pathname === '/dashboard') {
    return null;
  }

  return (
    <header className="px-6 py-4 fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-colors duration-150">
      <div className="max-w-7xl mx-auto flex justify-between items-center relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center space-x-3"
        >
          <motion.div
            whileHover={{ rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
          >
            <Link href="/">
              <Image
                src="/teyra-logo-64kb.png"
                alt="Teyra Logo"
                width={40}
                height={40}
                className="rounded-lg shadow-sm"
              />
            </Link>
          </motion.div>
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
          {isSignedIn ? (
            <>
              <Button className="bg-black hover:bg-gray-800 text-white" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {pathname !== '/sign-in' && (
                <Button variant="ghost" asChild className="hover:bg-gray-50 text-gray-700 font-medium">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              )}
              {pathname !== '/sign-up' && (
                <Button variant="ghost" asChild className="hover:bg-gray-50 text-gray-700 font-medium">
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              )}
              <Button variant="ghost" asChild className="hover:bg-gray-50 text-gray-700 font-medium">
                <Link href="/contact">Contact</Link>
              </Button>
            </>
          ) : (
            <>
              {pathname !== '/sign-in' && (
                <Button variant="ghost" asChild className="hover:bg-gray-50 text-gray-700 font-medium">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              )}
              {pathname !== '/sign-up' && (
                <Button className="bg-black hover:bg-gray-800 text-white" asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              )}
              <Button variant="ghost" asChild className="hover:bg-gray-50 text-gray-700 font-medium">
                <Link href="/contact">Contact</Link>
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </header>
  );
}