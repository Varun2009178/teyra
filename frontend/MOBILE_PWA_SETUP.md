# Mobile PWA Notifications - Complete Guide

## Overview
Teyra now supports Progressive Web App (PWA) functionality with native notifications on mobile devices. The service worker automatically registers only on mobile browsers, and users receive Gen Z-style notifications when they have more than 5 incomplete tasks (once per day maximum).

## How It Works

### 1. Mobile Detection & Service Worker Registration
- **Component**: `src/components/MobileServiceWorker.tsx`
- **Location**: Automatically included in `src/app/layout.tsx`
- **Detection**: Checks `navigator.userAgent` and viewport width (< 1024px)
- **Registration**: Only registers service worker on mobile devices
- **Desktop**: Service worker is NOT registered on desktop (by design)

### 2. Service Worker (`/public/sw.js`)
The service worker handles:
- **Caching**: Caches essential pages for offline access
- **Notifications**: Shows Gen Z-style notifications
- **Daily Checks**: Uses IndexedDB to track if notification was sent today
- **Task Checking**: Fetches tasks from API and only notifies if >5 incomplete tasks
- **Click Handling**: Opens dashboard when notification is clicked

### 3. Notification Logic
- **Frequency**: Maximum once per day
- **Condition**: Only sends if user has MORE than 5 incomplete tasks
- **Storage**: Uses IndexedDB to track last notification date
- **Messages**: Random Gen Z messages like "bro can you lock in you have so much stuff to do"

### 4. Background Sync
- **Primary**: Periodic Background Sync (24-hour interval) - Chrome 80+
- **Fallback**: Regular Background Sync with daily tracking
- **Fallback 2**: Hourly checks with localStorage date tracking

## Files Created/Modified

### New Files:
1. **`src/components/MobileServiceWorker.tsx`**
   - Detects mobile devices
   - Registers service worker only on mobile
   - Sets up daily notification checks
   - Handles service worker messages

2. **`src/app/api/notifications/trigger/route.ts`**
   - API endpoint to trigger notifications programmatically
   - Checks for >5 tasks before allowing notification

3. **`src/lib/notifications.ts`**
   - Utility functions for notifications
   - Helper to detect social media sites

### Modified Files:
1. **`public/sw.js`**
   - Enhanced with Gen Z notifications
   - Daily notification tracking via IndexedDB
   - Task count checking (>5 tasks required)

2. **`public/manifest.json`**
   - Already had PWA manifest (no changes needed, but verified)

3. **`src/app/layout.tsx`**
   - Added `<MobileServiceWorker />` component

## How to Add After GitHub Commit

### Step 1: Commit Current Changes
```bash
cd teyra/frontend
git add .
git commit -m "Add mobile PWA notifications with daily Gen Z reminders"
git push
```

### Step 2: Verify Files Are Committed
Make sure these files are in your repo:
- ✅ `src/components/MobileServiceWorker.tsx`
- ✅ `public/sw.js` (updated)
- ✅ `src/app/api/notifications/trigger/route.ts`
- ✅ `src/lib/notifications.ts`
- ✅ `src/app/layout.tsx` (updated)

### Step 3: Deploy to Production
After deploying (Vercel/Netlify/etc.), the PWA will automatically work:

1. **Mobile users** will see the service worker register
2. **Notification permission** will be requested
3. **Daily checks** will run automatically
4. **Notifications** will appear when users have >5 tasks

### Step 4: Testing on Mobile

#### On Android (Chrome):
1. Open Teyra in Chrome mobile browser
2. Grant notification permission when prompted
3. Add 6+ incomplete tasks
4. Wait for daily check (or trigger manually via API)
5. Notification should appear with Gen Z message
6. Click notification → opens dashboard

#### On iOS (Safari):
1. Open Teyra in Safari mobile
2. Tap Share → "Add to Home Screen"
3. Grant notification permission
4. Add 6+ incomplete tasks
5. Notifications work but periodic sync is limited on iOS

## API Endpoints

### Trigger Notification Manually
```bash
POST /api/notifications/trigger
{
  "userId": "user_123",
  "message": "custom message" // optional
}
```

**Response:**
- Returns success if >5 tasks
- Returns message if ≤5 tasks (won't notify)

## Notification Messages

The system uses these Gen Z messages (randomly selected):
- "bro can you lock in you have so much stuff to do"
- "bro can you lock the hell in holy shit"
- "yo you're procrastinating again 💀 get back to work"
- "bro stop scrolling and do your tasks fr"
- "you have tasks waiting... are we being fr right now?"
- "lock in bro your tasks aren't gonna do themselves"
- "stop the scroll and get back to productivity mode"
- "bro you're on social media again... your tasks are crying"
- "can you actually focus rn? you got stuff to do"
- "yo get off that app and check your tasks 💯"

## Technical Details

### Service Worker Lifecycle
1. **Install**: Caches essential files
2. **Activate**: Cleans up old caches
3. **Fetch**: Serves cached content when offline
4. **Sync**: Handles daily task checks
5. **Message**: Receives task data from client

### IndexedDB Storage
- **Database**: `teyra-notifications`
- **Store**: `notification-dates`
- **Key**: `last-notification`
- **Value**: `{ id: 'last-notification', date: 'Mon Jan 01 2024' }`

### Notification Flow
```
1. Daily check triggered (periodic sync or hourly interval)
2. Check IndexedDB: Was notification sent today?
   - Yes → Skip
   - No → Continue
3. Fetch tasks from /api/tasks
4. Filter incomplete tasks
5. Check if incompleteTasks.length > 5
   - Yes → Show notification
   - No → Skip
6. Store today's date in IndexedDB
```

## Browser Support

| Browser | Service Worker | Notifications | Periodic Sync | Status |
|---------|---------------|---------------|---------------|--------|
| Chrome Android | ✅ | ✅ | ✅ | Full Support |
| Firefox Android | ✅ | ✅ | ⚠️ Limited | Works |
| Safari iOS | ✅ | ✅ | ❌ | Limited (no background sync) |
| Edge Android | ✅ | ✅ | ✅ | Full Support |
| Desktop | ❌ | N/A | N/A | Not Registered |

## Troubleshooting

### Notifications Not Appearing?
1. Check if device is mobile (service worker only registers on mobile)
2. Verify notification permission is granted
3. Ensure user has >5 incomplete tasks
4. Check if notification was already sent today (IndexedDB)
5. Check browser console for errors

### Service Worker Not Registering?
1. Verify you're on a mobile device or viewport < 1024px
2. Check browser console for registration errors
3. Ensure `/sw.js` is accessible (check Network tab)
4. Clear browser cache and try again

### Testing Daily Limit
To test the "once per day" limit:
1. Open browser DevTools → Application → IndexedDB
2. Find `teyra-notifications` database
3. Delete the `last-notification` entry
4. Trigger notification again

## Future Enhancements

1. **Chrome Extension Integration**: Detect social media usage and trigger notifications
2. **Smart Timing**: Only send during work hours
3. **Task Priority**: Customize messages based on urgent tasks
4. **User Preferences**: Allow users to customize frequency and messages
5. **Notification History**: Track when notifications were sent

## Important Notes

- ⚠️ **Mobile Only**: Service worker does NOT register on desktop
- ⚠️ **>5 Tasks Required**: Notifications only send if user has more than 5 incomplete tasks
- ⚠️ **Once Per Day**: Maximum one notification per day (resets at midnight)
- ⚠️ **iOS Limitations**: Periodic background sync doesn't work on iOS Safari (but notifications still work)
- ✅ **Automatic**: No user action needed - works automatically after deployment

## Deployment Checklist

- [ ] All files committed to GitHub
- [ ] Deployed to production (Vercel/Netlify)
- [ ] Tested on Android Chrome
- [ ] Tested on iOS Safari
- [ ] Verified notification permissions work
- [ ] Confirmed daily limit works (IndexedDB)
- [ ] Tested with >5 tasks
- [ ] Tested with ≤5 tasks (should not notify)

## Quick Start After Deployment

1. Open Teyra on mobile browser
2. Grant notification permission
3. Add 6+ incomplete tasks
4. Wait for daily check OR trigger manually:
   ```javascript
   // In browser console:
   navigator.serviceWorker.ready.then(reg => {
     reg.sync.register('daily-task-check');
   });
   ```
5. Notification should appear!



