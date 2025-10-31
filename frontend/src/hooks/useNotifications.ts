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

  // Detect platform - MOBILE SAFE
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
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
    } catch (e) {
      setPlatform('unknown');
    }
  }, []);

  // Check if notifications are supported - MOBILE SAFE
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);
    } catch (e) {
      setIsSupported(false);
    }
  }, []);

  // Request notification permission - MOBILE SAFE
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported || typeof window === 'undefined' || !('Notification' in window)) {
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

  // Register service worker (explicit opt-in only) - MOBILE SAFE
  const registerServiceWorker = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      setSwRegistration(registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Send local notification - MOBILE SAFE
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!permission.granted) {
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    try {
      // Use service worker notification if available, otherwise fallback to regular notification
      if (swRegistration && 'showNotification' in swRegistration) {
        swRegistration.showNotification(title, {
          icon: '/teyra-logo-64kb.png',
          badge: '/teyra-logo-64kb.png',
          vibrate: [200, 100, 200],
          ...options
        });
      } else {
        const notification = new Notification(title, {
          icon: '/teyra-logo-64kb.png',
          badge: '/teyra-logo-64kb.png',
          vibrate: [200, 100, 200],
          ...options
        });

        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } catch (error) {
      // Silent fail on mobile
    }
  }, [permission.granted, swRegistration]);

  // Send task completion notification
  const sendTaskCompletionNotification = useCallback((taskTitle: string) => {
    const title = 'Task Completed! 🎉';
    const body = `Great job completing: "${taskTitle}"`;

    if (swRegistration && 'showNotification' in swRegistration) {
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
    const body = `You've started your productivity journey with: "${taskTitle}"`;

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
    const body = `Your mood is now set to: ${mood}. We'll suggest tasks based on how you're feeling!`;

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

  // Initialize notifications - MOBILE SAFE - THIS WAS THE BUG!
  useEffect(() => {
    if (!isSupported || typeof window === 'undefined') return;

    try {
      // CRITICAL FIX: Check if Notification exists before accessing
      if ('Notification' in window) {
        const currentPermission = Notification.permission;
        const granted = currentPermission === 'granted';
        setPermission({ granted, permission: currentPermission });
      }
    } catch (e) {
      // Silent fail on mobile browsers that don't support notifications
    }
  }, [isSupported]);

  // Handle notification clicks - MOBILE SAFE
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleNotificationClick = (event: Event) => {
      try {
        const notification = event.target as Notification;

        if (notification.tag === 'task-completion') {
          window.focus();
          window.location.href = '/dashboard';
        } else if (notification.tag === 'achievement') {
          toast.success('🎉 Achievement celebrated!');
        }
      } catch (e) {
        // Silent fail
      }
    };

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
