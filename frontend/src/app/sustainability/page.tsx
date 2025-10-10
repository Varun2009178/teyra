'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Recycle, Heart, Globe, TreePine, Sun, Droplets, Wind, Menu, X } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';

export default function SustainabilityPage() {
  const { user, isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen dark-gradient-bg noise-texture text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark-modern border-b border-precise">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 px-1 py-1 rounded hover:bg-white/5 transition-colors">
                <Image
                  src="/teyra-logo-64kb.png"
                  alt="Teyra"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-white">teyra</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/">
                <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                  style={{ outline: 'none', boxShadow: 'none' }}>
                  home
                </button>
              </Link>
              <Link href="/contact">
                <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                  style={{ outline: 'none', boxShadow: 'none' }}>
                  contact
                </button>
              </Link>
              {isSignedIn ? (
                <>
                  <Link href="/dashboard">
                    <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      dashboard
                    </button>
                  </Link>
                  <div className="w-px h-6 bg-white/20 mx-2"></div>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 border-2 border-white/20 hover:border-white/40 transition-colors"
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <Link href="/sign-in">
                    <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      sign in
                    </button>
                  </Link>
                  <div className="w-px h-6 bg-white/20 mx-2"></div>
                  <Link href="/sign-up">
                    <button className="px-6 py-2.5 text-sm font-semibold bg-white hover:bg-white/90 text-black rounded-lg transition-all duration-200"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      get started
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 space-y-3 border-t border-white/10">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white text-left"
                  style={{ outline: 'none', boxShadow: 'none' }}>
                  home
                </button>
              </Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white text-left"
                  style={{ outline: 'none', boxShadow: 'none' }}>
                  contact
                </button>
              </Link>
              {isSignedIn ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white text-left"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      dashboard
                    </button>
                  </Link>
                  <div className="flex items-center justify-center pt-2">
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10 border-2 border-white/20 hover:border-white/40 transition-colors"
                        }
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white text-left"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      sign in
                    </button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-6 py-2.5 text-sm font-semibold bg-white hover:bg-white/90 text-black rounded-lg transition-all duration-200 text-left"
                      style={{ outline: 'none', boxShadow: 'none' }}>
                      get started
                    </button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center pt-28 lg:pt-32 pb-12">
        <div className="w-full max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Leaf className="w-8 h-8 text-green-400 mr-3" />
              <h1 className="text-4xl font-bold text-white">
                sustainability
              </h1>
            </div>
            <p className="text-lg text-white/60">
              productivity and environmental care go hand in hand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="glass-dark-modern border-precise">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Wind className="w-5 h-5 text-green-400" />
                  mindful ai usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/60">
                  we only use ai when it genuinely improves your experience.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-dark-modern border-precise">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
                  <TreePine className="w-5 h-5 text-green-400" />
                  green hosting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/60">
                  our infrastructure runs on renewable energy sources.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}