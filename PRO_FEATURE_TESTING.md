# Pro Feature Testing Guide

This guide will help you test all Pro features without actually paying for a subscription.

## Quick Overview

**Limits:**
- **Free users:** 5 AI breakdowns per day
- **Pro users:** 200 AI breakdowns per month (not unlimited)

**Stripe Setup:** Fully automated via webhooks - NO manual editing required!

## Testing Setup

### 1. Toggle Pro Status (Development Mode Only)

We've added a **TEST button** that lets you toggle between Free and Pro status instantly:

1. Open your dashboard at `http://localhost:3000/dashboard`
2. Click the **User icon** in the top-right header (next to settings)
3. Look for the purple button: **🧪 TEST: Toggle Pro Status (Dev Only)**
4. Click it to toggle between Free ↔ Pro
5. You'll see a success toast message confirming the change

**Note:** This button only appears in development mode and won't be visible in production.

---

## Features to Test

### A. Free User Features (Start Here)

1. **Click the toggle button** to ensure you're in FREE mode
2. Verify the Account Status modal shows:
   - Badge: `FREE`
   - Subscription: "teyra free"
   - Description: "5 ai breakdowns per day"

3. **Test AI Breakdown Limit:**
   - Go to Gmail or any page
   - Use the Chrome extension (highlight text 3x)
   - Try highlighting text for an AI breakdown
   - After 5 uses, you should see:
     - Modal: "You've reached your daily limit (5/5 today)"
     - Options: "Upgrade to Pro" and "Maybe Later"
     - The modal won't show again for 24 hours after dismissing

4. **Test Free Dashboard:**
   - Pro banner should be visible at the top
   - Shows 4 Pro features with checkmarks
   - "upgrade to pro — $10/month" button visible

---

### B. Pro User Features

1. **Click the toggle button** to UPGRADE to PRO mode
2. Verify the Account Status modal shows:
   - Badge: `PRO`
   - Subscription: "teyra pro"
   - Description: "200 ai breakdowns per month, pomodoro timer, and more"

3. **Test 200 AI Breakdowns per Month:**
   - Go to Gmail or any page
   - Use the Chrome extension (highlight text)
   - Highlight text 10+ times - should increment counter
   - Extension popup should show: "X/200 this month" (not "unlimited")
   - Pro users can make up to 200 breakdowns per month

4. **Test Pro Dashboard:**
   - Pro banner at top should be HIDDEN
   - No upgrade prompts visible
   - Full access to all features

5. **Test Pro Extension Features:**
   - Open the extension popup
   - Pro status banner should show: "⭐ PRO"
   - AI limit should show: "X/200 this month" (in blue)
   - Pomodoro timer section should be VISIBLE (not locked)

---

## Checking AI Request Logs

If you want to verify the daily limit manually or reset your usage:

### View Current Usage (via API):

```bash
# In browser console on dashboard:
const token = await (await fetch('/api/user/me')).json()
const response = await fetch('/api/extension/ai-limit', {
  headers: { 'Authorization': `Bearer YOUR_TOKEN_HERE` }
})
console.log(await response.json())
```

### Reset AI Request Count (Database):

If you need to test the limit from scratch:

1. Go to your Supabase dashboard
2. Open the `ai_request_log` table
3. Delete all rows for your user_id
4. Refresh the extension - you should have 5/5 again

---

## Pro Feature Checklist

Use this checklist to verify all Pro features work correctly:

### FREE User Tests:
- [ ] Shows "FREE" badge in Account Status
- [ ] Dashboard shows Pro upgrade banner
- [ ] AI breakdown limit shows "X/5 today"
- [ ] After 5 AI requests, limit modal appears
- [ ] Limit modal has 24-hour dismissal tracking
- [ ] Extension popup shows upgrade promos
- [ ] Pomodoro timer is locked with "Upgrade to Pro" button

### PRO User Tests:
- [ ] Shows "PRO" badge in Account Status
- [ ] Dashboard HIDES Pro upgrade banner
- [ ] AI breakdown shows "X/200 this month"
- [ ] Can make 200 AI requests per month
- [ ] Extension popup shows "⭐ PRO" status
- [ ] Pomodoro timer is fully functional
- [ ] No upgrade prompts anywhere

---

## Stripe Test Payments (Optional)

If you want to test the actual Stripe checkout flow (without real money):

1. Make sure you're using **Stripe Test Mode** keys in `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_PRICE_ID=price_test_...
   ```

2. Click "Upgrade to Pro" on the dashboard
3. Use Stripe's test card numbers:
   - **Success:** `4242 4242 4242 4242`
   - **Decline:** `4000 0000 0000 0002`
   - Use any future expiry date (e.g., 12/34)
   - Use any 3-digit CVC (e.g., 123)
   - Use any ZIP code (e.g., 12345)

4. After successful payment:
   - Stripe webhook will trigger
   - User's `is_pro` will be set to `true`
   - Dashboard will update to show Pro features
   - Extension will show unlimited AI breakdowns

**Important:** Test mode payments don't charge real money!

---

## Troubleshooting

### "I'm seeing 3/3 instead of 5/5"

1. Check the API route at `/api/extension/ai-limit/route.ts` - it should have `DAILY_LIMIT = 5`
2. Clear your browser cache and reload the extension
3. Check Supabase `ai_request_log` table - delete old entries

### "Toggle button doesn't appear"

- Make sure `NODE_ENV=development` in your environment
- Check the browser console for errors
- Verify you're running on `localhost:3000`

### "Pro features still locked after toggling"

1. Close and reopen the Account Status modal
2. Reload the extension (chrome://extensions/ → reload)
3. Refresh the dashboard page
4. Check Supabase `user_progress` table - `is_pro` should be `true`

---

## Database Structure

For reference, here's what the database should have:

### `user_progress` table:
```sql
- user_id (text, primary key)
- is_pro (boolean) - FALSE for free, TRUE for pro
- stripe_customer_id (text) - Stripe customer ID
- stripe_subscription_id (text) - Stripe subscription ID
- pro_since (timestamptz) - When they became Pro
```

### `ai_request_log` table:
```sql
- id (bigint, primary key)
- user_id (text) - References user
- created_at (timestamptz) - When request was made
```

---

## Summary

1. **Use the purple toggle button** in the Account Status modal to instantly switch between Free and Pro
2. **Test all features** in both modes using the checklist above
3. **Verify limits** work correctly (5/day for free, unlimited for pro)
4. **Optional:** Test real Stripe checkout using test card numbers

No real payments needed! 🎉
