# How to Manually Trigger Mobile Notifications

## Method 1: Browser Console (Easiest)

### On Mobile Device:
1. Open Teyra in mobile browser
2. Open browser DevTools (Chrome: Menu → More Tools → Developer Tools)
3. Go to Console tab
4. Paste this code:

```javascript
// Trigger notification immediately
navigator.serviceWorker.ready.then(async (registration) => {
  // Check if we have >5 tasks
  const response = await fetch('/api/tasks');
  const tasks = await response.json();
  const incompleteTasks = tasks.filter(t => !t.completed && !t.title.includes('[COMPLETED]'));
  
  if (incompleteTasks.length > 5) {
    // Send message to service worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'TRIGGER_NOTIFICATION',
        message: 'bro can you lock in you have so much stuff to do'
      });
      console.log('✅ Notification triggered!');
    }
  } else {
    console.log(`❌ Only ${incompleteTasks.length} tasks (need >5)`);
  }
});
```

### Trigger Daily Check:
```javascript
// Force daily check (will respect daily limit)
navigator.serviceWorker.ready.then(async (registration) => {
  await registration.sync.register('daily-task-check');
  console.log('✅ Daily check triggered');
});
```

## Method 2: API Endpoint

### Using curl:
```bash
curl -X POST https://your-domain.com/api/notifications/trigger \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"userId": "user_123"}'
```

### Using fetch in console:
```javascript
fetch('/api/notifications/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'your-user-id' })
})
.then(r => r.json())
.then(data => console.log(data));
```

## Method 3: Clear Daily Limit (For Testing)

To test notifications multiple times per day:

### In Browser Console:
```javascript
// Clear IndexedDB notification date
indexedDB.open('teyra-notifications').onsuccess = (event) => {
  const db = event.target.result;
  const transaction = db.transaction(['notification-dates'], 'readwrite');
  const store = transaction.objectStore('notification-dates');
  store.delete('last-notification');
  console.log('✅ Daily limit cleared');
};

// Also clear localStorage (fallback)
localStorage.removeItem('teyra_last_notification_date');
localStorage.removeItem('teyra_last_daily_check');
```

Then trigger notification using Method 1 or 2.

## Method 4: Direct Service Worker Message

```javascript
navigator.serviceWorker.ready.then(registration => {
  if (registration.active) {
    registration.active.postMessage({
      type: 'TRIGGER_NOTIFICATION',
      message: 'bro what the hell are you doing? you got tasks'
    });
  }
});
```

## Quick Test Script

Copy-paste this into browser console for quick testing:

```javascript
(async () => {
  // Check tasks
  const tasksRes = await fetch('/api/tasks');
  const tasks = await tasksRes.json();
  const incomplete = tasks.filter(t => !t.completed && !t.title.includes('[COMPLETED]'));
  
  console.log(`📋 You have ${incomplete.length} incomplete tasks`);
  
  if (incomplete.length > 5) {
    // Clear daily limit
    indexedDB.open('teyra-notifications').onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(['notification-dates'], 'readwrite');
      tx.objectStore('notification-dates').delete('last-notification');
    };
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
  } else {
    console.log(`❌ Need >5 tasks (you have ${incomplete.length})`);
  }
})();
```

## Testing Checklist

- [ ] Have 6+ incomplete tasks
- [ ] Clear daily limit (if testing multiple times)
- [ ] Grant notification permission
- [ ] Trigger notification
- [ ] Verify notification appears
- [ ] Click notification → opens dashboard
- [ ] Verify daily limit works (can't trigger again same day)




