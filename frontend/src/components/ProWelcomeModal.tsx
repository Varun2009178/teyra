'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const proFeatures = [
  {
    icon: '✨',
    title: 'Unlimited AI Text → Task',
    description: 'Convert unlimited text to tasks with AI - no daily limits!',
    badge: 'LIMITED TIME'
  },
  {
    icon: '🎯',
    title: 'Custom Focus Mode',
    description: 'Block any websites you choose during focus sessions',
    badge: null
  },
  {
    icon: '⏱️',
    title: 'Pomodoro Timer',
    description: 'Built-in focus sessions to boost productivity',
    badge: null
  },
  {
    icon: '⚡',
    title: 'Priority Support',
    description: 'Get faster response times for all your questions',
    badge: null
  }
];

export default function ProWelcomeModal({ isOpen, onClose }: ProWelcomeModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti celebration
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Fire confetti from left side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#ec4899', '#8b5cf6', '#f472b6']
        });

        // Fire confetti from right side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#ec4899', '#8b5cf6', '#f472b6']
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-2xl bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-[120px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full filter blur-[120px]"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5]
            }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors rounded-full hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative z-10">
          {/* Header with celebration */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-3"
            >
              Welcome to Pro! 🎉
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/70 text-lg"
            >
              You now have access to all premium features
            </motion.p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {proFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 border border-white/10">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                      {feature.badge && (
                        <motion.span
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                          className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 text-[9px] font-bold tracking-wide whitespace-nowrap"
                        >
                          {feature.badge}
                        </motion.span>
                      )}
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-center"
          >
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              Start Using Pro Features 🚀
            </button>
            <p className="text-white/40 text-xs mt-4">
              You can access your Pro features anytime from the PRO badge in the navbar
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
