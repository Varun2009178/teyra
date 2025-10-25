# 🚀 Quick Production Deployment Guide

## TL;DR - Get Live in 30 Minutes

### Step 1: Database (5 min)
Go to Supabase → SQL Editor → Run this:
```sql
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS ai_schedule_uses INTEGER DEFAULT 0;
UPDATE user_progress SET ai_schedule_uses = 0 WHERE ai_schedule_uses IS NULL;
```

### Step 2: Clerk Setup (5 min)
1. Go to clerk.com → Your app → Production
2. **Remove email restrictions** (Settings → Email)
3. Add redirect URLs:
   - `https://yourdomain.com/sign-in`
   - `https://yourdomain.com/sign-up`
   - `https://yourdomain.com/dashboard`

### Step 3: Stripe Live Mode (10 min)
1. Switch to **Live Mode** (top right toggle)
2. Create product: "Teyra Pro" - $10/month
3. Copy Price ID → Vercel env: `STRIPE_PRICE_ID`
4. Add webhook: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`
5. Copy webhook secret → Vercel env: `STRIPE_WEBHOOK_SECRET`

### Step 4: Vercel Environment Variables (5 min)
Add these in Vercel Dashboard → Settings → Environment Variables:

**MUST CHANGE FOR PRODUCTION:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx (your LIVE key!)
CLERK_SECRET_KEY=sk_live_xxx (your LIVE key!)
STRIPE_SECRET_KEY=sk_live_xxx (your LIVE key!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx (your LIVE key!)
STRIPE_WEBHOOK_SECRET=whsec_xxx (from webhook setup)
STRIPE_PRICE_ID=price_xxx (from product creation)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Keep from development:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
NEXT_PUBLIC_GROQ_API_KEY=gsk_xxx
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
```

### Step 5: Deploy (5 min)
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

Vercel will auto-deploy if connected to GitHub.

---

## ✅ Post-Deploy Testing

### Test These Features:
1. ✅ Sign up with NEW email (should work - not limited like dev)
2. ✅ Create tasks
3. ✅ AI scheduling (3 free uses → upgrade modal)
4. ✅ Payment (use test card: `4242 4242 4242 4242`)
5. ✅ Calendar on mobile (should show "best viewed on desktop" popup)
6. ✅ Google Calendar sync

---

## 🔥 Common "It's Not Working!" Fixes

### Clerk: "Can't sign up with my email"
**Fix**: Go to Clerk dashboard → remove development restrictions

### Stripe: "Payment succeeded but user not upgraded"
**Fix**: Check webhook is configured correctly, secret matches

### "Calendar not loading"
**Fix**: Check Google OAuth redirect URIs include production domain

### "Daily reset not happening"
**Fix**: Add `vercel.json` with cron config (see full checklist)

---

## 🎯 The ONE Thing You MUST Do

**Switch Clerk, Stripe to LIVE MODE and update all environment variables!**

Development keys (pk_test_, sk_test_) don't work in production.
You need pk_live_ and sk_live_ keys.

---

**Full details**: See `PRODUCTION_DEPLOYMENT_CHECKLIST.md`
