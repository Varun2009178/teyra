// Service Worker for Teyra PWA - Mobile Only
const CACHE_NAME = 'teyra-v2';
const urlsToCache = [
  '/',
  '/dashboard',
  '/offline'
];

// Gen Z notification messages - Progressive anger levels (like an Asian dad)
const GENZ_NOTIFICATIONS_TIER1 = [
  // Calm/First notification
  "do your work bro",
  "hey you got tasks waiting",
  "bro can you lock in you have so much stuff to do",
  "yo check your tasks real quick",
  "bro your tasks are calling you"
];

const GENZ_NOTIFICATIONS_TIER2 = [
  // Angrier (after ~2 hours)
  "I will TAKE UR PHONE DO YOUR WORK",
  "bro stop scrolling and do your tasks fr",
  "yo you're procrastinating again 💀 get back to work",
  "bro what the hell are you doing? you got tasks",
  "dude stop wasting time and get your shit done",
  "bro you're slacking hard rn... lock in",
  "DO YOUR WORK",
  "bro get your ass back to work fr"
];

const GENZ_NOTIFICATIONS_TIER3 = [
  // Very angry (after multiple notifications)
  "WHAT THE HELL ARE YOU DOING WITH YOUR LIFE",
  "bro you're on social media again... your tasks are crying",
  "yo your tasks are piling up and you're doing nothing",
  "bro stop being lazy and get back to productivity",
  "yo you're slacking so hard right now 💀",
  "bro your tasks are waiting and you're doing nothing",
  "dude get off your phone and do your tasks",
  "bro you're procrastinating so hard rn",
  "bro what the hell? you got so much to do",
  "dude your tasks aren't gonna complete themselves",
  "bro get back to work you're slacking",
  "im waiting for you big boy"
];

// All notifications combined (fallback)
const GENZ_NOTIFICATIONS = [
  ...GENZ_NOTIFICATIONS_TIER1,
  ...GENZ_NOTIFICATIONS_TIER2,
  ...GENZ_NOTIFICATIONS_TIER3
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

// Get notification based on progression (like an Asian dad getting angrier)
async function getProgressiveNotification() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      // Get notification history
      const getHistory = store.get('notification-history');
      getHistory.onsuccess = () => {
        const history = getHistory.result || { count: 0, firstNotificationTime: null, lastMessage: null };
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000; // 2 hours in ms
        
        let tier;
        let availableMessages;
        
        // Determine tier based on progression
        if (history.count === 0) {
          // First notification - Tier 1 (calm)
          tier = 1;
          availableMessages = GENZ_NOTIFICATIONS_TIER1;
        } else if (history.firstNotificationTime && (now - history.firstNotificationTime) < twoHours) {
          // Less than 2 hours since first - still Tier 1
          tier = 1;
          availableMessages = GENZ_NOTIFICATIONS_TIER1;
        } else if (history.count < 3) {
          // After 2+ hours but less than 3 notifications - Tier 2 (angry)
          tier = 2;
          availableMessages = GENZ_NOTIFICATIONS_TIER2;
        } else {
          // 3+ notifications - Tier 3 (very angry)
          tier = 3;
          availableMessages = GENZ_NOTIFICATIONS_TIER3;
        }
        
        // Filter out last message if it exists
        if (history.lastMessage && availableMessages.length > 1) {
          availableMessages = availableMessages.filter(msg => msg !== history.lastMessage);
        }
        
        // Pick random message from tier
        const randomMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
        
        // Update history
        const writeTransaction = db.transaction([STORE_NAME], 'readwrite');
        const writeStore = writeTransaction.objectStore(STORE_NAME);
        
        const newHistory = {
          count: history.count + 1,
          firstNotificationTime: history.firstNotificationTime || now,
          lastMessage: randomMessage,
          lastNotificationTime: now,
          tier: tier
        };
        
        writeStore.put({ id: 'notification-history', ...newHistory });
        
        console.log(`📱 Notification Tier ${tier}: "${randomMessage}" (count: ${newHistory.count})`);
        resolve(randomMessage);
      };
      
      getHistory.onerror = () => {
        // Fallback to Tier 1 if IndexedDB fails
        resolve(GENZ_NOTIFICATIONS_TIER1[Math.floor(Math.random() * GENZ_NOTIFICATIONS_TIER1.length)]);
      };
    });
  } catch (error) {
    console.error('Error getting progressive notification:', error);
    // Fallback to Tier 1
    return GENZ_NOTIFICATIONS_TIER1[Math.floor(Math.random() * GENZ_NOTIFICATIONS_TIER1.length)];
  }
}

// Get a random notification that's different from the last one
async function getRandomNotification() {
  // Use progressive notification instead
  return await getProgressiveNotification();
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
self.addEventListener('push', async (event) => {
  const data = event.data ? event.data.json() : {};
  const message = data.message || await getRandomNotification();
  
  const options = {
    body: message,
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
    self.registration.showNotification('Teyra', options)
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

// Check if user should be notified (only if >5 tasks)
async function checkAndNotify() {
  try {
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
    
    // Reset notification history if tasks drop below 5 (user completed some!)
    if (incompleteTasks.length <= 5) {
      try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete('notification-history');
        console.log('✅ Notification history reset (tasks completed!)');
      } catch (e) {
        console.log('Could not reset notification history');
      }
      console.log('📱 Only', incompleteTasks.length, 'tasks - no notification (need >5)');
      return;
    }
    
    // Only notify if there are MORE than 5 incomplete tasks
    if (incompleteTasks.length > 5) {
      // Check notification history for timing and limits
      const db = await openDB();
      const today = new Date().toDateString();
      const historyRequest = await new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('notification-history');
        request.onsuccess = () => {
          const history = request.result || { count: 0, firstNotificationTime: null, lastNotificationTime: null };
          const lastNotificationDate = history.lastNotificationTime ? new Date(history.lastNotificationTime).toDateString() : null;
          
          // Reset count if it's a new day
          if (lastNotificationDate !== today) {
            resolve({ count: 0, firstNotificationTime: null, lastNotificationTime: null });
          } else {
            resolve(history);
          }
        };
        request.onerror = () => resolve({ count: 0, firstNotificationTime: null, lastNotificationTime: null });
      });
      
      const history = historyRequest;
      
      // Don't send more than 4 notifications per day
      if (history.count >= 4) {
        console.log('📱 Max notifications reached for today (4)');
        return;
      }
      
      // Check if enough time has passed since last notification (at least 2 hours)
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000;
      if (history.lastNotificationTime && (now - history.lastNotificationTime) < twoHours) {
        console.log('📱 Too soon since last notification (need 2+ hours)');
        return;
      }
      
      // Get progressive notification (will update history internally)
      const randomMessage = await getProgressiveNotification();
      
      await self.registration.showNotification('Teyra', {
        body: randomMessage,
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
      console.log('✅ Progressive notification sent for', incompleteTasks.length, 'tasks');
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
    const message = event.data.message || await getProgressiveNotification();
    
    // Clean notification format - message in body to avoid truncation
    self.registration.showNotification('Teyra', {
      body: message,
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
  
  // Handle check and notify request from client
  if (event.data && event.data.type === 'CHECK_AND_NOTIFY') {
    await checkAndNotify();
  }

  // Handle task fetching request from service worker (client-side handler)
  if (event.data && event.data.type === 'GET_TASKS_FOR_NOTIFICATION') {
    // This will be handled by the client-side code in MobileServiceWorker
    // The service worker sends this message, and the client responds
  }
});
