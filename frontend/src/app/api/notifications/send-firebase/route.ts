import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const hasFirebaseConfig = Boolean(firebaseProjectId && firebasePrivateKey && firebaseClientEmail);

// Initialize Firebase Admin if not already initialized
if (hasFirebaseConfig && !getApps().length) {
  initializeApp({
    credential: cert({
      projectId: firebaseProjectId,
      privateKey: firebasePrivateKey,
      clientEmail: firebaseClientEmail,
    }),
  });
} else if (!hasFirebaseConfig) {
  console.warn('Firebase admin credentials missing; notifications API will be disabled');
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!hasFirebaseConfig) {
      return NextResponse.json(
        { error: 'Firebase not configured on server' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, notification, fcmToken } = body;

    if (!userId || !notification) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    console.log(`🔥 Sending Firebase notification to user: ${userId.slice(-8)}`);

    // Get user's FCM token from database (you might want to store this)
    // For now, we'll use the token passed in the request
    const targetToken = fcmToken;

    if (!targetToken) {
      console.log(`⚠️ No FCM token for user ${userId.slice(-8)}`);
      return NextResponse.json({ 
        error: 'No FCM token available for user' 
      }, { status: 400 });
    }

    // Prepare the message
    const message = {
      token: targetToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'teyra-notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/teyra-logo-64kb.png',
          badge: '/teyra-logo-64kb.png',
          requireInteraction: true,
        },
        fcmOptions: {
          link: '/dashboard',
        },
      },
    };

    // Send the message
    const response = await getMessaging().send(message);
    
    console.log(`✅ Firebase notification sent successfully: ${response}`);

    return NextResponse.json({
      success: true,
      messageId: response,
      message: 'Firebase notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending Firebase notification:', error);
    
    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid registration token')) {
        return NextResponse.json({ 
          error: 'Invalid FCM token - user may need to refresh' 
        }, { status: 400 });
      }
      
      if (error.message.includes('Unregistered')) {
        return NextResponse.json({ 
          error: 'FCM token is unregistered - user needs to re-enable notifications' 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to send Firebase notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



