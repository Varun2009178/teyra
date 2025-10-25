# 🚀 Teyra Pre-Launch Checklist

## ✅ What's Been Fixed

### Critical Bug Fixes
- ✅ **Pro Status Persistence**: Pro status now properly persists in database using upsert
- ✅ **Extension Context Errors**: Added try-catch for chrome API calls to handle context invalidation
- ✅ **AI Limit Display**: Now shows "∞ unlimited" for Pro users, proper error handling for HTML responses
- ✅ **Stripe Redirect**: Fixed to redirect to dashboard with `?pro_welcome=true` and refresh Pro status

---

## 🧪 Pre-Launch Testing Guide

### 1. Authentication & User Flow

#### Test Scenario 1: New User Sign Up
```
1. Open incognito window
2. Go to https://teyra.app
3. Click "Sign In" → Create account with test email
4. Verify redirected to dashboard
5. Check that tasks can be created
6. Verify Pro status shows "FREE" in account modal
```

**Expected Result**: ✅ User can sign up, create tasks, and see free tier limits

#### Test Scenario 2: Returning User
```
1. Sign in with existing account
2. Verify tasks from previous session are loaded
3. Check cactus mood matches task completion
4. Verify Pro status is correct
```

**Expected Result**: ✅ All previous data loads correctly

---

### 2. Stripe Payment Flow (CRITICAL FOR LAUNCH)

#### Test with Stripe Test Cards

**Test Card for Success**:
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Test Card for Decline**:
```
Card Number: 4000 0000 0000 0002
(Should show "Your card was declined")
```

#### Payment Flow Test Steps
```
1. Log in to Teyra dashboard
2. Click "upgrade to pro — $10/month" button
3. Verify redirected to Stripe Checkout page
4. Enter test card: 4242 4242 4242 4242
5. Complete payment
6. SHOULD redirect to: /dashboard?pro_welcome=true&session_id=...
7. SHOULD see ProWelcomeModal popup
8. SHOULD see Pro badge in top nav
9. Check AI limit shows "∞ unlimited"
10. Refresh page - Pro status should persist
```

**Expected Result**:
✅ Payment succeeds
✅ Redirects to dashboard
✅ Pro status activated immediately
✅ Pro welcome modal shows
✅ Pro status persists after refresh

**Current Issue to Test**:
> User reports: "if i try upgrading to pro using fake card info like it successes and then just goes back to the dashboard where it says 'upgrade to pro'"

**What to Check**:
1. Does webhook receive the `checkout.session.completed` event?
2. Is `user_progress.is_pro` set to `true` in database?
3. Does subscription status API return `isPro: true`?

---

### 3. Stripe Webhook Testing (LOCAL DEV)

#### Setup Stripe CLI
```bash
# Install Stripe CLI (if not installed)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhook events to local server
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Copy the webhook signing secret and add to .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Test Webhook Locally
```bash
# In terminal 1: Run dev server
npm run dev

# In terminal 2: Listen for webhooks
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# In terminal 3: Trigger test checkout completion
stripe trigger checkout.session.completed
```

**Expected Console Output**:
```
✅ Webhook received: checkout.session.completed
✅ User upgraded to Pro: user_xxxxx
```

---

### 4. Demo vs Pro Features

#### Free Tier (Demo) Features
✅ **MUST WORK WITHOUT PRO**:
- Sign up / Login
- Create up to 10 tasks per day
- Complete tasks and see cactus progress
- AI text → task (5 per day limit)
- View all tasks
- Mood-based task suggestions
- Sustainable task generator
- Task completion confirmations
- Notification settings
- Basic dashboard analytics

#### Pro Features (Should be locked for free users)
🔒 **REQUIRES PRO**:
- Unlimited AI text → task (200 per month)
- Pomodoro timer
- Focus mode custom website blocking
- Priority support badge

**Test Free User Experience**:
```
1. Create new account (don't upgrade)
2. Verify AI limit shows "3/5" or similar
3. Try to access pomodoro timer → should see locked state
4. Try to add custom blocked site → should see Pro overlay
5. Complete 5 AI text → task requests → 6th should show upgrade prompt
```

---

### 5. Core Functionality Check

#### Task Creation & Management
```
✅ Can add task via input field
✅ Can add task via mood selector
✅ Can add sustainable task
✅ Task appears immediately (optimistic update)
✅ Task persists after refresh
✅ Can complete task (checkbox works)
✅ Can delete task
✅ Task limit (10/day) is enforced
```

#### Cactus Progress System
```
✅ Cactus starts as "sad" (0 points)
✅ Completing regular task = +10 points
✅ Completing sustainable task = +20 points
✅ At 100 points → cactus becomes "neutral"
✅ At 250 points → cactus becomes "happy"
✅ Points persist after refresh
✅ [COMPLETED] tasks count toward total points
```

#### AI Features (Free Tier)
```
✅ AI text → task works 5 times per day
✅ Shows remaining count (e.g., "3/5")
✅ After 5 uses, shows upgrade prompt
✅ Counter resets at midnight (local time)
```

---

### 6. Visual & UX Pass

#### Branding
```
✅ Teyra logo appears consistently
✅ Liquid glass UI throughout
✅ Dark gradient background
✅ Purple/blue/pink accent colors
✅ Consistent typography
```

#### Mobile Responsiveness
```
✅ Dashboard works on mobile (375px width)
✅ Stripe checkout page works on mobile
✅ Task input is usable on mobile
✅ Buttons are tappable (min 44px height)
```

#### Loading States
```
✅ Loading spinner while fetching tasks
✅ "Adding..." state when creating task
✅ Skeleton loader during initial load
✅ "Opening checkout..." toast for Stripe
```

#### Error Messages
```
✅ Friendly error for failed task creation
✅ "Daily limit reached" popup with explanation
✅ "Not logged in" for extension API errors
✅ Network error handling
```

---

### 7. Chrome Extension (Optional for Demo)

Since you mentioned "extension and analytics come later", here's what to test IF you want extension in demo:

#### Extension Features to Test
```
✅ Extension popup opens
✅ Shows correct login state
✅ Can create tasks from extension
✅ AI limit shows correctly
✅ Focus mode toggle works
✅ Pomodoro timer (Pro only) is locked for free users
```

**Extension Can Be Disabled for Demo Launch** - Focus on core web app first.

---

## 🔧 Environment Setup

### Required Environment Variables

```env
# .env.local (frontend)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRICE_ID=your_price_id
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

NODE_ENV=development # or production
```

---

## 🎯 Definition of "Demo Launch Ready"

### Minimum Requirements
1. ✅ Users can sign up and log in without errors
2. ✅ Users can create, complete, and delete tasks
3. ✅ Cactus progress system works correctly
4. ✅ Free tier limits are enforced (5 AI/day, 10 tasks/day)
5. ✅ Pro upgrade button leads to Stripe checkout
6. ✅ Stripe test mode payments work end-to-end
7. ✅ No console errors on clean page load
8. ✅ Mobile responsive (basic)
9. ✅ Error messages are user-friendly
10. ✅ Branding is consistent

### Nice to Have (Can Ship Without)
- ❌ Chrome extension (ship later)
- ❌ Advanced analytics (ship later)
- ❌ Email notifications (ship later)
- ❌ Social sharing (ship later)

---

## 🚦 Go/No-Go Decision

### GREEN LIGHT (Safe to Launch Demo)
- All "Minimum Requirements" pass
- Payment flow works with test cards
- No critical bugs in console
- Mobile view is usable
- Free tier experience is complete

### RED LIGHT (Do Not Launch Yet)
- Payment flow doesn't work
- Tasks don't persist after refresh
- Cactus progress is broken
- Pro status doesn't activate after payment
- Critical errors on page load

---

## 📝 Pre-Production Checklist

Before switching from test mode to live Stripe:

1. ✅ Test payment flow with test cards (minimum 3 successful tests)
2. ✅ Verify webhook receives events in test mode
3. ✅ Test subscription cancellation flow
4. ✅ Verify Pro status activates immediately after payment
5. ✅ Test on multiple browsers (Chrome, Safari, Firefox)
6. ✅ Test on mobile device (not just DevTools)
7. ✅ Review Stripe webhook logs - no errors
8. ✅ Set up monitoring for webhook failures
9. ✅ Add terms of service and privacy policy links
10. ✅ Set up error tracking (Sentry, LogRocket, etc.)

---

## 🎬 Launch Day Tasks

### Switch to Production Mode

1. **Stripe**:
   ```
   - Switch from test mode to live mode in Stripe dashboard
   - Update STRIPE_SECRET_KEY with live key
   - Update STRIPE_PRICE_ID with live price ID
   - Update STRIPE_WEBHOOK_SECRET with live webhook secret
   - Verify webhook endpoint is configured in Stripe dashboard
   ```

2. **Clerk**:
   ```
   - Switch to production instance (if using separate dev/prod)
   - Update NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   - Update CLERK_SECRET_KEY
   ```

3. **Database**:
   ```
   - Ensure production Supabase project is used
   - Run migrations if needed
   - Set up database backups
   ```

4. **Environment**:
   ```
   - Set NODE_ENV=production
   - Update NEXT_PUBLIC_APP_URL to production domain
   - Test ALL environment variables are set correctly
   ```

### Monitoring Setup
- Set up Stripe webhook monitoring
- Set up error tracking (Sentry recommended)
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Set up analytics (PostHog, Mixpanel, or simple GA4)

---

## 📞 Support & Issue Tracking

### Common Issues & Solutions

**Issue**: "Upgrade to Pro shows success but status doesn't change"
```
Solution:
1. Check Stripe webhook logs
2. Verify webhook secret is correct
3. Check user_progress table - is is_pro=true?
4. Test with: stripe trigger checkout.session.completed
```

**Issue**: "Extension context invalidated" error
```
Solution:
- This happens when extension reloads
- Already fixed with try-catch wrappers
- User just needs to close and reopen popup
```

**Issue**: "AI limit shows 0/200 for Pro users"
```
Solution:
- Fixed: Now shows "∞ unlimited"
- If still broken, check that isPro=true in database
```

---

## 🎉 You're Ready to Launch When...

✅ All payment tests pass (minimum 3 successful test card payments)
✅ Pro status activates immediately after payment
✅ Free tier works completely without payment
✅ Mobile experience is usable
✅ No critical console errors
✅ Webhook receives and processes events correctly
✅ Error messages are friendly and helpful
✅ You've tested as 3 different users (new, free, pro)

---

## 📊 Post-Launch Monitoring

### Week 1 Checklist
- [ ] Monitor Stripe webhook success rate (should be >99%)
- [ ] Check error logs daily
- [ ] Monitor user signups
- [ ] Track conversion rate (free → pro)
- [ ] Collect user feedback
- [ ] Watch for pattern in support requests

### Metrics to Track
- Daily active users (DAU)
- Task completion rate
- AI feature usage (free tier)
- Pro conversion rate
- Stripe payment success rate
- Average session duration

---

**Remember**: Ship small, improve fast. You're launching proof, not perfection! 🚀
