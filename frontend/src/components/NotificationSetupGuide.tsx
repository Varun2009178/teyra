'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Monitor, Bell, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'android' | 'ios' | 'desktop' | 'unknown';
  onRequestPermission?: () => Promise<void>;
}

export function NotificationSetupGuide({ isOpen, onClose, platform, onRequestPermission }: NotificationSetupGuideProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Debug logging
  console.log('NotificationSetupGuide render:', { isOpen, platform, onRequestPermission: !!onRequestPermission });

  const getPlatformInstructions = () => {
    switch (platform) {
      case 'android':
        return {
          title: 'Enable Notifications on Android',
          steps: [
            {
              icon: <Bell className="w-6 h-6 text-blue-500" />,
              title: 'Tap the notification bell',
              description: 'Look for the notification bell icon in your browser address bar'
            },
            {
              icon: <CheckCircle className="w-6 h-6 text-green-500" />,
              title: 'Allow notifications',
              description: 'Select "Allow" when prompted for notification permissions'
            },
            {
              icon: <Smartphone className="w-6 h-6 text-purple-500" />,
              title: 'Add to home screen',
              description: 'Tap the menu (⋮) and select "Add to Home screen" for app-like experience'
            }
          ]
        };
      case 'ios':
        return {
          title: 'Enable Notifications on iOS',
          steps: [
            {
              icon: <Bell className="w-6 h-6 text-blue-500" />,
              title: 'Tap the notification bell',
              description: 'Look for the notification bell icon in your browser address bar'
            },
            {
              icon: <CheckCircle className="w-6 h-6 text-green-500" />,
              title: 'Allow notifications',
              description: 'Select "Allow" when prompted for notification permissions'
            },
            {
              icon: <Smartphone className="w-6 h-6 text-purple-500" />,
              title: 'Add to home screen',
              description: 'Tap the share button and select "Add to Home Screen" for app-like experience'
            }
          ]
        };
      case 'desktop':
        return {
          title: 'Enable Notifications on Desktop',
          steps: [
            {
              icon: <Bell className="w-6 h-6 text-blue-500" />,
              title: 'Click the notification bell',
              description: 'Look for the notification bell icon in your browser address bar'
            },
            {
              icon: <CheckCircle className="w-6 h-6 text-green-500" />,
              title: 'Allow notifications',
              description: 'Click "Allow" when prompted for notification permissions'
            },
            {
              icon: <Monitor className="w-6 h-6 text-purple-500" />,
              title: 'Install as app',
              description: 'Click the install icon (📱) in your browser address bar for desktop app experience'
            }
          ]
        };
      default:
        return {
          title: 'Enable Notifications',
          steps: [
            {
              icon: <Bell className="w-6 h-6 text-blue-500" />,
              title: 'Look for notification bell',
              description: 'Find the notification bell icon in your browser address bar'
            },
            {
              icon: <CheckCircle className="w-6 h-6 text-green-500" />,
              title: 'Allow permissions',
              description: 'Click "Allow" when prompted for notification permissions'
            },
            {
              icon: <Smartphone className="w-6 h-6 text-purple-500" />,
              title: 'Enjoy notifications',
              description: 'You\'ll now get notifications for task completions and achievements!'
            }
          ]
        };
    }
  };

  const instructions = getPlatformInstructions();

  if (!isOpen) return null;

  console.log('NotificationSetupGuide rendering with:', { isOpen, platform });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border-4 border-red-500"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6" />
                <h2 className="text-xl font-bold">{instructions.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {instructions.steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {step.icon}
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Platform-specific tips */}
            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Pro Tips</h4>
                  {platform === 'android' && (
                    <p className="text-blue-700 text-sm">
                      Make sure to enable notifications in your phone's Settings → Apps → Chrome → Notifications
                    </p>
                  )}
                  {platform === 'ios' && (
                    <p className="text-blue-700 text-sm">
                      If notifications don't work, go to Settings → Safari → Notifications and ensure they're enabled
                    </p>
                  )}
                  {platform === 'desktop' && (
                    <p className="text-blue-700 text-sm">
                      You can also install Teyra as a desktop app for the best experience
                    </p>
                  )}
                  {platform === 'unknown' && (
                    <p className="text-blue-700 text-sm">
                      Make sure your browser supports notifications and try refreshing the page
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Got it!
              </button>
              {onRequestPermission && (
                <button
                  onClick={async () => {
                    try {
                      await onRequestPermission();
                      onClose();
                    } catch (error) {
                      console.error('Failed to request permission:', error);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  Enable Now
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
