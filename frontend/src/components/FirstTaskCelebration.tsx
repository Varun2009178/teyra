"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Mail, X } from 'lucide-react';
import { Button } from './ui/button';

interface FirstTaskCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirstTaskCelebration: React.FC<FirstTaskCelebrationProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h2 className="text-xl font-bold text-gray-800">First Task Added! 🎉</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                Great start! You'll receive email reminders every 24 hours to help you stay on track with your tasks.
              </p>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Mail className="w-5 h-5 text-blue-500" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Email Reminders</p>
                  <p className="text-blue-600">Check your inbox for daily progress updates</p>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                You can always check your progress and manage tasks right here in your dashboard.
              </p>
            </div>

            <div className="mt-6">
              <Button
                onClick={onClose}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Got it!
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 