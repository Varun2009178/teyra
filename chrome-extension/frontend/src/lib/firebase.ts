// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Your web app's Firebase configuration
// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

// Check if messaging is supported (client-side only)
const initializeMessaging = async () => {
  if (typeof window !== 'undefined') {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
    }
  }
  return messaging;
};

// Get FCM registration token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      await initializeMessaging();
    }
    
    if (!messaging) {
      console.warn('Firebase messaging not supported in this environment');
      return null;
    }

    // Get registration token
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    if (currentToken) {
      console.log('FCM registration token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      initializeMessaging().then(() => {
        if (messaging) {
          onMessage(messaging, (payload) => {
            console.log('Message received in foreground: ', payload);
            resolve(payload);
          });
        }
      });
    } else {
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        resolve(payload);
      });
    }
  });

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM token after permission is granted
      const token = await getFCMToken();
      if (token) {
        // Send token to your server
        await saveFCMToken(token);
        return true;
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Save FCM token to your backend
const saveFCMToken = async (token: string): Promise<void> => {
  try {
    const response = await fetch('/api/fcm/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      console.log('FCM token saved successfully');
    } else {
      console.error('Failed to save FCM token');
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

export { app, messaging };