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
              <Link href="/" className="flex items-center space-x-2">
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
              <Link href="/sustainability">
                <Button variant="ghost" className="btn-modern">
                  sustainability
                </Button>
              </Link>
              {isSignedIn ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="btn-modern">
                      dashboard
                    </Button>
                  </Link>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 border border-white/20"
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost" className="btn-modern">
                      sign in
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="btn-primary-modern">
                      get started
                    </Button>
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
              Contact Us
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Questions or feedback? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <Card className="glass-dark-modern border-precise">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2 text-white">
                  <Mail className="w-5 h-5 text-white/60" />
                  Get in Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-white">Email</h3>
                  <p className="text-lg font-medium text-white/80">
                    greenteyra@gmail.com
                  </p>
                  <p className="text-sm text-white/50">We respond within 24 hours</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-white">We Welcome</h3>
                  <p className="text-white/60">
                    Feedback, bug reports, feature requests, and stories about how Teyra helps you.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* About Teyra */}
            <Card className="glass-dark-modern border-precise">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2 text-white">
                  <Heart className="w-5 h-5 text-white/60" />
                  About Teyra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/60">
                  We're building an emotionally intelligent productivity companion that understands your unique workflow.
                </p>
                <p className="text-white/60">
                  We focus on sustainable habits and emotional well-being. No burnout, no guilt. Just healthy progress.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 