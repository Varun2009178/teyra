'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Zap, CheckCircle } from 'lucide-react';

interface SmartNotificationSetupProps {
  onComplete: () => void;
  onEnableNotifications: () => void;
  onEnableEmails?: () => void;
}

export function SmartNotificationSetup({ 
  onComplete, 
  onEnableNotifications, 
  onEnableEmails 
}: SmartNotificationSetupProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  const steps = [
    {
      title: "🎉 Great Job!",
      description: "You just completed your first task! Mike is already learning from your behavior patterns.",
      icon: <CheckCircle className="w-8 h-8 text-green-400" />,
      action: null
    },
    {
      title: "🧠 AI Smart Notifications",
      description: isMobile 
        ? "Get AI-powered reminders! After enabling, you'll need to add this app to your home screen for mobile notifications to work properly."
        : "Want AI-powered reminders that learn when you're most productive? We'll send gentle nudges at optimal times, not spam.",
      icon: <Zap className="w-8 h-8 text-blue-400" />,
      action: "notifications",
      mobileInstructions: isMobile ? {
        ios: "📱 iOS: Tap Share → 'Add to Home Screen'",
        android: "📱 Android: Tap Menu (⋮) → 'Add to Home Screen' or 'Install App'"
      } : null
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleActionButton = () => {
    if (currentStepData.action === 'notifications') {
      onEnableNotifications();
    } else if (currentStepData.action === 'emails' && onEnableEmails) {
      onEnableEmails();
    }
    handleNext();
  };

  const handleSkip = () => {
    handleNext();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm font-medium text-white/60">
              {currentStep + 1} of {steps.length}
            </div>
            <button
              onClick={onComplete}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-400 to-purple-400 rounded-full h-2"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <div className="mb-4 flex justify-center">
                {currentStepData.icon}
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {currentStepData.title}
              </h2>
              <p className="text-white/70 text-base leading-relaxed">
                {currentStepData.description}
              </p>
              
              {/* Mobile instructions */}
              {currentStepData.mobileInstructions && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                  <p className="text-blue-300 text-sm font-medium mb-2">📱 For mobile notifications:</p>
                  <div className="space-y-1 text-xs text-white/60">
                    <div>{currentStepData.mobileInstructions.ios}</div>
                    <div>{currentStepData.mobileInstructions.android}</div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="space-y-3">
            {currentStepData.action && (
              <button
                onClick={handleActionButton}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-6 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                {currentStepData.action === 'notifications' ? 'Enable Smart Notifications' : 'Enable Daily Emails'}
              </button>
            )}

            <div className="flex gap-3">
              {currentStepData.action && (
                <button
                  onClick={handleSkip}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white py-3 px-6 rounded-xl transition-all duration-200 font-medium"
                >
                  Maybe Later
                </button>
              )}
              
              {!currentStepData.action && (
                <button
                  onClick={handleNext}
                  className="w-full bg-white hover:bg-white/90 text-black py-3 px-6 rounded-xl transition-all duration-200 font-medium"
                >
                  {isLastStep ? 'All Set!' : 'Continue'}
                </button>
              )}
            </div>
          </div>

          {/* Skip option for action steps */}
          {currentStepData.action && (
            <div className="text-center mt-4">
              <p className="text-xs text-white/40">
                {currentStepData.action === 'emails' && 'You can unsubscribe anytime from any email'}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}