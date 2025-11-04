'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, Heart, Sparkles } from 'lucide-react';

interface CelebrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'first-task' | 'mood-set';
  title?: string;
  message?: string;
}

export function CelebrationPopup({ 
  isOpen, 
  onClose, 
  type,
  title,
  message
}: CelebrationPopupProps) {
  const getContent = () => {
    switch (type) {
      case 'first-task':
        return {
          title: title || 'First Task Complete! 🎉',
          message: message || 'Amazing! You\'ve completed your first task. Mike the Cactus is proud of you! This is just the beginning of your productivity journey.',
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          bgColor: 'from-green-100 to-emerald-100',
          borderColor: 'border-green-200'
        };
      case 'mood-set':
        return {
          title: title || 'Mood Set! ✨',
          message: message || 'Perfect! Mike now knows how you\'re feeling and can suggest tasks that match your energy level. Great job being honest about your mood!',
          icon: <Heart className="w-12 h-12 text-pink-500" />,
          bgColor: 'from-pink-100 to-purple-100',
          borderColor: 'border-pink-200'
        };
      default:
        return {
          title: 'Great Job!',
          message: 'You\'re making excellent progress!',
          icon: <Sparkles className="w-12 h-12 text-blue-500" />,
          bgColor: 'from-blue-100 to-indigo-100',
          borderColor: 'border-blue-200'
        };
    }
  };

  if (!isOpen) return null;

  const content = getContent();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: -50 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 500,
            duration: 0.4
          }}
          className={`bg-gradient-to-br ${content.bgColor} rounded-3xl p-8 max-w-md w-full shadow-2xl border ${content.borderColor} relative overflow-hidden`}
        >
          {/* Decorative background elements */}
          <div className="absolute top-4 right-4 opacity-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
          </div>
          
          <div className="absolute bottom-4 left-4 opacity-20">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="w-6 h-6" />
            </motion.div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center space-y-6">
            {/* Icon with animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 20, stiffness: 500 }}
              className="flex justify-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut"
                }}
              >
                {content.icon}
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl font-bold text-gray-900"
            >
              {content.title}
            </motion.h2>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-gray-700 leading-relaxed"
            >
              {content.message}
            </motion.p>

            {/* Confetti-like elements */}
            {type === 'first-task' && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      x: [0, Math.random() * 40 - 20, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            )}

            {/* Action button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-colors duration-200"
              >
                {type === 'first-task' ? 'Keep Going! 🚀' : 'Let\'s Go! ✨'}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}