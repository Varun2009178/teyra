import { useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useNotifications } from './useNotifications';

export function useSmartNotifications() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { permission, sendNotification, sendReminderNotification } = useNotifications();

  const checkForSmartNotifications = useCallback(async () => {
    if (!user?.id || !permission.granted) return;

    // Check if user has notifications enabled in settings
    const pushEnabled = localStorage.getItem(`push_notifications_${user.id}`) === 'true';
    if (!pushEnabled) {
      console.log('🔕 Push notifications disabled by user');
      return;
    }

    try {
      const token = await getToken();

      // Check if user should receive a notification
      const response = await fetch('/api/smart-notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        if (data.shouldNotify) {
          // Trigger smart notification
          const notificationResponse = await fetch('/api/smart-notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pushEnabled: true })
          });

          if (notificationResponse.ok) {
            const notificationData = await notificationResponse.json();
            
            if (notificationData.notification) {
              // Send the notification using our notification system
              sendReminderNotification(notificationData.notification.message);
              console.log('🧠 Smart notification sent:', notificationData.notification);
              
              // Track successful notification
              localStorage.setItem(`last_smart_notification_${user.id}`, Date.now().toString());
            }
          } else {
            console.warn('Failed to send smart notification:', await notificationResponse.text());
          }
        } else {
          console.log('🤫 No smart notification needed at this time');
        }
      } else {
        console.warn('Failed to check notification status:', response.status);
      }
    } catch (error) {
      console.warn('Error checking for smart notifications:', error);
      // Store failed attempt to avoid rapid retries
      localStorage.setItem(`notification_check_error_${user.id}`, Date.now().toString());
    }
  }, [user?.id, permission.granted, getToken, sendReminderNotification]);

  const sendInactivityReminder = useCallback(async () => {
    if (!user?.id || !permission.granted) return;

    // Check if user has notifications enabled
    const pushEnabled = localStorage.getItem(`push_notifications_${user.id}`) === 'true';
    if (!pushEnabled) {
      return;
    }

    try {
      const token = await getToken();
      
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const tasks = await response.json();
        const incompleteTasks = Array.isArray(tasks) ? tasks.filter((t: any) => !t.completed) : [];
        
        if (incompleteTasks.length > 0) {
          // Check when the user last interacted with tasks
          const lastActivity = localStorage.getItem(`last_activity_${user.id}`);
          const now = Date.now();
          
          if (lastActivity) {
            const timeSinceActivity = now - parseInt(lastActivity);
            const hoursSinceActivity = timeSinceActivity / (1000 * 60 * 60);
            
            // Send reminder if inactive for more than 4 hours and has incomplete tasks
            if (hoursSinceActivity >= 4) {
              sendReminderNotification(
                `⏰ You have ${incompleteTasks.length} task${incompleteTasks.length === 1 ? '' : 's'} waiting! Ready to make progress?`
              );
              
              // Update last reminder time
              localStorage.setItem(`last_reminder_${user.id}`, now.toString());
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error sending inactivity reminder:', error);
    }
  }, [user?.id, permission.granted, getToken, sendReminderNotification]);

  const trackActivity = useCallback(() => {
    if (!user?.id) return;
    
    // Update last activity timestamp
    localStorage.setItem(`last_activity_${user.id}`, Date.now().toString());
  }, [user?.id]);

  // Set up smart notification checking
  useEffect(() => {
    if (!user?.id || !permission.granted) return;

    // Initial check after 30 seconds
    const initialTimeout = setTimeout(checkForSmartNotifications, 30000);

    // Then check every 2 hours during active hours (8 AM - 10 PM)
    const intervalId = setInterval(() => {
      const currentHour = new Date().getHours();
      if (currentHour >= 8 && currentHour <= 22) {
        checkForSmartNotifications();
      }
    }, 2 * 60 * 60 * 1000); // 2 hours

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [user?.id, permission.granted, checkForSmartNotifications]);

  // Set up inactivity reminders
  useEffect(() => {
    if (!user?.id || !permission.granted) return;

    // Check for inactivity every hour
    const inactivityInterval = setInterval(() => {
      const currentHour = new Date().getHours();
      // Only send reminders during reasonable hours (9 AM - 8 PM)
      if (currentHour >= 9 && currentHour <= 20) {
        sendInactivityReminder();
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(inactivityInterval);
  }, [user?.id, permission.granted, sendInactivityReminder]);

  // Track user activity for inactivity detection
  useEffect(() => {
    if (!user?.id) return;

    // Track activity on various user interactions
    const events = ['click', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Initial activity tracking
    trackActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, [user?.id, trackActivity]);

  return {
    checkForSmartNotifications,
    sendInactivityReminder,
    trackActivity
  };
}