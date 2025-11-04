import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Firebase Cloud Messaging token
let fcmToken: string | null = null;

// Initialize Firebase Cloud Messaging
export const initializeFirebaseMessaging = async () => {
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get FCM token
      fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      
      console.log('🔥 Firebase messaging initialized successfully');
      console.log('📱 FCM Token:', fcmToken?.slice(0, 20) + '...');
      
      return fcmToken;
    } else {
      console.log('❌ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase messaging:', error);
    return null;
  }
};

// Get current FCM token
export const getFCMToken = () => fcmToken;

// Send notification to specific user via Firebase
export const sendFirebaseNotification = async (
  userId: string, 
  notification: {
    title: string;
    body: string;
    data?: any;
  }
) => {
  try {
    // This would typically call your backend API to send via Firebase Admin SDK
    const response = await fetch('/api/notifications/send-firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        notification,
        fcmToken: fcmToken
      })
    });

    if (response.ok) {
      console.log(`🔥 Firebase notification sent to user ${userId}`);
      return true;
    } else {
      console.error('❌ Failed to send Firebase notification');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending Firebase notification:', error);
    return false;
  }
};

// Listen for incoming messages (when app is in foreground)
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('📱 Firebase message received:', payload);
      resolve(payload);
    });
  });
};

// Send daily reset notification via Firebase
export const sendDailyResetNotification = async (userId: string, resetData: any) => {
  const notification = {
    title: '🌅 Daily Reset Complete!',
    body: `Your 24-hour cycle has finished. You completed ${resetData.completedTasks || 0} tasks!`,
    data: {
      type: 'daily_reset',
      resetData: JSON.stringify(resetData),
      timestamp: new Date().toISOString()
    }
  };

  return await sendFirebaseNotification(userId, notification);
};

// Send motivational notification via Firebase
export const sendMotivationalNotification = async (userId: string, hoursInactive: number) => {
  const messages = [
    {
      title: '💪 Time to Get Back on Track!',
      body: `It's been ${hoursInactive} hours since your last activity. Ready to tackle some tasks?`
    },
    {
      title: '🌟 Your Goals Are Waiting!',
      body: 'A little progress each day adds up to big results. Let\'s get started!'
    },
    {
      title: '🎯 Small Steps, Big Changes',
      body: 'Even 5 minutes of focused work can make a difference. What can you accomplish today?'
    }
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  const notification = {
    ...randomMessage,
    data: {
      type: 'motivational',
      hoursInactive,
      timestamp: new Date().toISOString()
    }
  };

  return await sendFirebaseNotification(userId, notification);
};

// Send task completion celebration via Firebase
export const sendTaskCompletionNotification = async (userId: string, taskTitle: string, completedCount: number) => {
  const notification = {
    title: '🎉 Task Completed!',
    body: `Great job completing "${taskTitle}"! You've finished ${completedCount} tasks today.`,
    data: {
      type: 'task_completion',
      taskTitle,
      completedCount,
      timestamp: new Date().toISOString()
    }
  };

  return await sendFirebaseNotification(userId, notification);
};

// Send mood check-in reminder via Firebase
export const sendMoodCheckInNotification = async (userId: string) => {
  const notification = {
    title: '💙 How Are You Feeling?',
    body: 'Take a moment to check in with your mood. It helps us suggest better tasks for you!',
    data: {
      type: 'mood_checkin',
      timestamp: new Date().toISOString()
    }
  };

  return await sendFirebaseNotification(userId, notification);
};

// Send AI learning insights via Firebase
export const sendAILearningNotification = async (userId: string, insight: string) => {
  const notification = {
    title: '🧠 AI Insight for You!',
    body: insight,
    data: {
      type: 'ai_insight',
      insight,
      timestamp: new Date().toISOString()
    }
  };

  return await sendFirebaseNotification(userId, notification);
};

export default {
  initializeFirebaseMessaging,
  getFCMToken,
  sendFirebaseNotification,
  onMessageListener,
  sendDailyResetNotification,
  sendMotivationalNotification,
  sendTaskCompletionNotification,
  sendMoodCheckInNotification,
  sendAILearningNotification
};



