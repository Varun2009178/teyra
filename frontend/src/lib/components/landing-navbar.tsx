'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

const LandingNavbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-neutral-800/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand Name */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center text-2xl font-bold text-white tracking-tight">
              <Image 
                src="/teyra-logo.png" 
                alt="Teyra Logo" 
                width={40}
                height={40}
                className="mr-2"
              />
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <NavLink href="/about">About</NavLink>
            <NavLink href="/contact">Contact</NavLink>
            <NavLink href="/faq">FAQ</NavLink>
          </div>

          {/* TODO: Add Mobile Menu Button if needed */}
          {/* <div className="sm:hidden"> ... </div> */}
        </div>
      </div>
    </motion.nav>
  );
};

// Helper component for nav links with hover effect
const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <Link
      href={href}
      className="text-neutral-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium relative"
    >
      {children}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 scale-x-0 origin-center"
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      /> 
    </Link>
  );
};

export default LandingNavbar; 