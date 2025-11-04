'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { requestNotificationPermission, createTeyraNotification, getNotificationCapabilities } from '@/lib/notification-utils';
import IOSInstallGuide from './IOSInstallGuide';

interface NotificationToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function NotificationToggle({ 
  className = '', 
  size = 'md', 
  showLabel = false 
}: NotificationToggleProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<number>(0);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Check notification status on mount and periodically
  useEffect(() => {
    const checkStatus = () => {
      const caps = getNotificationCapabilities();
      setCapabilities(caps);
      // Only set enabled if both supported AND permission is granted
      const actuallyEnabled = caps.supported && caps.permission === 'granted';
      setIsEnabled(actuallyEnabled);
      setLastChecked(Date.now());
      console.log('Notification status check:', { 
        supported: caps.supported, 
        permission: caps.permission, 
        enabled: actuallyEnabled 
      });
    };

    checkStatus();
    
    // Check every 5 seconds when focused
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    }, 5000);

    // Check when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isEnabled) {
        // If notifications are enabled, just show current status
        // (We can't really "disable" them from the web app)
        console.log('Notifications are currently enabled');
        
        // Notifications are enabled - no test notification needed
        console.log('Notifications are working and enabled');
        
      } else {
        // Request permission
        console.log('Requesting notification permission...');
        const result = await requestNotificationPermission();
        console.log('Permission result:', result);
        
        if (result.permission === 'granted') {
          setIsEnabled(true);
          
          // Welcome notification removed - notifications enabled silently
          console.log('Notifications enabled successfully');

          // Show iOS guide if needed
          if (result.showIOSGuide) {
            setShowIOSGuide(true);
          }
        } else {
          console.log('Notification permission denied or not granted:', result.permission);
          setIsEnabled(false);
        }
        
        setCapabilities(result.capabilities);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!capabilities?.supported) return 'text-gray-400';
    if (isEnabled) return 'text-green-500';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (!capabilities?.supported) return 'Not supported';
    if (isEnabled) return 'Enabled';
    return 'Disabled';
  };

  const getBgColor = () => {
    if (!capabilities?.supported) return 'bg-gray-100';
    if (isEnabled) return 'bg-green-50 hover:bg-green-100';
    return 'bg-gray-50 hover:bg-gray-100';
  };

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          disabled={isLoading || !capabilities?.supported}
          className={`
            ${sizeClasses[size]} rounded-full flex items-center justify-center
            ${getBgColor()}
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-sm hover:shadow-md
            focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
            relative overflow-hidden group
          `}
          title={`Notifications ${getStatusText()}`}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                className="w-full h-full flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className={`${iconSizes[size]} border-2 border-purple-500 border-t-transparent rounded-full`}
                />
              </motion.div>
            ) : capabilities?.supported ? (
              <motion.div
                key={isEnabled ? 'enabled' : 'disabled'}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className={getStatusColor()}
              >
                {isEnabled ? (
                  <Bell className={iconSizes[size]} />
                ) : (
                  <BellOff className={iconSizes[size]} />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="unsupported"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-gray-400"
              >
                <AlertCircle className={iconSizes[size]} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status indicator */}
          {capabilities?.supported && (
            <motion.div
              className={`
                absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
                ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}
              `}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            />
          )}

          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 bg-purple-500/20 rounded-full opacity-0 group-active:opacity-100"
            initial={{ scale: 0 }}
            whileTap={{ scale: 1 }}
            transition={{ duration: 0.1 }}
          />
        </motion.button>

        {showLabel && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-sm font-medium text-gray-900">
              Notifications
            </span>
            <span className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </motion.div>
        )}

        {/* Device info (mobile) */}
        {capabilities?.mobile && !isEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-2"
          >
            <Smartphone className="w-4 h-4 text-blue-500" title="Mobile device detected" />
          </motion.div>
        )}
      </div>

      {/* iOS Installation Guide */}
      <IOSInstallGuide
        isOpen={showIOSGuide}
        onClose={() => setShowIOSGuide(false)}
      />

      {/* Debug info removed - was showing in top corner */}
    </>
  );
}