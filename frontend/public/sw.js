// Service Worker for Teyra PWA - Mobile Only
const CACHE_NAME = 'teyra-v2';
const urlsToCache = [
  '/',
  '/dashboard',
  '/offline'
];

// Gen Z notification messages (all lowercase, with appropriate curse words)
const GENZ_NOTIFICATIONS = [
  "bro can you lock in you have so much stuff to do",
  "bro can you lock the hell in holy shit",
  "yo you're procrastinating again 💀 get back to work",
  "bro stop scrolling and do your tasks fr",
  "you have tasks waiting... are we being fr right now?",
  "lock in bro your tasks aren't gonna do themselves",
  "stop the scroll and get back to productivity mode",
  "bro you're on social media again... your tasks are crying",
  "can you actually focus rn? you got stuff to do",
  "yo get off that app and check your tasks 💯",
  "bro what the hell are you doing? you got tasks",
  "dude stop wasting time and get your shit done",
  "bro you're slacking hard rn... lock in",
  "yo your tasks are piling up and you're doing nothing",
  "bro get your ass back to work fr",
  "dude what are you even doing? check your tasks",
  "bro stop being lazy and get back to productivity",
  "yo you're slacking so hard right now 💀",
  "bro your tasks are waiting and you're doing nothing",
  "dude get off your phone and do your tasks",
  "bro you're procrastinating so hard rn",
  "yo stop wasting time and lock in",
  "bro what the hell? you got so much to do",
  "dude your tasks aren't gonna complete themselves",
  "bro get back to work you're slacking"
];

// Store last notification date in IndexedDB
const DB_NAME = 'teyra-notifications';
const DB_VERSION = 1;
const STORE_NAME = 'notification-dates';

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function wasNotificationSentToday() {
  try {
    const db = await openDB();
    const today = new Date().toDateString();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('last-notification');
      request.onsuccess = () => {
        const result = request.result;
        resolve(result && result.date === today);
      };
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    console.error('Error checking notification date:', error);
    return false;
  }
}

async function setLastNotificationDate() {
  try {
    const db = await openDB();
    const today = new Date().toDateString();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id: 'last-notification', date: today });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error setting notification date:', error);
  }
}

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const message = data.message || GENZ_NOTIFICATIONS[Math.floor(Math.random() * GENZ_NOTIFICATIONS.length)];
  
  const options = {
    body: '',
    icon: '/teyra-logo-64kb.png',
    badge: '/teyra-logo-64kb.png',
    vibrate: [200, 100, 200],
    tag: 'teyra-lock-in',
    requireInteraction: false,
    data: {
      url: '/dashboard',
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open Teyra',
        icon: '/teyra-logo-64kb.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(message, options)
  );
});

// Notification click event - opens dashboard
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  if (event.action === 'open' || !event.action) {
    // Default action - open dashboard
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    event.notification.close();
  }
});

// Periodic Background Sync - check for tasks once per day
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-tasks-daily') {
    event.waitUntil(checkAndNotify());
  }
});

// Background sync for offline task completion
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
  
  // Handle daily task check sync
  if (event.tag === 'daily-task-check') {
    event.waitUntil(checkAndNotify());
  }
});

// Check if user should be notified (only if >5 tasks and not notified today)
async function checkAndNotify() {
  try {
    // Check if we already sent a notification today
    const alreadySent = await wasNotificationSentToday();
    if (alreadySent) {
      console.log('📱 Notification already sent today, skipping...');
      return;
    }

    // Get tasks from API
    // Try to fetch directly from the service worker
    let tasks = [];
    try {
      const response = await fetch('/api/tasks', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        tasks = await response.json();
      } else {
        console.log('Could not fetch tasks from service worker, trying via client...');
        // Fallback: ask client to fetch tasks
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
          const response = await new Promise((resolve) => {
            const messageHandler = (event) => {
              if (event.data && event.data.type === 'TASKS_RESPONSE') {
                self.removeEventListener('message', messageHandler);
                resolve(event.data);
              }
            };
            self.addEventListener('message', messageHandler);
            
            clients[0].postMessage({
              type: 'GET_TASKS_FOR_NOTIFICATION'
            });

            setTimeout(() => {
              self.removeEventListener('message', messageHandler);
              resolve(null);
            }, 5000);
          });
          
          if (response && response.tasks) {
            tasks = response.tasks;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    if (!tasks || tasks.length === 0) {
      console.log('No tasks found');
      return;
    }

    const incompleteTasks = tasks.filter(t => !t.completed && !t.title.includes('[COMPLETED]'));
    
    // Only notify if there are MORE than 5 incomplete tasks
    if (incompleteTasks.length > 5) {
      const randomMessage = GENZ_NOTIFICATIONS[Math.floor(Math.random() * GENZ_NOTIFICATIONS.length)];
      
      await self.registration.showNotification(randomMessage, {
        body: '',
        icon: '/teyra-logo-64kb.png',
        badge: '/teyra-logo-64kb.png',
        vibrate: [200, 100, 200],
        tag: 'teyra-lock-in-daily',
        requireInteraction: false,
        data: {
          url: '/dashboard'
        },
        actions: [
          {
            action: 'open',
            title: 'Open Teyra',
            icon: '/teyra-logo-64kb.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      });

      // Mark notification as sent today
      await setLastNotificationDate();
      console.log('✅ Daily notification sent for', incompleteTasks.length, 'tasks');
    } else {
      console.log('📱 Only', incompleteTasks.length, 'tasks - no notification (need >5)');
    }
  } catch (error) {
    console.error('Error in checkAndNotify:', error);
  }
}

async function doBackgroundSync() {
  // Handle any background sync tasks
  console.log('Background sync triggered');
}

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Message handler - allows API/client to trigger notifications and check tasks
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
    const message = event.data.message || GENZ_NOTIFICATIONS[Math.floor(Math.random() * GENZ_NOTIFICATIONS.length)];
    
    // Clean notification format - just message, no redundant title
    self.registration.showNotification(message, {
      body: '',
      icon: '/teyra-logo-64kb.png',
      badge: '/teyra-logo-64kb.png',
      vibrate: [200, 100, 200],
      tag: 'teyra-lock-in',
      requireInteraction: false,
      data: {
        url: '/dashboard'
      },
      actions: [
        {
          action: 'open',
          title: 'Open Teyra',
          icon: '/teyra-logo-64kb.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    });
  }

  // Handle task fetching request from service worker (client-side handler)
  if (event.data && event.data.type === 'GET_TASKS_FOR_NOTIFICATION') {
    // This will be handled by the client-side code in MobileServiceWorker
    // The service worker sends this message, and the client responds
  }
});
