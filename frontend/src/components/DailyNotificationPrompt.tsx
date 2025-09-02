// Optional: Auto-popup for daily notification permissions
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { getNotificationCapabilities, requestNotificationPermission } from '@/lib/notification-utils';

export default function DailyNotificationPrompt() {
  const { user } = useUser();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const checkAndShowPrompt = () => {
      const capabilities = getNotificationCapabilities();
      const lastPromptDate = localStorage.getItem('lastNotificationPrompt');
      const userFirstPrompt = localStorage.getItem(`firstNotificationPrompt_${user.id}`);
      const today = new Date().toDateString();
      const userCreatedAt = new Date(user.createdAt!);
      const accountAge = Date.now() - userCreatedAt.getTime();
      const isNewUser = accountAge < (24 * 60 * 60 * 1000); // Less than 24 hours old
      
      // Show if:
      // 1. Notifications are supported but not granted
      // AND one of:
      // 2a. New user and hasn't seen first prompt yet
      // 2b. Existing user and haven't shown prompt today
      if (capabilities.supported && capabilities.permission !== 'granted') {
        if (isNewUser && !userFirstPrompt) {
          // Show immediately for new users (after short delay)
          setTimeout(() => setShowPrompt(true), 2000);
        } else if (!isNewUser && lastPromptDate !== today) {
          // Show for existing users once per day
          setTimeout(() => setShowPrompt(true), 3000);
        }
      }
    };

    checkAndShowPrompt();
  }, [user]);

  const handleEnable = async () => {
    await requestNotificationPermission();
    const today = new Date().toDateString();
    localStorage.setItem('lastNotificationPrompt', today);
    if (user?.id) {
      localStorage.setItem(`firstNotificationPrompt_${user.id}`, today);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem('lastNotificationPrompt', today);
    if (user?.id) {
      localStorage.setItem(`firstNotificationPrompt_${user.id}`, today);
    }
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 glass-dark-modern border-precise rounded-xl shadow-2xl p-4 max-w-sm z-40"
        >
          <div className="flex items-start space-x-3">
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-full p-2 flex-shrink-0">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white text-sm">
                Stay on track with Mike! 🌵
              </h4>
              <p className="text-white/70 text-sm mt-1">
                Get daily reminders to keep your productivity growing
              </p>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleEnable}
                  className="bg-white hover:bg-white/90 text-black px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Enable
                </button>
                <button
                  onClick={handleDismiss}
                  className="border border-white/20 text-white hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/40 hover:text-white/60 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}