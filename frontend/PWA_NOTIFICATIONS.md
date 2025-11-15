# PWA Mobile Notifications Setup

## Overview
Teyra now supports Progressive Web App (PWA) functionality with native notifications on mobile devices. The service worker is automatically registered only on mobile browsers, and users can receive Gen Z-style notifications when they have incomplete tasks.

## Features

### 1. Mobile-Only Service Worker Registration
- Automatically detects mobile devices via `navigator.userAgent` and viewport width
- Only registers the service worker on mobile devices (< 1024px width or mobile user agent)
- Desktop users won't have the service worker registered

### 2. Gen Z-Style Notifications
Notifications use Gen Z slang and are triggered when:
- User has incomplete tasks
- Periodic background sync runs (every 15 minutes)
- API endpoint is called to trigger notifications
- Chrome extension detects social media usage (future integration)

### 3. Notification Messages
Random Gen Z messages include:
- "bro can you lock in you have so much stuff to do"
- "bro can you lock the hell in holy shit"
- "yo you're procrastinating again 💀 get back to work"
- "bro stop scrolling and do your tasks fr"
- And more...

### 4. Click Behavior
When users click a notification:
- Opens the Teyra dashboard (`/dashboard`)
- Focuses existing window if already open
- Creates new window if not open

## Files Created/Modified

1. **`/public/sw.js`** - Enhanced service worker with:
   - Gen Z notification messages
   - Periodic background sync support
   - Message handler for API-triggered notifications
   - Notification click handlers

2. **`/src/components/MobileServiceWorker.tsx`** - Component that:
   - Detects mobile devices
   - Registers service worker only on mobile
   - Requests notification permissions
   - Sets up periodic background sync

3. **`/src/app/api/notifications/trigger/route.ts`** - API endpoint to:
   - Trigger notifications programmatically
   - Check for incomplete tasks
   - Send Gen Z messages

4. **`/src/lib/notifications.ts`** - Utility functions:
   - `triggerGenZNotification()` - Trigger notifications from code
   - `isSocialMediaSite()` - Detect social media URLs

5. **`/public/manifest.json`** - Updated PWA manifest with:
   - Notification permissions
   - Proper icons and metadata

## How It Works

### Service Worker Registration
1. `MobileServiceWorker` component mounts in `layout.tsx`
2. Detects if device is mobile
3. If mobile, registers `/sw.js` service worker
4. Requests notification permission
5. Registers periodic background sync (if supported)

### Notification Triggering
Notifications can be triggered via:
1. **Periodic Background Sync** - Checks every 15 minutes for incomplete tasks
2. **API Endpoint** - POST to `/api/notifications/trigger` with userId
3. **Service Worker Messages** - Send message with type `TRIGGER_NOTIFICATION`
4. **Chrome Extension** - (Future) Can call API when detecting social media

### Notification Display
- Shows Gen Z message
- Includes Teyra icon and badge
- Has "Open Teyra" and "Dismiss" actions
- Vibrates on supported devices
- Opens dashboard when clicked

## Testing

### On Mobile Device:
1. Open Teyra in mobile browser
2. Grant notification permission when prompted
3. Add some incomplete tasks
4. Wait for periodic sync (15 min) or trigger via API
5. Notification should appear with Gen Z message
6. Click notification to open dashboard

### Via API:
```bash
POST /api/notifications/trigger
{
  "userId": "user_123",
  "message": "custom message" // optional
}
```

### Via Service Worker Message:
```javascript
navigator.serviceWorker.ready.then(registration => {
  registration.active.postMessage({
    type: 'TRIGGER_NOTIFICATION',
    message: 'custom message'
  });
});
```

## Future Enhancements

1. **Chrome Extension Integration** - Detect social media usage and trigger notifications
2. **Smart Timing** - Only send notifications during work hours
3. **Task-Specific Messages** - Customize messages based on task priority
4. **Notification Frequency Limits** - Prevent notification spam
5. **User Preferences** - Allow users to customize notification frequency and messages

## Browser Support

- ✅ Chrome/Edge (Android) - Full support
- ✅ Safari (iOS) - Limited (no background sync, but notifications work)
- ✅ Firefox (Android) - Full support
- ❌ Desktop browsers - Service worker not registered (by design)

## Notes

- Service worker only registers on mobile devices
- Notifications require user permission
- Periodic background sync requires Chrome 80+ or Edge 80+
- iOS Safari has limited background sync support but notifications work
- Notifications only show if user has incomplete tasks



