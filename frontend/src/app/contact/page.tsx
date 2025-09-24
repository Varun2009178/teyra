'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Heart } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';

export default function ContactPage() {
  const { user, isSignedIn } = useUser();
  
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
            <div className="flex items-center space-x-4">
              <Link href="/">
                <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                  style={{ outline: 'none', boxShadow: 'none' }}>
                  home
                </button>
              </Link>
              <Link href="/sustainability">
                <button className="px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 text-white"
                  style={{ outline: 'none', boxShadow: 'none' }}>
                  sustainability
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
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center pt-28 lg:pt-32 pb-12">
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Contact
            </h1>
            <p className="text-lg text-white/60">
              questions or feedback? we'd love to hear from you.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="glass-dark-modern border-precise">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2 text-white">
                  <Mail className="w-5 h-5 text-white/60" />
                  get in touch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-white">email</h3>
                  <p className="text-lg font-medium text-white/80">
                    greenteyra@gmail.com
                  </p>
                  <p className="text-sm text-white/50">we respond within 24 hours</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 