'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';
import { createTeyraNotification } from '@/lib/notification-utils';
import { Bell, Clock, TrendingUp, Heart, Target } from 'lucide-react';

interface SmartNotification {
  id: string;
  type: 'productivity' | 'mood' | 'sustainability' | 'consistency' | 'motivation';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  optimalTime?: number; // Hour of day (0-23)
  icon: React.ReactNode;
  color: string;
}

export function SmartNotificationSystem() {
  const { user } = useUser();
  const { trackNotificationInteraction } = useBehaviorTracking();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Check if notifications are supported and enabled
  useEffect(() => {
    if ('Notification' in window) {
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Generate smart notifications based on AI patterns
  const generateSmartNotifications = useCallback(async () => {
    if (!user?.id || !isEnabled) return;

    try {
      // Get user's AI patterns from the database
      const response = await fetch('/api/ai/get-user-patterns');
      if (!response.ok) return;

      const patterns = await response.json();
      
      const newNotifications: SmartNotification[] = [];

      // Productivity timing notifications
      if (patterns.productivity_peaks?.length > 0) {
        const peakHour = patterns.productivity_peaks[0];
        const currentHour = new Date().getHours();
        
        // If it's close to peak productivity time, suggest it
        if (Math.abs(currentHour - peakHour) <= 1) {
          newNotifications.push({
            id: 'productivity-peak',
            type: 'productivity',
            title: '🚀 Peak Productivity Time!',
            message: `You're most productive around ${peakHour}:00. Perfect time to tackle important tasks!`,
            priority: 'high',
            optimalTime: peakHour,
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'from-green-500 to-emerald-500'
          });
        }
      }

      // Mood-based notifications
      if (patterns.mood_patterns?.dominantMood) {
        const mood = patterns.mood_patterns.dominantMood;
        if (mood === 'tired' || mood === 'stressed') {
          newNotifications.push({
            id: 'mood-support',
            type: 'mood',
            title: '💙 Take It Easy',
            message: 'You tend to feel overwhelmed this time of day. Try breaking tasks into smaller pieces.',
            priority: 'medium',
            icon: <Heart className="w-5 h-5" />,
            color: 'from-blue-500 to-indigo-500'
          });
        }
      }

      // Sustainability reminders
      if (patterns.task_preferences?.sustainableRatio < 0.3) {
        newNotifications.push({
          id: 'sustainability-reminder',
          type: 'sustainability',
          title: '🌿 Eco-Friendly Challenge',
          message: 'Try adding a sustainable task today. Small actions make a big difference!',
          priority: 'low',
          icon: <Target className="w-5 h-5" />,
          color: 'from-emerald-500 to-teal-500'
        });
      }

      // Consistency encouragement
      if (patterns.consistency_score < 50) {
        newNotifications.push({
          id: 'consistency-encouragement',
          type: 'consistency',
          title: '📅 Building Habits',
          message: 'Consistency takes time. Even a 5-minute check-in helps build momentum!',
          priority: 'medium',
          icon: <Clock className="w-5 h-5" />,
          color: 'from-orange-500 to-red-500'
        });
      }

      // Motivation notifications (random)
      const motivationMessages = [
        {
          id: 'motivation-1',
          title: '💪 You Got This!',
          message: 'Every task completed is a step toward your goals. Keep pushing forward!',
          color: 'from-purple-500 to-pink-500'
        },
        {
          id: 'motivation-2',
          title: '🌟 Small Wins Matter',
          message: 'Don\'t underestimate the power of small, consistent actions.',
          color: 'from-yellow-500 to-orange-500'
        },
        {
          id: 'motivation-3',
          title: '🎯 Focus on Progress',
          message: 'Progress over perfection. Every step counts!',
          color: 'from-indigo-500 to-purple-500'
        }
      ];

      // Add random motivation notification
      const randomMotivation = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
      newNotifications.push({
        ...randomMotivation,
        type: 'motivation',
        priority: 'low',
        icon: <Bell className="w-5 h-5" />,
        color: randomMotivation.color
      });

      setNotifications(newNotifications);
      setLastCheck(new Date());

    } catch (error) {
      console.error('Error generating smart notifications:', error);
    }
  }, [user?.id, isEnabled]);

  // Check for notifications periodically
  useEffect(() => {
    if (!isEnabled) return;

    // Generate initial notifications
    generateSmartNotifications();

    // Check every 30 minutes
    const interval = setInterval(generateSmartNotifications, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [generateSmartNotifications, isEnabled]);

  // Send notification when it's optimal time
  const sendOptimalNotification = useCallback(async (notification: SmartNotification) => {
    if (!isEnabled) return;

    try {
      // Create and send the notification
      const webNotification = await createTeyraNotification({
        title: notification.title,
        body: notification.message,
        type: notification.type,
        timeOfDay: getTimeOfDay()
      });

      if (webNotification) {
        // Track the notification interaction
        trackNotificationInteraction(notification.type, 'sent');
        
        // Remove from pending notifications
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        console.log(`🔔 Smart notification sent: ${notification.title}`);
      }
    } catch (error) {
      console.error('Error sending smart notification:', error);
    }
  }, [isEnabled, trackNotificationInteraction]);

  // Get time of day for context
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // Check if it's time to send a notification
  useEffect(() => {
    if (!notifications.length) return;

    const currentHour = new Date().getHours();
    
    notifications.forEach(notification => {
      if (notification.optimalTime !== undefined) {
        // If it's the optimal time (within 1 hour), send the notification
        if (Math.abs(currentHour - notification.optimalTime) <= 1) {
          sendOptimalNotification(notification);
        }
      } else {
        // For notifications without optimal time, send after a delay
        setTimeout(() => {
          sendOptimalNotification(notification);
        }, Math.random() * 30000 + 10000); // Random delay between 10-40 seconds
      }
    });
  }, [notifications, sendOptimalNotification]);

  if (!isEnabled) {
    return (
      <div className="text-center p-4">
        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500">
          Enable notifications to get smart, AI-powered reminders
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">🧠 Smart Notifications</h3>
        <div className="text-xs text-gray-500">
          Last check: {lastCheck ? lastCheck.toLocaleTimeString() : 'Never'}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No smart notifications right now</p>
          <p className="text-sm">AI is learning your patterns...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-gradient-to-r ${notification.color} text-white rounded-lg p-4 shadow-lg`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {notification.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-xs text-white/90">
                    {notification.message}
                  </p>
                  {notification.optimalTime !== undefined && (
                    <div className="text-xs text-white/70 mt-2">
                      Optimal time: {notification.optimalTime}:00
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    notification.priority === 'high' ? 'bg-red-500/20 text-red-100' :
                    notification.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-100' :
                    'bg-green-500/20 text-green-100'
                  }`}>
                    {notification.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        AI analyzes your patterns to send notifications at optimal times
      </div>
    </div>
  );
}



