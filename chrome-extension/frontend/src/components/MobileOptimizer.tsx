'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Tablet, Monitor, X } from 'lucide-react';

interface MobileOptimizerProps {
  children: React.ReactNode;
}

export default function MobileOptimizer({ children }: MobileOptimizerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileTip, setShowMobileTip] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isMobileDevice = width < 768;
      const isTabletDevice = width >= 768 && width < 1024;
      
      setIsMobile(isMobileDevice);
      setIsTablet(isTabletDevice);
      
      // Show mobile tip for first-time mobile users
      if (isMobileDevice && !localStorage.getItem('mobile-tip-shown')) {
        setShowMobileTip(true);
        localStorage.setItem('mobile-tip-shown', 'true');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Add mobile-specific CSS classes
  useEffect(() => {
    if (isMobile) {
      document.documentElement.classList.add('mobile-device');
      document.documentElement.classList.remove('tablet-device', 'desktop-device');
    } else if (isTablet) {
      document.documentElement.classList.add('tablet-device');
      document.documentElement.classList.remove('mobile-device', 'desktop-device');
    } else {
      document.documentElement.classList.add('desktop-device');
      document.documentElement.classList.remove('mobile-device', 'tablet-device');
    }
  }, [isMobile, isTablet]);

  // Mobile-specific optimizations
  useEffect(() => {
    if (isMobile) {
      // Optimize touch interactions
      document.body.style.touchAction = 'manipulation';
      
      // Reduce motion for better performance
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('reduce-motion');
      }
      
      // Optimize viewport for mobile
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    }
  }, [isMobile]);

  return (
    <>
      {children}
      
      {/* Mobile Tip Banner */}
      <AnimatePresence>
        {showMobileTip && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 shadow-lg"
          >
            <div className="flex items-center justify-between max-w-md mx-auto">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Mobile Optimized!</p>
                  <p className="text-xs opacity-90">Teyra works great on mobile</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileTip(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device Indicator (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="flex items-center space-x-2 bg-black/80 text-white px-3 py-2 rounded-full text-xs">
            {isMobile ? (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Mobile</span>
              </>
            ) : isTablet ? (
              <>
                <Tablet className="w-4 h-4" />
                <span>Tablet</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                <span>Desktop</span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Mobile-specific CSS utilities
export const mobileStyles = {
  // Touch-friendly button sizes
  button: {
    mobile: 'min-h-[44px] min-w-[44px]', // iOS minimum touch target
    tablet: 'min-h-[40px] min-w-[40px]',
    desktop: 'min-h-[36px] min-w-[36px]'
  },
  
  // Responsive spacing
  spacing: {
    mobile: 'space-y-4',
    tablet: 'space-y-6', 
    desktop: 'space-y-8'
  },
  
  // Mobile-optimized text sizes
  text: {
    mobile: {
      h1: 'text-2xl',
      h2: 'text-xl',
      h3: 'text-lg',
      body: 'text-sm'
    },
    tablet: {
      h1: 'text-3xl',
      h2: 'text-2xl', 
      h3: 'text-xl',
      body: 'text-base'
    },
    desktop: {
      h1: 'text-4xl',
      h2: 'text-3xl',
      h3: 'text-2xl', 
      body: 'text-lg'
    }
  }
};

// Hook for responsive values
export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet, isDesktop };
};



