'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function WelcomePage() {
  const [input, setInput] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showEnterHint, setShowEnterHint] = useState(false);
  const [buildingDashboard, setBuildingDashboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useUser();
  const { completeOnboarding } = useOnboarding();

  useEffect(() => {
    // Animate prompt in after brief delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Show "press enter" hint after user types
    if (input.length > 3) {
      setShowEnterHint(true);
    } else {
      setShowEnterHint(false);
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Start building dashboard animation
    setBuildingDashboard(true);

    // Save first task to database
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: input.trim() }),
      });
    } catch (error) {
      console.error('error saving first task:', error);
    }

    // Complete onboarding and redirect after animation
    setTimeout(() => {
      completeOnboarding();
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden">
      {/* Main content */}
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {!buildingDashboard ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Animated prompt */}
              {showPrompt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="text-center space-y-2"
                >
                  <motion.p
                    className="text-white/60 text-lg font-light tracking-wide"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                    type anything you need to do today
                  </motion.p>
                </motion.div>
              )}

              {/* Input field */}
              <form onSubmit={handleSubmit}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="finish physics homework..."
                    className="w-full bg-transparent border-b border-white/20 text-white text-2xl font-light py-4 px-2 outline-none focus:border-white/60 transition-colors placeholder:text-white/20"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </motion.div>

                {/* Enter hint */}
                <AnimatePresence>
                  {showEnterHint && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 text-center"
                    >
                      <p className="text-white/40 text-sm">
                        press <kbd className="px-2 py-1 bg-white/10 rounded text-white/60">enter</kbd> to continue
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="building"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-6"
            >
              {/* Building animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <motion.div
                  className="text-white text-xl font-light"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {input}
                </motion.div>

                <motion.div
                  className="h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />

                <motion.p
                  className="text-white/40 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  building your workspace...
                </motion.p>
              </motion.div>

              {/* Loading indicator */}
              <motion.div
                className="flex justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-white/60 rounded-full"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle background pattern */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
