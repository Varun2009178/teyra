// Service Worker for Teyra PWA
const CACHE_NAME = 'teyra-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/offline'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
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
  const options = {
    body: event.data ? event.data.text() : 'Great job completing your task! 🎉',
    icon: '/teyra-logo-64kb.png',
    badge: '/teyra-logo-64kb.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Dashboard',
        icon: '/teyra-logo-64kb.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/teyra-logo-64kb.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Teyra Task Completed! 🚀', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore' || event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'celebrate') {
    // Handle achievement celebration
    event.waitUntil(
      clients.openWindow('/dashboard?celebration=true')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default action - open dashboard
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Background sync for offline task completion
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any background sync tasks
  console.log('Background sync triggered');
}

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});
