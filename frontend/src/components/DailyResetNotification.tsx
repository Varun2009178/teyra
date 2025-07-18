"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, RefreshCw, Mail, X } from 'lucide-react';

interface DailyResetNotificationProps {
  isResetDue: boolean;
  isEmailDue: boolean;
  onDismiss: () => void;
  onRefresh: () => void;
}

export const DailyResetNotification: React.FC<DailyResetNotificationProps> = ({
  isResetDue,
  isEmailDue,
  onDismiss,
  onRefresh
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isResetDue || isEmailDue) {
      setIsVisible(true);
      
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 500); // Wait for animation to complete
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isResetDue, isEmailDue, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 500);
  };

  if (!isResetDue && !isEmailDue) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            duration: 0.5, 
            ease: "easeOut",
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ 
              duration: 0.6, 
              repeat: 3,
              ease: "easeInOut" 
            }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-2xl backdrop-blur-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
                >
                  {isResetDue && isEmailDue ? (
                    <RefreshCw className="w-5 h-5 text-white" />
                  ) : isResetDue ? (
                    <RefreshCw className="w-5 h-5 text-white" />
                  ) : (
                    <Mail className="w-5 h-5 text-white" />
                  )}
                </motion.div>
                <div>
                  <h3 className="font-bold text-green-900 text-lg">
                    {isResetDue && isEmailDue ? "Daily Reset & Email Ready!" : 
                     isResetDue ? "Daily Reset Ready!" : 
                     "Email Notification Due!"}
                  </h3>
                  <p className="text-green-700 text-sm">
                    {isResetDue && isEmailDue ? "Your limits are refreshed and email is sent!" :
                     isResetDue ? "Your daily limits have been refreshed!" :
                     "Check your inbox for your daily reminder!"}
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleDismiss}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              {isResetDue && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg border border-green-200/50"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900 text-sm">Daily Limits Refreshed</p>
                    <p className="text-green-700 text-xs">Mood check-ins and AI splits reset</p>
                  </div>
                </motion.div>
              )}

              {isEmailDue && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg border border-green-200/50"
                >
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900 text-sm">Email Sent</p>
                    <p className="text-green-700 text-xs">Check your inbox for daily motivation</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4"
            >
              <motion.button
                onClick={() => {
                  onRefresh();
                  handleDismiss();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                {isResetDue ? "Start Fresh! 🌵" : "Check Email 📧"}
              </motion.button>
            </motion.div>

            {/* Celebration particles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.random() * 300 - 150,
                    y: Math.random() * 300 - 150
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 