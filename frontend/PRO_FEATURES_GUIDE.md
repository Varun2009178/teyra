# Teyra Pro Features Implementation Guide

## 🧪 Testing Without Spending Money

Stripe Test Mode uses **fake credit cards** that won't charge real money!

### Test Card Numbers:
- **Success**: `4242 4242 4242 4242`
- **Requires 3D Secure**: `4000 0025 0000 3155`
- **Card Declined**: `4000 0000 0000 9995`

**For any test card:**
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Testing Flow:
1. Click "Upgrade Now" on dashboard
2. Use test card `4242 4242 4242 4242`
3. Complete checkout
4. You'll be redirected back with Pro access!

## 🔒 How to Gate Features Behind Pro

### Method 1: Using the ProFeature Component (Easiest)

Wrap any feature in the `<ProFeature>` component:

```tsx
import { ProFeature } from '@/components/ProFeature';

// Example: Pomodoro Timer (Pro only)
<ProFeature>
  <PomodoroTimer />
</ProFeature>

// Shows this for non-Pro users:
// - Lock icon
// - "Pro Feature" message
// - "Upgrade Now" button
```

### Method 2: Using the useProStatus Hook (More Control)

```tsx
import { useProStatus } from '@/hooks/useProStatus';

function MyComponent() {
  const { isPro, isLoading } = useProStatus();

  if (isLoading) return <LoadingSpinner />;

  if (!isPro) {
    return <div>Upgrade to Pro to access this!</div>;
  }

  return <ProFeatureContent />;
}
```

### Method 3: Conditional Rendering

```tsx
import { useProStatus } from '@/hooks/useProStatus';

function Dashboard() {
  const { isPro } = useProStatus();

  return (
    <div>
      {/* Everyone sees this */}
      <BasicFeatures />

      {/* Only Pro users see this */}
      {isPro && <PomodoroTimer />}
      {isPro && <AdvancedFocusMode />}

      {/* Show upgrade prompt if not Pro */}
      {!isPro && <UpgradePrompt />}
    </div>
  );
}
```

## 📱 Chrome Extension - Checking Pro Status

In your Chrome extension, check Pro status before allowing AI features:

```javascript
// In your chrome extension background.js or content.js
async function checkProStatus(userId) {
  try {
    const response = await fetch('http://localhost:3000/api/user/pro-status', {
      headers: {
        'Authorization': `Bearer ${userToken}` // Get from Clerk
      }
    });

    const data = await response.json();
    return data.isPro;
  } catch (error) {
    console.error('Error checking Pro status:', error);
    return false;
  }
}

// Example: Limit AI requests for free users
async function handleAIRequest(userId) {
  const isPro = await checkProStatus(userId);

  if (!isPro) {
    // Free tier: check rate limit
    const requestCount = await getRequestCount(userId);
    if (requestCount >= 5) {
      alert('You\'ve reached your daily limit! Upgrade to Pro for unlimited AI requests.');
      return;
    }
    await incrementRequestCount(userId);
  }

  // Process AI request...
  const response = await callAI();
  return response;
}
```

## 🎯 Example: Implementing Pomodoro Timer (Pro Feature)

```tsx
// src/components/PomodoroTimer.tsx
'use client';

import { ProFeature } from '@/components/ProFeature';
import { useState } from 'react';

function PomodoroTimerContent() {
  const [minutes, setMinutes] = useState(25);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="border border-white/10 bg-black/20 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">🍅 Pomodoro Timer</h3>
      <div className="text-4xl font-bold text-white mb-6">
        {minutes}:00
      </div>
      <button
        onClick={() => setIsRunning(!isRunning)}
        className="px-6 py-3 bg-white text-black font-bold rounded-lg"
      >
        {isRunning ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}

export function PomodoroTimer() {
  return (
    <ProFeature>
      <PomodoroTimerContent />
    </ProFeature>
  );
}
```

Then use it in your dashboard:

```tsx
// In dashboard page
import { PomodoroTimer } from '@/components/PomodoroTimer';

export default function Dashboard() {
  return (
    <div>
      {/* Other content */}
      <PomodoroTimer /> {/* Automatically shows upgrade prompt if not Pro */}
    </div>
  );
}
```

## 🚀 Quick Implementation Checklist

### For Dashboard Features:
- [ ] Wrap Pro features in `<ProFeature>` component
- [ ] Test with and without Pro subscription
- [ ] Verify upgrade button redirects to dashboard

### For Chrome Extension:
- [ ] Add Pro status check before AI requests
- [ ] Implement rate limiting for free tier (e.g., 5 requests/day)
- [ ] Show "Upgrade to Pro" message when limit reached
- [ ] Store Pro status in chrome.storage for offline access

### For Focus Mode:
- [ ] Basic focus mode: Free (block 5 sites)
- [ ] Enhanced focus mode: Pro (unlimited sites + advanced features)
- [ ] Add Pro badge to enhanced features

## 🧑‍💻 Testing Your Implementation

1. **Test as Free User:**
   - Don't subscribe
   - Try accessing Pro features → Should see upgrade prompt
   - Chrome extension AI → Should hit rate limit

2. **Test as Pro User:**
   - Subscribe using test card `4242 4242 4242 4242`
   - Try accessing Pro features → Should work
   - Chrome extension AI → Should be unlimited
   - Check webhook logs in Stripe Dashboard

3. **Test Subscription Cancellation:**
   - Go to Stripe Dashboard → Customers
   - Cancel the test subscription
   - Pro features should be blocked again

## 📊 Database Schema

The `user_progress` table now has these Pro columns:

| Column | Type | Description |
|--------|------|-------------|
| `is_pro` | BOOLEAN | Whether user has active Pro subscription |
| `stripe_customer_id` | TEXT | Stripe customer ID |
| `stripe_subscription_id` | TEXT | Stripe subscription ID |
| `pro_since` | TIMESTAMP | When user became Pro |

## 🔐 Security Notes

- ✅ Pro status is checked server-side (secure)
- ✅ Webhooks verify Stripe signatures
- ✅ Can't fake Pro status from client
- ✅ Chrome extension must call your API to verify

## 🆘 Troubleshooting

**"Upgrade button does nothing"**
- Check browser console for errors
- Verify `STRIPE_PRICE_ID` in `.env.local`
- Restart dev server after adding env vars

**"Pro features still locked after paying"**
- Check Stripe webhook logs
- Run: `SELECT * FROM user_progress WHERE user_id = 'YOUR_USER_ID';`
- Verify `is_pro` column is `true`

**"Chrome extension still rate limited"**
- Clear extension storage
- Check API endpoint returns `isPro: true`
- Verify extension is calling the right API URL

## 📚 Next Steps

1. Implement Pomodoro Timer component
2. Add rate limiting to Chrome extension AI
3. Build Enhanced Focus Mode (Pro)
4. Add Pro badge to dashboard
5. Test entire flow end-to-end
