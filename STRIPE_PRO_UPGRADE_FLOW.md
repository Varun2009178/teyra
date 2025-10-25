# 🎉 Teyra Pro Upgrade Flow - Complete Guide

## Overview
This document explains how the Stripe Pro upgrade system works in Teyra, both in **test mode** (sandbox) and **production mode**.

---

## 🔄 The Complete Flow

### 1. **User Clicks "Upgrade to Pro"**
- Location: Dashboard or Chrome Extension
- Triggers: `handleUpgrade()` function in dashboard

### 2. **Create Stripe Checkout Session**
- API: `POST /api/stripe/checkout`
- Creates a Stripe Checkout Session with:
  - Your product/price ID
  - Success URL: `/dashboard?pro_welcome=true&session_id={CHECKOUT_SESSION_ID}&upgrade=success`
  - Cancel URL: `/dashboard?upgrade=cancelled`
  - User metadata (userId from Clerk)

### 3. **Redirect to Stripe**
- User is sent to Stripe's hosted checkout page
- They enter payment details (test card in sandbox)
- Stripe processes the payment

### 4. **User Returns to Dashboard**
- After payment, Stripe redirects to success URL
- Dashboard detects the `pro_welcome=true` and `session_id` parameters

### 5. **Verify & Activate Pro**
- Dashboard calls `POST /api/stripe/verify-session` with session ID
- Server retrieves session from Stripe API
- If payment is successful → Update database:
  ```sql
  UPDATE user_progress
  SET is_pro = true,
      stripe_customer_id = '...',
      stripe_subscription_id = '...',
      pro_since = NOW()
  WHERE user_id = 'user_xxx'
  ```

### 6. **Show Celebration Modal**
- Confetti animation fires 🎊
- Pro Welcome Modal displays all features
- User can close and start using Pro features immediately

---

## 🧪 Test Mode vs Production Mode

### **Test Mode (Sandbox)**
- Use test card: `4242 4242 4242 4242` (any future date, any CVC)
- Webhook events might not fire automatically
- **Solution**: Manual verification endpoint `/api/stripe/verify-session`
  - Checks session status directly with Stripe API
  - Updates database immediately on success
  - No waiting for webhooks!

### **Production Mode**
- Real credit cards only
- Webhooks fire reliably
- Backup verification still happens for safety

---

## 🎯 Key Files

### Backend APIs
1. **`/api/stripe/checkout/route.ts`**
   - Creates Stripe checkout session
   - Returns session URL for redirect

2. **`/api/stripe/verify-session/route.ts`** ⭐ NEW
   - Verifies payment was successful
   - Updates user to Pro status in database
   - Returns Pro status confirmation

3. **`/api/stripe/webhook/route.ts`**
   - Handles Stripe webhook events:
     - `checkout.session.completed` → Mark user as Pro
     - `customer.subscription.updated` → Update Pro status
     - `customer.subscription.deleted` → Remove Pro status

4. **`/api/subscription/status/route.ts`**
   - Returns current Pro status
   - Used by dashboard and extension

### Frontend Components
1. **`dashboard/page.tsx`**
   - `checkProUpgrade()` function handles return from Stripe
   - Calls verify-session API
   - Shows Pro Welcome Modal

2. **`ProWelcomeModal.tsx`**
   - Animated modal with confetti 🎊
   - Lists all Pro features
   - Purple/pink gradient theme

3. **`ProBadgeDropdown.tsx`**
   - Shows "PRO" badge in navbar
   - Dropdown with Pro features and settings

---

## 🛠️ Setup Checklist

### Environment Variables (.env.local)
```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxx  # or sk_live_xxxxx for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Stripe Product/Price ID
STRIPE_PRICE_ID=price_xxxxx  # Your subscription price ID

# Webhook Secret (for production)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://teyra.app
```

### Database Schema
Ensure `user_progress` table has these columns:
```sql
CREATE TABLE user_progress (
  user_id TEXT PRIMARY KEY,
  is_pro BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  pro_since TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Stripe Dashboard Setup
1. **Create Product**: "Teyra Pro"
2. **Create Price**: $10/month recurring
3. **Copy Price ID** → Add to `.env.local`
4. **Enable Test Mode** for development
5. **Setup Webhook** (production only):
   - Endpoint: `https://teyra.app/api/stripe/webhook`
   - Events to listen:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

---

## 🧪 Testing the Flow

### Test Card Numbers
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC (e.g., 123)

### Test Steps
1. Click "Upgrade to Pro" on dashboard
2. Use test card `4242 4242 4242 4242`
3. Complete checkout
4. Should redirect to dashboard
5. See confetti and "Welcome to Pro!" modal 🎊
6. Close modal and verify:
   - "PRO" badge appears in navbar
   - Extension shows Pro features unlocked
   - AI usage shows "∞ unlimited"

---

## 🐛 Troubleshooting

### Issue: "Payment successful but not Pro"
**Cause**: Webhook didn't fire or verify-session API failed

**Solution**:
1. Check browser console for errors
2. Check server logs: `npm run dev`
3. Manually verify in database:
   ```sql
   SELECT is_pro, stripe_subscription_id FROM user_progress WHERE user_id = 'user_xxx';
   ```
4. If needed, manually update:
   ```sql
   UPDATE user_progress SET is_pro = true WHERE user_id = 'user_xxx';
   ```

### Issue: "Confetti not showing"
**Cause**: Modal opens too fast before confetti package loads

**Solution**: Already handled with 800ms delay in dashboard code

### Issue: "Extension not detecting Pro"
**Cause**: Extension needs to refresh Pro status

**Solution**:
1. Close and reopen extension
2. Pro status is fetched from `/api/user/pro-status`
3. Check that API returns `isPro: true`

---

## 🚀 Production Deployment

### Before Going Live:
1. ✅ Replace test keys with live keys in `.env.local`
2. ✅ Create live product and price in Stripe dashboard
3. ✅ Update `STRIPE_PRICE_ID` with live price
4. ✅ Setup live webhook endpoint
5. ✅ Test with real (small amount) transaction
6. ✅ Verify webhook events are received
7. ✅ Test subscription cancellation flow

### Monitoring:
- Check Stripe Dashboard → Events for webhook delivery
- Monitor application logs for errors
- Set up alerts for failed payments

---

## 💡 Pro Features Unlocked

When user upgrades to Pro, they get:
- ✨ **Unlimited AI Text → Task** (vs 5/day free)
- 🎯 **Custom Focus Mode** (block any websites)
- ⏱️ **Pomodoro Timer** (built-in focus sessions)
- ⚡ **Priority Support** (faster response times)

---

## 📝 Notes

- Verification endpoint is **idempotent** - safe to call multiple times
- Database updates use `UPSERT` to handle existing users
- Webhook still processes in background for redundancy
- Extension polls Pro status every time it opens
- Pro status is cached locally in extension for performance

