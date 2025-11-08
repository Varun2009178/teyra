'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Mail, Settings, X, Smartphone, Download } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isPro?: boolean;
}

export function NotificationSettings({ isOpen, onClose, isPro = false }: NotificationSettingsProps) {
  const { user } = useUser();
  const { permission, requestPermission } = useNotifications();
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPWAGuide, setShowPWAGuide] = useState(false);

  useEffect(() => {
    // Check if on mobile
    const checkMobile = () => {
      setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();

    // Load settings
    if (user?.id) {
      const emailValue = localStorage.getItem(`email_notifications_${user.id}`);
      const pushValue = localStorage.getItem(`push_notifications_${user.id}`);
      const emailSetting = emailValue === 'true';
      const pushSetting = pushValue === 'true';
      
      // Enhanced debug logging
      console.log('🔧 Loading notification settings:', {
        userId: user.id,
        emailKey: `email_notifications_${user.id}`,
        pushKey: `push_notifications_${user.id}`,
        emailValue: emailValue,
        pushValue: pushValue,
        emailEnabled: emailSetting,
        pushEnabled: pushSetting,
        allLocalStorageKeys: Object.keys(localStorage).filter(key => key.includes(user.id))
      });
      
      setEmailEnabled(emailSetting);
      setPushEnabled(pushSetting);
    }
  }, [user?.id, isOpen]); // Also reload when modal opens

  const handleEmailToggle = async () => {
    if (!user?.id) return;
    
    const newState = !emailEnabled;
    setEmailEnabled(newState);
    localStorage.setItem(`email_notifications_${user.id}`, newState.toString());
    
    // You could make an API call here to update server settings
    console.log(`Email notifications ${newState ? 'enabled' : 'disabled'} for user ${user.id}`);
  };

  const handlePushToggle = async () => {
    if (!user?.id) return;

    // MOBILE SAFE: Check permission.granted instead of permission.state
    if (!pushEnabled && !permission.granted) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    const newState = !pushEnabled;
    setPushEnabled(newState);
    localStorage.setItem(`push_notifications_${user.id}`, newState.toString());

    // Also update the notification permission state if enabling
    if (newState && !permission.granted) {
      await requestPermission();
    }

    console.log(`Push notifications ${newState ? 'enabled' : 'disabled'} for user ${user.id}`);
  };

  const handleInstallPWA = () => {
    setShowPWAGuide(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-center items-center mb-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-white" />
              <h2 className="text-xl font-bold text-white">Settings</h2>
            </div>
          </div>

          {/* Account Status */}
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60 font-medium">Account Status</span>
              {isPro ? (
                <span className="px-2 py-1 bg-white text-black rounded text-xs font-bold">PRO</span>
              ) : (
                <span className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs font-medium">FREE</span>
              )}
            </div>
            <p className="text-white font-semibold mt-1">
              {isPro ? 'Teyra Pro' : 'Teyra Free'}
            </p>
            <p className="text-white/50 text-xs mt-1">
              {isPro ? 'Unlimited AI parsing, 3 mood tasks/day, chrome ext' : '5 AI parses, 1 mood task per day'}
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            {/* Push Notifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-medium text-white">Smart Notifications</h3>
                    <p className="text-sm text-white/60">AI-powered reminders at optimal times</p>
                  </div>
                </div>
                <button
                  onClick={handlePushToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pushEnabled ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pushEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Mobile PWA Guide */}
              {isMobile && (
                <div className="ml-8 p-3 bg-orange-500/10 border border-orange-400/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Smartphone className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-orange-300">
                      <p className="font-medium">For better notifications:</p>
                      <p className="mt-1">Add Teyra to your home screen as an app for native-style notifications</p>
                      <button
                        onClick={handleInstallPWA}
                        className="mt-2 text-orange-400 hover:text-orange-300 underline"
                      >
                        Show me how →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Permission Status */}
          <div className="mt-6 p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-white/60">
              Browser notification permission: <span className="text-white font-medium">{permission.permission}</span>
            </p>
          </div>
        </motion.div>

        {/* PWA Installation Guide */}
        <AnimatePresence>
          {showPWAGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
              onClick={() => setShowPWAGuide(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black/95 border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <Download className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-4">Add to Home Screen</h3>
                  <div className="space-y-3 text-sm text-white/70 text-left">
                    <p><strong>iPhone/iPad:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Tap the Share button (square with arrow) in Safari</li>
                      <li>Scroll down and tap "Add to Home Screen"</li>
                      <li>Tap "Add" to confirm</li>
                    </ol>
                    <p className="mt-4"><strong>Android:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Tap the menu (three dots) in Chrome</li>
                      <li>Tap "Add to Home Screen"</li>
                      <li>Tap "Add" to confirm</li>
                    </ol>
                  </div>
                  <button
                    onClick={() => setShowPWAGuide(false)}
                    className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}