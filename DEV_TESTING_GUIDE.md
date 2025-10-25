# 🧪 Teyra Development Testing Guide

Quick reference for testing Teyra features in development mode.

---

## 🚀 Quick Start

### Start Development Server

```bash
cd /Users/varunnukala/Desktop/new_teyra/teyra/frontend
npm run dev
```

Open: http://localhost:3000

---

## 🧪 Test User Accounts

### Create Test Users Quickly

**Option 1: Use Clerk Dev Mode**
```
1. Go to http://localhost:3000
2. Click "Sign In"
3. Use Clerk's development mode
4. Sign up with any email (no verification needed in dev)
```

**Option 2: Use Real Email (for webhook testing)**
```
1. Sign up with your real email
2. You'll get verification email
3. This allows testing Stripe webhooks properly
```

### Quick Test Accounts
```
User 1 (Free): test-free@example.com
User 2 (Pro): test-pro@example.com
User 3 (New): test-new@example.com
```

---

## 🎛️ Dev-Only Features

### Toggle Pro Status (Button in Account Modal)

**How to Use:**
```
1. Open dashboard
2. Click User icon (top right)
3. Account modal opens
4. See purple button: "🧪 TEST: Toggle Pro Status (Dev Only)"
5. Click to instantly toggle Pro on/off
```

**What it does:**
- Toggles `is_pro` in database
- Sets test Stripe customer/subscription IDs
- Works ONLY in development mode
- Persists across page refreshes

**Use cases:**
```
✅ Test Pro features without paying
✅ Test free tier limits
✅ Test Pro UI changes
✅ Test Pro welcome modal
✅ Test AI unlimited vs limited
```

---

## 💳 Test Stripe Payments (Without Real Money)

### Stripe Test Mode (Already Configured)

Your app is in **test mode** by default. All payments are fake.

### Test Cards

**Always Succeeds:**
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

**Always Declines:**
```
Card: 4000 0000 0000 0002
```

**Requires 3D Secure (for testing authentication):**
```
Card: 4000 0025 0000 3155
```

**Insufficient Funds:**
```
Card: 4000 0000 0000 9995
```

### Test Payment Flow

```bash
# 1. Start dev server
npm run dev

# 2. Sign in to dashboard
# 3. Click "upgrade to pro — $10/month"
# 4. Use test card: 4242 4242 4242 4242
# 5. Complete payment
# 6. Should redirect back with Pro activated
```

**Check if it worked:**
- See Pro badge in top nav
- AI limit shows "∞ unlimited"
- Account modal shows "PRO" badge
- Can access Pomodoro timer (if extension is open)

---

## 🔗 Local Stripe Webhooks (For Testing Payment Events)

### Why You Need This

Stripe sends webhook events (like `checkout.session.completed`) to your server. In local dev, Stripe can't reach `localhost`. Solution: Stripe CLI.

### Setup (One Time)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login
```

### Run Webhook Forwarding

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

**You'll see:**
```
> Ready! Your webhook signing secret is whsec_xxxxx
```

**Copy that secret** and add to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Test Webhook Events

```bash
# Trigger a test checkout completion
stripe trigger checkout.session.completed

# Trigger subscription created
stripe trigger customer.subscription.created

# Trigger subscription deleted (cancellation)
stripe trigger customer.subscription.deleted
```

**Check console logs** - you should see:
```
✅ Webhook received: checkout.session.completed
✅ User upgraded to Pro: user_xxxxx
```

---

## 🧰 Dev Tools & Debugging

### Check User's Pro Status

**Method 1: Account Modal (UI)**
```
1. Click User icon (top right)
2. See "subscription" card
3. Shows: "teyra pro" or "teyra free"
```

**Method 2: Console (Browser DevTools)**
```javascript
// Open browser console (F12)
// Check if user is Pro
fetch('/api/subscription/status', {
  headers: { 'Authorization': `Bearer ${await getToken()}` }
}).then(r => r.json()).then(console.log)

// Should show: { isPro: true/false, proSince: "...", ... }
```

**Method 3: Database (Supabase)**
```
1. Go to Supabase Dashboard
2. Open "Table Editor"
3. Select "user_progress" table
4. Find your user by user_id (from Clerk)
5. Check "is_pro" column
```

### Check AI Request Limits

**Browser Console:**
```javascript
// Check AI limit status
fetch('/api/extension/ai-limit').then(r => r.json()).then(console.log)

// Should show:
// Free: { isPro: false, remaining: 3, limit: 5, used: 2 }
// Pro: { isPro: true, remaining: 999999, limit: 999999, unlimited: true }
```

### Clear Test Data

**Reset AI Limit (Free Users):**
```javascript
// In Supabase, run SQL:
DELETE FROM ai_request_log WHERE user_id = 'your_user_id';
```

**Reset Tasks:**
```javascript
// In Supabase, run SQL:
DELETE FROM tasks WHERE user_id = 'your_user_id';
```

**Reset Progress:**
```javascript
// In Supabase, run SQL:
DELETE FROM user_progress WHERE user_id = 'your_user_id';
```

---

## 🔍 Common Dev Issues & Fixes

### Issue: "Extension context invalidated"

**What it means:** Chrome extension reloaded while popup was open

**Fix:**
```
1. Close extension popup
2. Reopen it
3. Error should be gone
```

**Why it happens:**
- You edited extension code
- Browser auto-reloaded extension
- Old popup context is now invalid

**Prevention:**
- Close popup before editing extension code
- Or just ignore it (error is harmless)

---

### Issue: Pro toggle doesn't work

**Check:**
```
1. Are you in development mode?
   - Check: process.env.NODE_ENV === 'development'
   - Button only shows in dev mode

2. Is user_progress row created?
   - Go to Supabase → user_progress table
   - If no row, button will create one

3. Check console for errors
   - Should see: "✅ Toggled Pro status: false → true"
```

---

### Issue: Stripe payment succeeds but Pro doesn't activate

**Debug steps:**

**1. Check Stripe webhook events**
```
Go to: https://dashboard.stripe.com/test/webhooks
Click on your webhook endpoint
Check recent events
Look for: checkout.session.completed
```

**2. Check webhook logs**
```
In Stripe Dashboard:
- Go to webhook endpoint
- Click on event
- See "Request" and "Response"
- Check for errors
```

**3. Check app logs**
```
In terminal where you ran npm run dev:
Look for:
  ✅ Webhook received: checkout.session.completed
  ✅ User upgraded to Pro: user_xxxxx

If you see errors:
  ❌ Error updating user progress: ...
  (This means database update failed)
```

**4. Check database**
```
Supabase → user_progress table
Find your user
Check:
  - is_pro = true?
  - stripe_customer_id = set?
  - stripe_subscription_id = set?
```

**5. Manual fix (if webhook failed):**
```javascript
// Run in Supabase SQL Editor:
UPDATE user_progress
SET
  is_pro = true,
  stripe_customer_id = 'cus_test_123',
  stripe_subscription_id = 'sub_test_123',
  pro_since = NOW()
WHERE user_id = 'your_user_id';
```

---

### Issue: AI limit shows "Error" or "Not logged in"

**Cause:** API returned HTML instead of JSON (usually means auth failed)

**Fix:**
```
1. Make sure you're logged in to Teyra web app
2. Check if cookies are enabled
3. Open browser console
4. Check for auth errors
5. Try logging out and back in
```

**Test the API:**
```javascript
// In browser console on teyra.app:
fetch('https://teyra.app/api/extension/ai-limit', {
  credentials: 'include'
}).then(r => r.text()).then(console.log)

// Should be JSON, not HTML
// If HTML, auth is failing
```

---

## 🎯 Quick Test Scenarios

### Test Free User Experience

```
1. Create new account (or toggle Pro off)
2. Create 3 tasks ✅
3. Use AI text → task 5 times ✅
4. 6th AI request should show upgrade prompt ✅
5. Try to access Pomodoro timer → locked ✅
6. Try to add custom blocked site → Pro overlay ✅
7. AI limit shows "3/5" or similar ✅
```

### Test Pro User Experience

```
1. Toggle Pro on (or use real payment)
2. AI limit shows "∞ unlimited" ✅
3. Can use AI text → task unlimited times ✅
4. Can access Pomodoro timer ✅
5. Can add custom blocked sites ✅
6. Pro badge shows in top nav ✅
7. Account modal shows "PRO" ✅
```

### Test Payment Flow

```
1. Create new account
2. Click "upgrade to pro"
3. Redirects to Stripe checkout ✅
4. Enter test card: 4242 4242 4242 4242 ✅
5. Complete payment ✅
6. Redirects to /dashboard?pro_welcome=true ✅
7. Pro welcome modal appears ✅
8. Pro status is active ✅
9. Refresh page → Pro status persists ✅
```

### Test Cactus Progress

```
1. Create new account
2. Cactus should be "sad" (0 points) ✅
3. Complete 10 regular tasks → 100 points ✅
4. Cactus should be "neutral" ✅
5. Complete 7 more regular tasks + 1 sustainable → 250 points ✅
6. Cactus should be "happy" ✅
7. Refresh page → points persist ✅
```

---

## 📝 Quick Commands

### Start Development

```bash
cd frontend
npm run dev
```

### Test Stripe Webhooks

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

### Trigger Test Events

```bash
# Test successful checkout
stripe trigger checkout.session.completed

# Test subscription cancellation
stripe trigger customer.subscription.deleted
```

### Check Database

```bash
# Open Supabase Dashboard
open https://supabase.com/dashboard

# Or use SQL directly
supabase db push
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🔐 Environment Variables Checklist

Make sure these are set in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx...
CLERK_SECRET_KEY=sk_test_xxx...

# Stripe (TEST MODE)
STRIPE_SECRET_KEY=sk_test_xxx...
STRIPE_PRICE_ID=price_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx... (from stripe listen)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Check if env vars are loaded:**
```javascript
// In browser console:
console.log('App URL:', process.env.NEXT_PUBLIC_APP_URL)
console.log('Node Env:', process.env.NODE_ENV)

// In terminal:
echo $NEXT_PUBLIC_SUPABASE_URL
```

---

## 🎨 Testing UI Changes

### Liquid Glass Components

All UI uses liquid glass design system:

```css
/* Key Classes */
.liquid-glass-strong  /* Strong glass effect */
.liquid-glass-subtle  /* Subtle glass effect */
.liquid-glass-hover   /* Hover state */
.glass-gradient-purple /* Purple gradient */
.glass-gradient-blue   /* Blue gradient */
.glass-gradient-green  /* Green gradient */
```

### Test UI Changes

```
1. Edit component in /src/components/
2. Save file
3. Hot reload should update immediately
4. Check browser DevTools for errors
5. Test on mobile view (DevTools → Device toolbar)
```

---

## 🔄 Reset Everything (Fresh Start)

### Nuclear Option (Full Reset)

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear node modules
rm -rf node_modules
npm install

# 3. Clear Next.js cache
rm -rf .next

# 4. Clear browser data
# Go to: chrome://settings/clearBrowserData
# Select: Cookies, Cache
# Clear for teyra.app and localhost

# 5. Start fresh
npm run dev
```

### Reset Just Database

```sql
-- In Supabase SQL Editor:

-- Delete all tasks
DELETE FROM tasks WHERE user_id = 'your_user_id';

-- Delete progress
DELETE FROM user_progress WHERE user_id = 'your_user_id';

-- Delete AI logs
DELETE FROM ai_request_log WHERE user_id = 'your_user_id';
```

---

## 📊 Dev Metrics to Watch

### Console Logs to Monitor

**Good signs:**
```
✅ User upgraded to Pro: user_xxxxx
✅ Checkout session created
✅ Task synced with API successfully
✅ Mike XP synced to backend
✅ Cactus points awarded: {...}
```

**Bad signs (fix these):**
```
❌ Error updating user progress: ...
❌ Failed to create checkout session
❌ Webhook signature verification failed
⚠️ Could not fetch subscription status
⚠️ API returned HTML instead of JSON
```

### Network Tab (DevTools)

**Watch these endpoints:**
```
/api/tasks            - Should be 200 OK
/api/subscription/status - Should return isPro
/api/extension/ai-limit  - Should return JSON
/api/stripe/checkout  - Should return session URL
/api/stripe/webhook   - Should be 200 OK (when webhook fires)
```

**Red flags:**
```
❌ 500 Server Error
❌ 401 Unauthorized (auth issue)
❌ 404 Not Found (route issue)
⚠️ Long response times (>2s)
```

---

## 🎓 Pro Tips

### Faster Testing

```bash
# Use nodemon for auto-restart on backend changes
npm install -D nodemon
nodemon --watch src/app/api npm run dev

# Use Chrome DevTools Recorder to replay test flows
# Record once, replay infinite times
```

### Debug Chrome Extension

```
1. Open chrome://extensions
2. Enable "Developer mode"
3. Click "Inspect views: popup.html"
4. DevTools opens for extension popup
5. Check console, network, storage tabs
```

### Test Mobile View

```
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device (iPhone 12, Pixel 5, etc.)
4. Test UI at 375px, 414px, 768px widths
5. Test touch interactions
```

### Hot Reload Not Working?

```bash
# Restart dev server with clean cache
rm -rf .next
npm run dev
```

---

## 🚀 When Ready for Production

See `LAUNCH_CHECKLIST.md` for full production guide.

**Quick check:**
```
✅ All tests pass in dev mode
✅ Stripe payment works end-to-end
✅ Pro status persists after payment
✅ Free tier limits are enforced
✅ No console errors on clean load
✅ Mobile view works
```

**Switch to production:**
```
1. Change Stripe keys to live mode
2. Set NODE_ENV=production
3. Update NEXT_PUBLIC_APP_URL to real domain
4. Configure production webhook in Stripe
5. Deploy to Vercel/Netlify/etc.
```

---

## 📚 Additional Resources

- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Clerk Dev Mode**: https://clerk.com/docs/testing/overview
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Happy coding! 🌵✨**
