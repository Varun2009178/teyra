// Notification utilities for cross-platform compatibility - MOBILE SAFE
export interface TeyraNotificationOptions {
  title: string;
  body: string;
  type: 'welcome' | 'celebration' | 'reminder' | 'milestone' | 'mood-check' | 'test';
  completedCount?: number;
  mood?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

// Safari and iOS specific notification settings - MOBILE SAFE
export const createTeyraNotification = async (options: TeyraNotificationOptions): Promise<Notification | null> => {
  // CRITICAL: Check if Notification exists
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  try {
    if (Notification.permission !== 'granted') {
      return null;
    }

    const { title, body, type, completedCount, mood, timeOfDay } = options;

    // Enhanced notification options for better cross-platform support
    const notificationOptions: NotificationOptions = {
      body,
      icon: '/teyra-logo-64kb.png',
      badge: '/teyra-logo-64kb.png',
      tag: `teyra-${type}`,
      requireInteraction: true,
      silent: false,
      renotify: type === 'celebration' || type === 'milestone',
      data: {
        url: '/dashboard',
        type,
        completedCount,
        mood,
        timeOfDay,
        timestamp: Date.now()
      }
    };

    // Add image for supported browsers
    if ('image' in Notification.prototype) {
      notificationOptions.image = '/teyra-logo-64kb.png';
    }

    // Add vibration for mobile devices
    if ('vibrate' in navigator) {
      notificationOptions.vibrate = type === 'celebration'
        ? [200, 100, 200, 100, 200]
        : [300, 100, 300];
    }

    const notification = new Notification(title, notificationOptions);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    notification.onerror = (error) => {
      console.error(`❌ ${type} notification error:`, error);
    };

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

// Get occasion-specific messages
export const getOccasionMessage = (type: string, context?: any): { title: string; body: string } => {
  const currentHour = new Date().getHours();

  switch (type) {
    case 'welcome':
      const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
      const welcomeMessages = {
        morning: 'Good morning! Ready to make today productive? Mike the Cactus is excited to help you build amazing habits! 🌅🌵',
        afternoon: 'Good afternoon! Perfect time to tackle your goals. Mike believes in your potential to grow! ☀️🌵',
        evening: 'Good evening! Even late bloomers can flourish. Mike the Cactus is here to support your growth! 🌙🌵'
      };
      return {
        title: 'Teyra',
        body: welcomeMessages[timeOfDay]
      };

    case 'celebration':
      const count = context?.completedCount || 0;
      const celebrationMessages = {
        3: 'First milestone reached! You\'ve completed 3 tasks today. Mike the Cactus is sprouting with pride! 🌱',
        6: 'Halfway there! 6 tasks completed. Your productivity is blooming beautifully! 🌸',
        9: 'Outstanding progress! 9 tasks done. Mike says you\'re growing into a productivity powerhouse! 🌳',
        12: 'Incredible dedication! 12+ tasks completed. You\'ve exceeded all expectations today! 🏆✨'
      };

      const message = celebrationMessages[count as keyof typeof celebrationMessages] ||
        `Amazing consistency! ${count} tasks completed. Mike the Cactus believes in your growth! 🌵`;

      return {
        title: 'Teyra',
        body: message
      };

    case 'mood-check':
      const moodMessages = {
        morning: 'Good morning! How are you feeling today? Mike wants to help you start strong! 🌅💚',
        afternoon: 'Afternoon check-in! Take a moment to reflect on your energy. Mike is here to support you! ☀️💙',
        evening: 'Evening reflection time! How did today go? Mike believes in your continuous growth! 🌙💜'
      };
      const moodTimeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
      return {
        title: 'Teyra',
        body: moodMessages[moodTimeOfDay]
      };

    case 'reminder':
      const reminderMessages = {
        morning: 'Morning productivity boost! Time to tackle your goals. Mike is cheering you on! 🌅⚡',
        afternoon: 'Afternoon focus time! Your tasks are waiting. Mike believes in your ability to shine! ☀️✨',
        evening: 'Evening wind-down! Finish strong and prepare for tomorrow. Mike is proud of your dedication! 🌙🌟'
      };
      const reminderTimeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
      return {
        title: 'Teyra',
        body: reminderMessages[reminderTimeOfDay]
      };

    case 'milestone':
      return {
        title: 'Teyra',
        body: 'Major milestone achieved! Your consistency is paying off in amazing ways. Mike the Cactus is bursting with pride! 🏆🌵✨'
      };

    case 'test':
      return {
        title: 'Teyra',
        body: 'Test notification successful! Mike the Cactus confirms your notifications are working perfectly! 🌵✅'
      };

    default:
      return {
        title: 'Teyra',
        body: 'Mike the Cactus is here to support your productivity journey! 🌵💚'
      };
  }
};

// Check if browser/device supports enhanced notifications - MOBILE SAFE
export const getNotificationCapabilities = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      supported: false,
      permission: 'denied' as NotificationPermission,
      serviceWorker: false,
      vibration: false,
      image: false,
      requireInteraction: false,
      badge: false,
      actions: false,
      safari: false,
      ios: false,
      mobile: false
    };
  }

  try {
    const capabilities: any = {
      supported: true,
      permission: Notification.permission,
      serviceWorker: 'serviceWorker' in navigator,
      vibration: 'vibrate' in navigator,
      image: 'image' in Notification.prototype,
      requireInteraction: 'requireInteraction' in Notification.prototype,
      badge: 'badge' in Notification.prototype,
      actions: 'actions' in Notification.prototype
    };

    // Detect Safari/iOS for special handling
    const userAgent = navigator.userAgent.toLowerCase();
    capabilities.safari = userAgent.includes('safari') && !userAgent.includes('chrome');
    capabilities.ios = /iphone|ipad|ipod/.test(userAgent);
    capabilities.mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);

    return capabilities;
  } catch (e) {
    return {
      supported: false,
      permission: 'denied' as NotificationPermission,
      serviceWorker: false,
      vibration: false,
      image: false,
      requireInteraction: false,
      badge: false,
      actions: false,
      safari: false,
      ios: false,
      mobile: false
    };
  }
};

// Safari-specific notification helper - MOBILE SAFE
export const createSafariNotification = async (options: TeyraNotificationOptions): Promise<boolean> => {
  const capabilities = getNotificationCapabilities();

  if (!capabilities.supported || typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    if (Notification.permission !== 'granted') {
      return false;
    }

    const { title, body } = getOccasionMessage(options.type, options);

    const notification = new Notification(title, {
      body,
      icon: '/teyra-logo-64kb.png',
      tag: `teyra-${options.type}`,
      requireInteraction: true,
      silent: false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (error) {
    console.error('Safari notification failed:', error);
    return false;
  }
};

// Request notification permission with iOS install guide support - MOBILE SAFE
export const requestNotificationPermission = async (): Promise<{
  permission: NotificationPermission;
  showIOSGuide: boolean;
  capabilities: any
}> => {
  const capabilities = getNotificationCapabilities();

  if (!capabilities.supported || typeof window === 'undefined' || !('Notification' in window)) {
    return {
      permission: 'denied',
      showIOSGuide: false,
      capabilities
    };
  }

  try {
    // Check if already granted
    if (Notification.permission === 'granted') {
      return {
        permission: 'granted',
        showIOSGuide: false,
        capabilities
      };
    }

    // Request permission
    const permission = await Notification.requestPermission();

    // Show iOS guide if on iOS/Safari and permission granted
    const showIOSGuide = permission === 'granted' && (capabilities.ios || capabilities.safari);

    return { permission, showIOSGuide, capabilities };
  } catch (error) {
    console.error('Notification permission request failed:', error);
    return {
      permission: 'denied',
      showIOSGuide: false,
      capabilities
    };
  }
};
