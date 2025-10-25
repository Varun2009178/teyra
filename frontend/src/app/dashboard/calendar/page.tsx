'use client';

import { useEffect, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarView } from '@/components/CalendarView';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Calendar, List, Settings, HelpCircle, User as UserIcon, Trash2 } from 'lucide-react';

export default function CalendarPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();

    // Handle OAuth callback
    if (searchParams.get('connected') === 'true') {
      toast.success('Google Calendar connected successfully!');
      setIsConnected(true);
      // Clean up URL
      router.replace('/dashboard/calendar');
    }

    const error = searchParams.get('error');
    if (error) {
      toast.error(`Connection failed: ${error}`);
      router.replace('/dashboard/calendar');
    }
  }, [searchParams]);

  async function checkConnection() {
    try {
      const response = await fetch('/api/calendar/status');
      const data = await response.json();
      setIsConnected(data.connected || false);
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function connectCalendar() {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/calendar/connect');
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect calendar');
      setIsConnecting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen dark-gradient-bg noise-texture flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full mb-4 mx-auto animate-spin" />
          <p className="text-white/60 font-medium">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen dark-gradient-bg noise-texture text-white">
        {/* Header */}
        <header className="border-b border-white/10 liquid-glass sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Image
                  src="/teyra-logo-64kb.png"
                  alt="Teyra"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              </div>
              <div className="hidden sm:flex items-center gap-6 text-base">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-3 py-1 rounded-lg text-white/70 hover:text-white border border-transparent hover:border-white/15 hover:bg-white/10 transition-all duration-150 font-medium"
                >
                  Dashboard
                </button>
                <button
                  className="px-3 py-1 rounded-lg text-white border border-white/15 bg-white/5 transition-all duration-150 font-medium flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                  <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] font-bold rounded uppercase tracking-wide">
                    beta
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 rounded-full",
                    userButtonPopover: "bg-zinc-900 border border-white/10 shadow-xl",
                    userButtonTrigger: "rounded-full"
                  }
                }}
              />
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-light tracking-tight">Calendar</h1>
            <p className="text-gray-400 text-sm">
              Connect your Google Calendar to view and schedule tasks in one place
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
            <div className="space-y-3 text-left text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span>View your calendar and tasks together</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span>Drag and drop tasks to schedule them</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span>Two-way sync with Google Calendar</span>
              </div>
            </div>

            <button
              onClick={connectCalendar}
              disabled={isConnecting}
              className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </button>

            <p className="text-xs text-gray-500">
              We'll never access your data without permission
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </motion.div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-gradient-bg noise-texture text-white relative overflow-hidden">
      {/* Vibrant gradient orbs behind glass panels */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-72 h-72 bg-pink-500 rounded-full filter blur-[110px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 liquid-glass sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Image
                src="/teyra-logo-64kb.png"
                alt="Teyra"
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </div>
            <div className="hidden sm:flex items-center gap-6 text-base">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-1 rounded-lg text-white/70 hover:text-white border border-transparent hover:border-white/15 hover:bg-white/10 transition-all duration-150 font-medium"
              >
                Dashboard
              </button>
              <button
                className="px-3 py-1 rounded-lg text-white border border-white/15 bg-white/5 transition-all duration-150 font-medium flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Calendar
                <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] font-bold rounded uppercase tracking-wide">
                  beta
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 rounded-full",
                  userButtonPopover: "bg-zinc-900 border border-white/10 shadow-xl",
                  userButtonTrigger: "rounded-full"
                }
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <CalendarView />
      </main>
    </div>
  );
}
