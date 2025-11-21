'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Check, Sparkles } from 'lucide-react';

const proFeatures = [
  {
    title: '3 AI mood tasks per day',
    description: 'web app - what you like to do today (vs 1 free)',
    highlight: false,
    icon: '💭',
    standalone: true
  },
  {
    title: 'unlimited AI text → task parsing',
    description: 'chrome extension (vs 5 per day free)',
    highlight: true,
    icon: '✨',
    standalone: false
  },
  {
    title: 'pomodoro timer',
    description: 'chrome extension - built-in focus sessions',
    icon: '⏱️',
    standalone: false
  },
  {
    title: 'focus mode customization',
    description: 'chrome extension - block any websites you choose',
    icon: '🎯',
    standalone: false
  },
  {
    title: 'priority support',
    description: 'faster response times',
    icon: '⚡',
    standalone: true
  }
];

export default function ProBadgeDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 320; // w-80 = 320px
      const dropdownHeight = 500; // approximate height
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate position
      let left = rect.left;
      let top = rect.bottom + 8;
      
      // Check if dropdown would overflow right edge
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }
      
      // Check if dropdown would overflow left edge
      if (left < 16) {
        left = 16;
      }
      
      // Check if dropdown would overflow bottom edge - if so, show above
      if (top + dropdownHeight > viewportHeight - 16) {
        top = rect.top - dropdownHeight - 8;
        // If still doesn't fit above, position at top of viewport
        if (top < 16) {
          top = 16;
        }
      }
      
      setPosition({
        top,
        left
      });
    }
  }, [isOpen]);

  const dropdownContent = (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed w-80 z-[9999] pointer-events-auto"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxWidth: 'calc(100vw - 32px)',
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          >
            <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">teyra pro</h3>
                  <p className="text-white/50 text-xs">Your active benefits</p>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2">
                {proFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-xl border transition-all ${
                      feature.highlight
                        ? 'liquid-glass border-white/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10'
                        : 'liquid-glass-subtle border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-base">{feature.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-semibold text-sm">{feature.title}</h4>
                          {feature.highlight && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-xs leading-relaxed">{feature.description}</p>
                      </div>
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-white/40 text-xs text-center">
                  Thank you for supporting teyra! 💜
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
  );

  return (
    <>
      <div
        ref={buttonRef}
        className="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Pro Badge Button - Cursor style */}
        <div className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white font-semibold text-sm transition-all hover:bg-white/15 hover:border-white/30 cursor-default">
          PRO
        </div>
    </div>
      {mounted && createPortal(dropdownContent, document.body)}
    </>
  );
}
