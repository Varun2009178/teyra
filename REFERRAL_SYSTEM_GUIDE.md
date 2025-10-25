# 🎯 Teyra Referral System - Creator Commission Tracking

## How It Works

Creators get unique referral links that automatically track conversions in Stripe.

---

## For Creators: Custom Referral Links

Give each creator their own link in this format:

```
https://teyra.app/upgrade?ref=CREATOR_NAME
```

### Example Creator Links:

- **John's link:** `https://teyra.app/upgrade?ref=john`
- **Sarah's link:** `https://teyra.app/upgrade?ref=sarah`
- **Alex's link:** `https://teyra.app/upgrade?ref=alex`

**What happens:**
1. User clicks creator's link
2. Referral code is stored automatically
3. User signs in (or signs up)
4. User upgrades to Pro
5. Referral is tracked in Stripe

---

## Tracking Referral Conversions

### Option 1: Check Stripe Dashboard (Easiest)

1. Go to: https://dashboard.stripe.com/subscriptions
2. Click on any subscription
3. Scroll to **"Metadata"** section
4. You'll see: `referralCode: john` (or whatever the creator's code was)

### Option 2: Check Server Logs

When a referred user subscribes, you'll see in your logs:

```
🎯 REFERRAL CONVERSION: {
  referralCode: 'john',
  userId: 'user_abc123',
  subscriptionId: 'sub_xyz789',
  amount: 10,
  timestamp: '2025-10-25T...'
}
```

### Option 3: Export Data from Stripe

1. Go to: https://dashboard.stripe.com/subscriptions
2. Click **"Export"**
3. Download CSV with all subscriptions
4. Filter by `metadata.referralCode` column
5. Count conversions per creator

---

## Commission Calculation

**Example:**
- **Commission rate:** 20% of first month ($2 per subscription)
- **John referred:** 15 users
- **John's commission:** 15 × $2 = **$30**

### To Calculate:

1. Export Stripe subscriptions (see Option 3 above)
2. Filter by referral code
3. Count unique subscriptions
4. Multiply by your commission rate

---

## Payment Schedule for Creators

**Suggested payment cadence:**
- Pay out monthly on the 1st
- Calculate total conversions from previous month
- Send payment via PayPal/Venmo/etc.

---

## Testing the System

**Test it yourself:**

1. Open incognito/private browser
2. Go to: `https://teyra.app/upgrade?ref=TEST`
3. Sign up for a new account
4. Subscribe (use test card: `4242 4242 4242 4242`)
5. Check Stripe Dashboard → subscription should have `referralCode: TEST`

---

## Custom Creator Codes

Keep creator codes:
- **Short** (5-15 characters)
- **Lowercase** (easier to type)
- **No spaces** (use hyphens if needed)

**Good examples:**
- `john`
- `sarah-smith`
- `alex-tech`

**Bad examples:**
- `John Smith` (has space)
- `ThisIsAReallyLongCreatorName` (too long)
- `john_smith_2024_v2` (too complex)

---

## FAQ

**Q: Can one user be referred by multiple creators?**
A: No - only the first referral code they use is tracked.

**Q: What if a user doesn't use a referral link?**
A: No referral code is stored - they just see no `referralCode` in Stripe metadata.

**Q: Can creators see their own stats?**
A: Not automatically - you'll need to manually share stats with them (or build a creator dashboard later).

**Q: What if a creator shares multiple links?**
A: As long as they all use the same `ref=THEIR_NAME`, they'll all be tracked to them.

---

## Next Steps (Optional Improvements)

1. **Create a creator dashboard** where they can see their own stats
2. **Automate payouts** using Stripe Connect
3. **Add tiered commissions** (more referrals = higher commission rate)
4. **Track lifetime value** (commission on recurring payments, not just first month)

For now, this simple system lets you start tracking referrals immediately!
