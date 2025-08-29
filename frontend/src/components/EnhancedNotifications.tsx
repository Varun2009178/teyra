'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Settings, Smartphone, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { createTeyraNotification, getNotificationCapabilities } from '@/lib/notification-utils';
import { getFCMToken } from '@/lib/firebase';

interface EnhancedNotificationsProps {
  userId: string;
  className?: string;
}

export default function EnhancedNotifications({ userId, className = '' }: EnhancedNotificationsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    dailyReminders: true,
    taskCompletion: true,
    moodCheckins: true,
    aiInsights: true,
    milestones: true
  });

  // Check notification status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const caps = getNotificationCapabilities();
      setCapabilities(caps);
      
      // Check if notifications are enabled
      const actuallyEnabled = caps.supported && caps.permission === 'granted';
      setIsEnabled(actuallyEnabled);
      
      // Get FCM token if available
      if (actuallyEnabled) {
        try {
          const token = await getFCMToken();
          setFcmToken(token);
        } catch (error) {
          console.log('FCM token not available:', error);
        }
      }
    };

    checkStatus();
  }, []);

  // Request notification permission
  const requestPermission = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setIsEnabled(true);
        
        // Get FCM token
        try {
          const token = await getFCMToken();
          setFcmToken(token);
          
          // Send token to server
          await fetch('/api/notifications/register-fcm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, fcmToken: token })
          });
        } catch (error) {
          console.log('FCM setup failed:', error);
        }
        
        // Show welcome notification
        await createTeyraNotification({
          title: 'Notifications Enabled!',
          body: 'Mike the Cactus will now keep you updated on your productivity journey! 🌵',
          type: 'welcome'
        });
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test notification
  const testNotification = async () => {
    if (!isEnabled) return;
    
    await createTeyraNotification({
      title: 'Test Notification',
      body: 'Your notifications are working perfectly! Mike is excited to help you stay productive! 🌵✨',
      type: 'test'
    });
  };

  // Update notification preferences
  const updatePreferences = async (key: string, value: boolean) => {
    const newPrefs = { ...notificationPreferences, [key]: value };
    setNotificationPreferences(newPrefs);
    
    // Send to server
    try {
      await fetch('/api/notifications/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences: newPrefs })
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  // Get status color and text
  const getStatusInfo = () => {
    if (!capabilities?.supported) {
      return { color: 'text-gray-400', text: 'Not Supported', bg: 'bg-gray-100' };
    }
    if (isEnabled) {
      return { color: 'text-green-500', text: 'Enabled', bg: 'bg-green-50 hover:bg-green-100' };
    }
    return { color: 'text-gray-400', text: 'Disabled', bg: 'bg-gray-50 hover:bg-gray-100' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Notification Toggle */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${statusInfo.bg}`}>
            {isEnabled ? (
              <Bell className="w-5 h-5 text-green-500" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">
              {isEnabled ? 'Get updates from Mike the Cactus' : 'Enable to stay updated'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isEnabled && (
            <button
              onClick={requestPermission}
              disabled={isLoading || !capabilities?.supported}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </button>
          )}
          
          {isEnabled && (
            <button
              onClick={testNotification}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Test
            </button>
          )}
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Notification Preferences</h4>
              <p className="text-sm text-gray-500">Choose what you want to be notified about</p>
            </div>
            
            <div className="p-4 space-y-3">
              {Object.entries(notificationPreferences).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {key === 'dailyReminders' && 'Daily motivation and reminders'}
                      {key === 'taskCompletion' && 'When you complete tasks'}
                      {key === 'moodCheckins' && 'Mood check-in reminders'}
                      {key === 'aiInsights' && 'AI-powered productivity insights'}
                      {key === 'milestones' && 'Achievement milestones'}
                    </p>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updatePreferences(key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Status</p>
            <p className={`font-medium ${statusInfo.color}`}>{statusInfo.text}</p>
          </div>
          
          <div>
            <p className="text-gray-600">Device</p>
            <p className="font-medium text-gray-900">
              {capabilities?.mobile ? 'Mobile' : capabilities?.tablet ? 'Tablet' : 'Desktop'}
            </p>
          </div>
          
          <div>
            <p className="text-gray-600">Browser</p>
            <p className="font-medium text-gray-900">
              {capabilities?.safari ? 'Safari' : capabilities?.ios ? 'iOS Safari' : 'Chrome/Firefox'}
            </p>
          </div>
          
          <div>
            <p className="text-gray-600">FCM Token</p>
            <p className="font-medium text-gray-900">
              {fcmToken ? 'Connected' : 'Not Available'}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Installation Guide */}
      {capabilities?.mobile && !isEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Smartphone className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">Mobile Device Detected</h4>
              <p className="text-sm text-blue-700 mt-1">
                For the best experience, consider adding Teyra to your home screen. 
                This will enable push notifications and provide an app-like experience.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



