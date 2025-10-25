# 🚀 Teyra Production Deployment Checklist

## ✅ Pre-Deployment Steps

### 1. **Database Migration** (CRITICAL)
Run this SQL in your **Supabase Production Database**:

```sql
-- Add AI scheduling usage tracking column
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS ai_schedule_uses INTEGER DEFAULT 0;

UPDATE user_progress
SET ai_schedule_uses = 0
WHERE ai_schedule_uses IS NULL;
```

### 2. **Environment Variables** (Vercel Dashboard)
Make sure ALL these are set in Vercel → Settings → Environment Variables:

#### Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your **production** Clerk key
- `CLERK_SECRET_KEY` - Your **production** Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

#### Database
- `NEXT_PUBLIC_SUPABASE_URL` - Your production Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your production Supabase anon key (safe to expose)
- `SUPABASE_SERVICE_ROLE_KEY` - Your production service role key (KEEP SECRET!)

#### Payment
- `STRIPE_SECRET_KEY` - Your **production** Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your production Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Your production webhook secret (get from Stripe dashboard)
- `STRIPE_PRICE_ID` - Your $10/month price ID from Stripe

#### AI & External Services
- `GROQ_API_KEY` - Your Groq API key (KEEP SECRET - do NOT use NEXT_PUBLIC prefix!)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - Google OAuth redirect URI (e.g., https://teyra.app/api/calendar/callback)

#### App URLs
- `NEXT_PUBLIC_APP_URL` - Your production domain (e.g., https://teyra.app)

#### Optional Services
- `RESEND_API_KEY` - For email notifications (if using Resend)
- `CRON_SECRET_KEY` - Secret for securing cron endpoints
- `CLERK_WEBHOOK_SECRET` - For Clerk webhooks (get from Clerk dashboard)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics ID (optional)

#### Firebase (if using push notifications)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `FIREBASE_PROJECT_ID` (server-side)
- `FIREBASE_PRIVATE_KEY` (server-side, KEEP SECRET!)
- `FIREBASE_CLIENT_EMAIL` (server-side)

### 3. **Clerk Configuration** (clerk.com dashboard)
1. Go to Clerk Dashboard → Your Production App
2. **Email Settings**:
   - Enable "Email" as sign-in method
   - Enable "Email verification"
   - **IMPORTANT**: Remove development domain restrictions
3. **Allowed Origins**:
   - Add your production domain (e.g., `https://teyra.app`)
4. **Redirect URLs**:
   - Add: `https://teyra.app/sign-in`
   - Add: `https://teyra.app/sign-up`
   - Add: `https://teyra.app/dashboard`

### 4. **Stripe Configuration** (stripe.com dashboard)
1. **Switch to Live Mode** (toggle in top right)
2. **Create Product**:
   - Name: "Teyra Pro"
   - Price: $10/month
   - Copy the Price ID → Set as `STRIPE_PRICE_ID` in Vercel
3. **Webhooks**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://teyra.app/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the webhook signing secret → Set as `STRIPE_WEBHOOK_SECRET` in Vercel

### 5. **Google OAuth Configuration**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create credentials (OAuth 2.0 Client ID)
3. **Authorized redirect URIs**:
   - Add: `https://teyra.app/api/calendar/callback`
   - Add: `https://teyra.app/dashboard/calendar`

### 6. **Supabase RLS Policies** (CRITICAL for security)
Make sure these RLS policies are enabled on your production database:

```sql
-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid()::text = user_id);

-- User progress policies
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Service role bypass (for API routes)
-- This allows service_role to bypass RLS
```

---

## 🚢 Deployment Steps

### 1. **Push to GitHub**
```bash
git add .
git commit -m "Production ready: Add AI scheduling, mobile warnings, and all pro features"
git push origin main
```

### 2. **Deploy to Vercel**
```bash
vercel --prod
```

OR use Vercel GitHub integration (auto-deploys on push to main)

### 3. **Verify Deployment**
- [ ] Visit your production URL
- [ ] Sign up with a new email (test full flow)
- [ ] Create a task
- [ ] Try AI scheduling (should work 3 times then show upgrade modal)
- [ ] Test payment flow (use Stripe test card: 4242 4242 4242 4242)
- [ ] Check calendar on mobile (should show warning popup)
- [ ] Verify Google Calendar integration works

---

## 🔧 Post-Deployment Configuration

### 1. **Vercel Cron Jobs** (for daily resets)
In `vercel.json` at your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-resets",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/daily-emails",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Then redeploy for cron jobs to activate.

### 2. **Domain Configuration** (if using custom domain)
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., teyra.app)
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Update Clerk, Stripe, and Google OAuth redirect URLs

---

## 🐛 Common Issues & Fixes

### "Only one email works in development"
**Problem**: Clerk limits development mode to specific emails.
**Solution**: In production with proper Clerk setup, ALL emails work.

### "Stripe webhook not working"
**Problem**: Webhook secret mismatch or wrong endpoint.
**Solution**:
1. Verify webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
2. Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. View Stripe webhook logs for errors

### "Google Calendar not connecting"
**Problem**: Redirect URI mismatch.
**Solution**: Add production URL to Google Cloud Console authorized redirects

### "Database queries failing"
**Problem**: RLS policies blocking service role.
**Solution**: Make sure service role key is set correctly (has RLS bypass)

### "Daily reset not happening"
**Problem**: Cron job not configured.
**Solution**: Add vercel.json with cron config, redeploy

---

## 📊 Monitoring

### Check These After Launch:

1. **Vercel Analytics** - Check for errors, performance
2. **Stripe Dashboard** - Monitor payments, subscriptions
3. **Supabase Dashboard** - Check database usage, query performance
4. **Clerk Dashboard** - Monitor user signups, authentication
5. **Groq Dashboard** - Monitor AI API usage and costs

---

## 🎉 You're Ready to Launch!

**Final Checklist:**
- [ ] All environment variables set in Vercel
- [ ] Database migration ran successfully
- [ ] Stripe webhooks configured and tested
- [ ] Clerk allows all emails (not just development)
- [ ] Google OAuth production credentials set
- [ ] RLS policies enabled on Supabase
- [ ] Cron jobs configured in vercel.json
- [ ] Test payment flow works end-to-end
- [ ] Mobile calendar warning shows on phone
- [ ] AI scheduling limits work (3 free → upgrade modal)

**Need Help?**
- Vercel: https://vercel.com/docs
- Stripe: https://stripe.com/docs
- Clerk: https://clerk.com/docs
- Supabase: https://supabase.com/docs

---

## 🔒 Security Notes

**NEVER commit these to Git:**
- `STRIPE_SECRET_KEY`
- `CLERK_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GROQ_API_KEY` (NO NEXT_PUBLIC prefix!)
- `GOOGLE_CLIENT_SECRET`
- `FIREBASE_PRIVATE_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET_KEY`

**Use environment variables in Vercel for ALL secrets!**

**IMPORTANT**: The Groq API key should be `GROQ_API_KEY`, NOT `NEXT_PUBLIC_GROQ_API_KEY`. The code currently has it wrong with the NEXT_PUBLIC prefix - this exposes your API key to the browser!
