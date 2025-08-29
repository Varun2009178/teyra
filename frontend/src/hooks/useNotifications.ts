import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface NotificationState {
  granted: boolean;
  permission: NotificationPermission;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationState>({
    granted: false,
    permission: 'default'
  });
  const [isSupported, setIsSupported] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | 'unknown'>('unknown');

  // Detect platform
  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (/android/.test(userAgent)) {
        setPlatform('android');
      } else if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios');
      } else if (/windows|mac|linux/.test(userAgent)) {
        setPlatform('desktop');
      } else {
        setPlatform('unknown');
      }
    };

    detectPlatform();
  }, []);

  // Check if notifications are supported
  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notifications not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      
      setPermission({
        granted,
        permission: result
      });

      if (granted) {
        toast.success('Notifications enabled! 🎉');
        await registerServiceWorker();
      } else {
        toast.error('Notification permission denied');
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  }, [isSupported]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      setSwRegistration(registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      toast.error('Failed to register service worker');
      return null;
    }
  }, []);

  // Send local notification
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!permission.granted) {
      toast.error('Please enable notifications first');
      return;
    }

    try {
      // Use service worker notification if available, otherwise fallback to regular notification
      if (swRegistration && 'showNotification' in swRegistration) {
        // Service worker notification (supports actions)
        swRegistration.showNotification(title, {
          icon: '/teyra-logo-64kb.png',
          badge: '/teyra-logo-64kb.png',
          vibrate: [200, 100, 200],
          ...options
        });
      } else {
        // Regular browser notification (no actions support)
        const notification = new Notification(title, {
          icon: '/teyra-logo-64kb.png',
          badge: '/teyra-logo-64kb.png',
          vibrate: [200, 100, 200],
          // Remove actions for regular notifications
          ...options
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  }, [permission.granted, swRegistration]);

  // Send task completion notification
  const sendTaskCompletionNotification = useCallback((taskTitle: string) => {
    const title = 'Task Completed! 🎉';
    const body = `Great job completing: "${taskTitle}"`;
    
    console.log('Sending task completion notification:', { title, body, swRegistration });
    
    if (swRegistration && 'showNotification' in swRegistration) {
      // Service worker notification with actions
      console.log('Using service worker notification');
      swRegistration.showNotification(title, {
        body,
        icon: '/teyra-logo-64kb.png',
        badge: '/teyra-logo-64kb.png',
        vibrate: [200, 100, 200],
        tag: 'task-completion',
        requireInteraction: false,
        actions: [
          {
            action: 'view',
            title: 'View Dashboard'
          }
        ]
      });
    } else {
      // Fallback to regular notification without actions
      console.log('Using fallback notification (no actions)');
      sendNotification(title, {
        body,
        tag: 'task-completion',
        requireInteraction: false
      });
    }
  }, [sendNotification, swRegistration]);

  // Send achievement notification
  const sendAchievementNotification = useCallback((achievement: string) => {
    const title = 'Achievement Unlocked! 🏆';
    const body = achievement;
    
    if (swRegistration && 'showNotification' in swRegistration) {
      // Service worker notification with actions
      swRegistration.showNotification(title, {
        body,
        icon: '/teyra-logo-64kb.png',
        badge: '/teyra-logo-64kb.png',
        vibrate: [200, 100, 200],
        tag: 'achievement',
        requireInteraction: true,
        actions: [
          {
            action: 'celebrate',
            title: 'Celebrate! 🎊'
          }
        ]
      });
    } else {
      // Fallback to regular notification without actions
      sendNotification(title, {
        body,
        tag: 'achievement',
        requireInteraction: true
      });
    }
  }, [sendNotification, swRegistration]);

  // Send first task notification
  const sendFirstTaskNotification = useCallback((taskTitle: string) => {
    const title = 'First Task Added! 🚀';
    const body = `You\'ve started your productivity journey with: "${taskTitle}"`;
    
    if (swRegistration && 'showNotification' in swRegistration) {
      swRegistration.showNotification(title, {
        body,
        icon: '/teyra-logo-64kb.png',
        badge: '/teyra-logo-64kb.png',
        vibrate: [200, 100, 200],
        tag: 'first-task',
        requireInteraction: false,
        actions: [
          {
            action: 'view',
            title: 'View Dashboard'
          }
        ]
      });
    } else {
      sendNotification(title, {
        body,
        tag: 'first-task',
        requireInteraction: false
      });
    }
  }, [sendNotification, swRegistration]);

  // Send mood selection notification
  const sendMoodSelectionNotification = useCallback((mood: string) => {
    const title = 'Mood Set! 💫';
    const body = `Your mood is now set to: ${mood}. We\'ll suggest tasks based on how you\'re feeling!`;
    
    if (swRegistration && 'showNotification' in swRegistration) {
      swRegistration.showNotification(title, {
        body,
        icon: '/teyra-logo-64kb.png',
        badge: '/teyra-logo-64kb.png',
        vibrate: [200, 100, 200],
        tag: 'mood-selection',
        requireInteraction: false,
        actions: [
          {
            action: 'view',
            title: 'View Dashboard'
          }
        ]
      });
    } else {
      sendNotification(title, {
        body,
        tag: 'mood-selection',
        requireInteraction: false
      });
    }
  }, [sendNotification, swRegistration]);

  // Send reminder notification
  const sendReminderNotification = useCallback((message: string) => {
    const title = 'Reminder ⏰';
    const body = message;
    
    sendNotification(title, {
      body,
      tag: 'reminder',
      requireInteraction: false
    });
  }, [sendNotification]);

  // Initialize notifications
  useEffect(() => {
    if (isSupported) {
      // Check current permission
      const currentPermission = Notification.permission;
      const granted = currentPermission === 'granted';
      
      setPermission({
        granted,
        permission: currentPermission
      });

      // If already granted, register service worker
      if (granted) {
        registerServiceWorker();
      }
    }
  }, [isSupported, registerServiceWorker]);

  // Handle notification clicks
  useEffect(() => {
    const handleNotificationClick = (event: Event) => {
      const notification = event.target as Notification;
      
      if (notification.tag === 'task-completion') {
        // Navigate to dashboard
        window.focus();
        window.location.href = '/dashboard';
      } else if (notification.tag === 'achievement') {
        // Handle achievement celebration
        toast.success('🎉 Achievement celebrated!');
      }
    };

    // Listen for notification clicks
    document.addEventListener('notificationclick', handleNotificationClick);

    return () => {
      document.removeEventListener('notificationclick', handleNotificationClick);
    };
  }, []);

  return {
    isSupported,
    permission,
    platform,
    requestPermission,
    sendNotification,
    sendTaskCompletionNotification,
    sendAchievementNotification,
    sendFirstTaskNotification,
    sendMoodSelectionNotification,
    sendReminderNotification,
    swRegistration
  };
}
