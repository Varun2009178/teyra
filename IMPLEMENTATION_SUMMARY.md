# Teyra Implementation Summary

## ✅ What Was Added

### 1. AI Task Parser (Web App)
- **Location:** `/components/AITaskParser.tsx`
- **Features:**
  - Clean, Notion-style UI with all lowercase text
  - Paste emails/messages/notes and extract tasks
  - Individual task adding (Plus button) or bulk add all
  - Edit/delete tasks before adding
  - Keyboard shortcuts (Enter to save, Escape to cancel)

### 2. Chrome Extension AI Integration
- **Location:** `/chrome-extension/background.js`
- **Update:** Now uses the same AI parse endpoint as web app
- **Behavior:** When user highlights text, it parses into multiple actionable tasks
- **Note:** Extension submitted to store, so changes won't affect current submission

### 3. Referral Tracking System
- **Files Created:**
  - `/lib/referral.ts` - Core referral logic
  - `/components/ReferralTracker.tsx` - Client-side tracker

- **How It Works:**
  ```
  User clicks: https://teyra.app?ref=ABC123
  → Cookie stored for 30 days
  → User signs up (could be weeks later)
  → getReferralCode() retrieves it
  → Save to database with user
  → Credit referrer when user upgrades to Pro
  ```

- **Cookie Details:**
  - Name: `teyra_ref`
  - Expires: 30 days
  - Path: `/`
  - SameSite: `Lax`

---

## 🔧 How to Use

### Get User's Referral Link
```typescript
import { getReferralLink } from '@/lib/referral';

const refLink = getReferralLink(user.id);
// Returns: https://teyra.app?ref=ABC123XY
```

### Track Referral on Signup
```typescript
import { getReferralCode, clearReferralCode } from '@/lib/referral';

// When user signs up
const refCode = getReferralCode(); // Gets code from cookie

if (refCode) {
  await db.users.create({
    id: newUserId,
    email: email,
    referred_by: refCode, // Store who referred them
    // ...
  });

  clearReferralCode(); // Clear cookie after using it
}
```

### Credit Referrer on Upgrade
```typescript
// When user upgrades to Pro
const user = await db.users.findOne({ id: userId });

if (user.referred_by) {
  // Find the referrer
  const referrer = await db.users.findOne({
    where: { /* match referral code to user */ }
  });

  // Credit them
  await db.referrals.create({
    referrer_id: referrer.id,
    referred_user_id: userId,
    reward_amount: 10.00, // Your commission
    created_at: new Date()
  });
}
```

---

## 📊 Database Schema Needed

### Add to `users` table:
```sql
ALTER TABLE users ADD COLUMN referred_by VARCHAR(255);
```

### Create `referrals` table:
```sql
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_id VARCHAR(255) NOT NULL,
  referred_user_id VARCHAR(255) NOT NULL,
  reward_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  paid_out BOOLEAN DEFAULT FALSE
);
```

---

## 🔐 Stripe Subscription Management

### Webhook Endpoint Needed
Create `/api/stripe/webhook` to listen for:

1. **`customer.subscription.updated/deleted`**
   - Update `is_pro` status
   - Update `subscription_end_date`

2. **`invoice.payment_succeeded`**
   - Keep Pro active
   - Extend subscription_end_date

3. **`invoice.payment_failed`**
   - Disable Pro immediately
   - Send email to user

### Example Webhook Handler:
```typescript
import Stripe from 'stripe';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get('stripe-signature')!;

  let event = stripe.webhooks.constructEvent(
    await req.text(),
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      await db.users.update({
        where: { stripe_customer_id: invoice.customer },
        data: {
          is_pro: true,
          subscription_end_date: new Date(invoice.period_end * 1000)
        }
      });
      break;

    case 'invoice.payment_failed':
      await db.users.update({
        where: { stripe_customer_id: invoice.customer },
        data: { is_pro: false }
      });
      break;
  }

  return Response.json({ received: true });
}
```

### Protect Pro Features:
```typescript
// Before any Pro feature
const { isPro } = await fetch('/api/subscription/status').then(r => r.json());

if (!isPro) {
  toast.error('Upgrade to Pro');
  return;
}

// ... Pro feature code
```

---

## 📝 Privacy Policy Updates Needed

Add this section to your privacy policy:

```markdown
## Cookies

We use cookies to enhance your experience and track referrals:

### Referral Tracking Cookie
- **Name:** teyra_ref
- **Purpose:** Track referral links to credit users who refer friends
- **Duration:** 30 days
- **Type:** First-party cookie
- **Data Stored:** Referral code (alphanumeric identifier)

You can disable cookies in your browser settings, but this may affect
referral tracking functionality.
```

---

## 🚀 Testing Checklist

### AI Task Parser
- [ ] Click sparkles button on dashboard
- [ ] Paste email with multiple tasks
- [ ] Verify tasks are extracted correctly
- [ ] Test individual task adding (Plus button)
- [ ] Test bulk adding all tasks
- [ ] Verify tasks appear on dashboard

### Chrome Extension
- [ ] Highlight text on any webpage
- [ ] Right-click → "Add to Teyra"
- [ ] Verify multiple tasks are created
- [ ] Check tasks sync to web dashboard

### Referral Tracking
- [ ] Visit https://teyra.app?ref=TEST123
- [ ] Check cookie is set (DevTools → Application → Cookies)
- [ ] Sign up with new account
- [ ] Verify referral code is stored in database
- [ ] Upgrade to Pro
- [ ] Verify referrer gets credited

### Stripe Webhooks
- [ ] Set up webhook URL in Stripe dashboard
- [ ] Test with Stripe CLI: `stripe trigger invoice.payment_succeeded`
- [ ] Verify Pro status updates correctly
- [ ] Test payment failure: `stripe trigger invoice.payment_failed`
- [ ] Verify Pro gets disabled

---

## 🐛 Known Issues

### "Failed to add task" error (FIXED)
- **Issue:** Toast showed error even when task was added
- **Fix:** Added proper error handling and delay before refresh
- **Status:** ✅ Resolved

### Chrome Extension Submitted
- **Note:** Extension is in review, changes won't affect current submission
- **Next Steps:** After approval, can update with AI improvements

---

## 📞 Support

Questions? Check:
1. Code comments in each file
2. Stripe documentation: https://stripe.com/docs/webhooks
3. Cookie documentation: https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
