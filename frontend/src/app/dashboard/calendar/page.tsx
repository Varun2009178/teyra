'use client';

import { useEffect, useState, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarView } from '@/components/CalendarView';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';

function CalendarPageContent() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    checkConnection();
    checkProStatus();

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

  async function checkProStatus() {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      setIsPro(data.isPro || false);
    } catch (error) {
      console.error('Error checking Pro status:', error);
    }
  }

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

  async function disconnectCalendar() {
    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Google Calendar disconnected successfully');
        setIsConnected(false);
        setShowDisconnectModal(false);
        router.push('/dashboard/calendar');
      } else {
        throw new Error(data.error || 'Failed to disconnect calendar');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect calendar');
    } finally {
      setIsDisconnecting(false);
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
        {/* Navbar */}
        <Navbar isPro={isPro} showSettings={true} />

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

      {/* Navbar */}
      <Navbar
        isPro={isPro}
        showSettings={true}
        onSettingsClick={() => setShowDisconnectModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <CalendarView />
      </main>

      {/* Disconnect Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Disconnect Google Calendar?</h2>
              <p className="text-white/60 text-sm">
                This will remove calendar sync and delete the connection to your Google Calendar. Your tasks will remain, but scheduled times will no longer sync.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectModal(false)}
                disabled={isDisconnecting}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={disconnectCalendar}
                disabled={isDisconnecting}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen dark-gradient-bg flex items-center justify-center">
        <div className="text-white/60">loading...</div>
      </div>
    }>
      <CalendarPageContent />
    </Suspense>
  );
}
