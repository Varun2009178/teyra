'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, X } from 'lucide-react';

export function DesktopNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 1024 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Show notification every 30 seconds on mobile
    if (isMobile) {
      const interval = setInterval(() => {
        setShowNotification(true);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }, 30000); // Every 30 seconds

      // Show initial notification after 10 seconds
      const initialTimeout = setTimeout(() => {
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(initialTimeout);
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[10000] pointer-events-auto"
          style={{ maxWidth: 'calc(100vw - 32px)' }}
        >
          <div className="liquid-glass glass-gradient-blue rounded-xl p-4 shadow-2xl border border-white/20 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm leading-relaxed">
                  teyra works better on desktop 💻
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors rounded hover:bg-white/10"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

