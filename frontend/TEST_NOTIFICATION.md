# Quick Test Notification Script

## Fastest Way (Copy-Paste This):

Open your browser console (on mobile: Chrome → Menu → More Tools → Developer Tools → Console) and paste this:

```javascript
(async () => {
  console.log('🧪 Testing notification...');
  
  // Check if service worker is ready
  if (!('serviceWorker' in navigator)) {
    console.error('❌ Service worker not supported');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration.active) {
      console.error('❌ Service worker not active');
      return;
    }
  
    // Clear daily limit (for testing)
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('teyra-notifications', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('notification-dates')) {
            db.createObjectStore('notification-dates', { keyPath: 'id' });
          }
        };
      });
      
      const tx = db.transaction(['notification-dates'], 'readwrite');
      tx.objectStore('notification-dates').delete('last-notification');
      console.log('✅ Cleared daily limit');
    } catch (e) {
      console.log('⚠️ Could not clear IndexedDB (might not exist yet)');
    }
    
    // Also clear localStorage
    localStorage.removeItem('teyra_last_notification_date');
    localStorage.removeItem('teyra_last_daily_check');
    
    // Trigger notification directly
    registration.active.postMessage({
      type: 'TRIGGER_NOTIFICATION',
      message: 'bro can you lock in you have so much stuff to do'
    });
    
    console.log('✅ Notification sent! Check your notifications.');
    console.log('📱 If you don\'t see it, make sure:');
    console.log('   1. Notification permission is granted');
    console.log('   2. You\'re on mobile (or testing in mobile mode)');
    console.log('   3. Service worker is active');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

## Alternative: Test with Task Check

This version checks your tasks first and only sends if >5:

```javascript
(async () => {
  // Check tasks
  const tasksRes = await fetch('/api/tasks');
  const tasks = await tasksRes.json();
  const incomplete = tasks.filter(t => !t.completed && !t.title.includes('[COMPLETED]'));
  
  console.log(`📋 You have ${incomplete.length} incomplete tasks`);
  
  if (incomplete.length <= 5) {
    console.log(`❌ Need >5 tasks (you have ${incomplete.length})`);
    return;
  }
  
  // Clear daily limit
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('teyra-notifications', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('notification-dates')) {
          db.createObjectStore('notification-dates', { keyPath: 'id' });
        }
      };
    });
    const tx = db.transaction(['notification-dates'], 'readwrite');
    tx.objectStore('notification-dates').delete('last-notification');
  } catch (e) {}
  
  localStorage.removeItem('teyra_last_notification_date');
  
  // Trigger notification
  const reg = await navigator.serviceWorker.ready;
  if (reg.active) {
    reg.active.postMessage({
      type: 'TRIGGER_NOTIFICATION',
      message: 'bro can you lock in you have so much stuff to do'
    });
    console.log('✅ Notification sent!');
  }
})();
```

## When Will Notifications Come Naturally?

- **Daily check**: Once per day (if you have >5 tasks)
- **Timing**: Usually runs in the background, but can be delayed
- **First notification**: May take up to 24 hours after installing PWA

## Troubleshooting

1. **No notification appears?**
   - Check notification permissions: Settings → Notifications → Teyra
   - Make sure you're on mobile (or testing mobile mode)
   - Service worker must be active

2. **"Service worker not active"?**
   - Refresh the page
   - Make sure you're on mobile or have mobile viewport

3. **"Need >5 tasks"?**
   - You have 7 tasks, so this shouldn't be an issue
   - Make sure tasks aren't marked as completed



