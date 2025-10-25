# 🤖 AI Limits System - Server-Side Implementation

## Overview
The AI limits system tracks usage **server-side** in Supabase, NOT locally. It resets daily at midnight UTC and enforces:
- **Free users**: 5 AI tasks per day
- **Pro users**: Unlimited AI tasks (as long as subscription is active)

---

## 🗄️ Database Schema

### Table: `ai_request_log`
Stores every AI request made by users.

```sql
CREATE TABLE ai_request_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  request_type TEXT DEFAULT 'text_to_task',
  is_pro BOOLEAN DEFAULT FALSE
);

-- Index for fast queries
CREATE INDEX idx_ai_request_user_date ON ai_request_log (user_id, created_at);
```

### Table: `user_progress`
Stores user Pro status.

```sql
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS pro_since TIMESTAMP WITH TIME ZONE;
```

---

## 🔄 How It Works

### 1. User Makes AI Request (Extension or Website)

**Extension** calls:
```javascript
POST /api/extension/ai-limit
```

**Flow**:
1. ✅ Server checks user's Pro status from `user_progress` table
2. ✅ If **Pro user** → Allow request, log it, return unlimited
3. ✅ If **Free user** → Count requests from TODAY (midnight UTC to now)
4. ✅ If count < 5 → Allow request, log it, return remaining
5. ✅ If count >= 5 → Deny request, return error

**Response (Free user with 2 used)**:
```json
{
  "allowed": true,
  "isPro": false,
  "used": 2,
  "remaining": 3,
  "limit": 5,
  "message": "AI request allowed"
}
```

**Response (Free user at limit)**:
```json
{
  "allowed": false,
  "isPro": false,
  "used": 5,
  "remaining": 0,
  "limit": 5,
  "message": "Daily limit reached. Upgrade to Pro for unlimited AI tasks!"
}
```

**Response (Pro user)**:
```json
{
  "allowed": true,
  "isPro": true,
  "used": 47,
  "remaining": 999999,
  "limit": 999999,
  "message": "Pro user - unlimited"
}
```

---

## ⏰ Daily Reset - Automatic (NO Cron Needed!)

### How Reset Works:

The system **automatically resets daily** because queries are **date-filtered**:

```sql
SELECT COUNT(*) FROM ai_request_log
WHERE user_id = $1
AND created_at >= CURRENT_DATE  -- Only counts TODAY's requests!
AND created_at < CURRENT_DATE + INTERVAL '1 day'
```

**Magic**:
- At 00:00:00 UTC, `CURRENT_DATE` changes to the new day
- Queries automatically exclude yesterday's requests
- No cron job needed!
- No manual cleanup required!

### Optional Cleanup Cron (for old data)

If you want to delete old logs (>30 days) to save space:

```sql
-- Run weekly via Supabase Cron or Vercel Cron
DELETE FROM ai_request_log
WHERE created_at < NOW() - INTERVAL '30 days';
```

This is **optional** - the system works without it.

---

## 💳 Pro Subscription Flow

### When User Upgrades to Pro:

**Stripe Webhook** (`checkout.session.completed`):
```javascript
// /api/stripe/webhook/route.ts
await supabase
  .from('user_progress')
  .upsert({
    user_id: userId,
    is_pro: true,
    stripe_subscription_id: session.subscription,
    pro_since: new Date().toISOString()
  });
```

**Effect**:
- ✅ `is_pro` set to `true`
- ✅ All API endpoints immediately see Pro status
- ✅ Extension shows "∞ unlimited"
- ✅ AI requests no longer count against limit

### When Subscription Ends (Cancelled or Failed Payment):

**Stripe Webhook** (`customer.subscription.deleted`):
```javascript
await supabase
  .from('user_progress')
  .update({
    is_pro: false,
    stripe_subscription_id: null
  })
  .eq('user_id', userId);
```

**Effect**:
- ✅ `is_pro` set to `false`
- ✅ User goes back to 5/day limit
- ✅ Limit resets at midnight UTC (they get 5 fresh requests next day)

---

## 📍 API Endpoints

### POST /api/extension/ai-limit
**Purpose**: Check and consume one AI request

**Request**:
```javascript
POST /api/extension/ai-limit
Authorization: Bearer <jwt_token>
```

**Implementation**:
```typescript
// /api/extension/ai-limit/route.ts
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  // 1. Check Pro status
  const { data: user } = await supabase
    .from('user_progress')
    .select('is_pro')
    .eq('user_id', userId)
    .single();

  const isPro = user?.is_pro || false;

  // 2. If Pro, allow unlimited
  if (isPro) {
    await supabase.from('ai_request_log').insert({
      user_id: userId,
      is_pro: true
    });

    return NextResponse.json({
      allowed: true,
      isPro: true,
      remaining: 999999,
      limit: 999999
    });
  }

  // 3. Count today's requests
  const { count } = await supabase
    .from('ai_request_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date().toISOString().split('T')[0]); // Today

  const used = count || 0;

  // 4. Check limit
  if (used >= 5) {
    return NextResponse.json({
      allowed: false,
      isPro: false,
      used: 5,
      remaining: 0,
      limit: 5,
      message: 'Daily limit reached'
    }, { status: 429 });
  }

  // 5. Log request and allow
  await supabase.from('ai_request_log').insert({
    user_id: userId,
    is_pro: false
  });

  return NextResponse.json({
    allowed: true,
    isPro: false,
    used: used + 1,
    remaining: 5 - (used + 1),
    limit: 5
  });
}
```

### GET /api/extension/ai-limit
**Purpose**: Check remaining requests without consuming

**Returns**:
```json
{
  "isPro": false,
  "used": 3,
  "remaining": 2,
  "limit": 5
}
```

---

## 🎯 Key Points

### ✅ NO Local Storage for Limits
- **Never** store AI usage locally
- Always fetch from server
- Prevents cheating (clearing extension storage)
- Works across devices (same account, same limits)

### ✅ NO Cron Jobs Needed
- Daily reset happens automatically via SQL date filtering
- No scheduled jobs required
- No maintenance needed

### ✅ Stripe Integration
- Webhook updates `is_pro` status automatically
- Monthly payment = unlimited for that month
- Subscription ends = back to 5/day
- Immediate effect (no delay)

### ✅ Works Everywhere
- Extension: Calls `/api/extension/ai-limit`
- Website: Calls same endpoint
- Limits shared across all platforms
- One source of truth: Supabase

---

## 🧪 Testing

### Test Free User Limit:
1. Make 5 AI requests → Should all succeed
2. Make 6th request → Should fail with 429 error
3. Wait until next day (00:00 UTC)
4. Make request → Should succeed again (reset!)

### Test Pro User:
1. Upgrade to Pro via Stripe
2. Make 100 AI requests → All should succeed
3. Cancel subscription
4. Make request next day → Should be limited to 5/day again

### Test Stripe Webhooks:
1. Use Stripe CLI to forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
2. Complete test payment
3. Check database: `is_pro` should be `true`
4. Cancel subscription
5. Check database: `is_pro` should be `false`

---

## 📊 Monitoring

### Check User's Usage:
```sql
-- Total requests today
SELECT COUNT(*) FROM ai_request_log
WHERE user_id = 'user_xxx'
AND created_at >= CURRENT_DATE;

-- Last 10 requests
SELECT * FROM ai_request_log
WHERE user_id = 'user_xxx'
ORDER BY created_at DESC
LIMIT 10;
```

### Check All Users' Usage:
```sql
-- Users who hit limit today
SELECT user_id, COUNT(*) as requests
FROM ai_request_log
WHERE created_at >= CURRENT_DATE
GROUP BY user_id
HAVING COUNT(*) >= 5;
```

---

## 🚨 Error Handling

### Extension Fallback:
If API call fails, extension uses **local storage** as fallback:
```javascript
// content.js
try {
  const response = await fetch('/api/extension/ai-limit', { method: 'POST' });
  const data = await response.json();

  if (!data.allowed) {
    showUpgradePrompt();
    return;
  }
} catch (error) {
  // Fallback to local storage (works offline)
  return await checkLocalLimit();
}
```

**Local fallback**:
- Only used when server unreachable
- Still enforces 5/day limit
- Resets at midnight browser time
- **Not the source of truth** (server is!)

---

## Summary

✅ **Server-side tracking** in Supabase
✅ **Automatic daily reset** at midnight UTC
✅ **No cron jobs needed** (date-filtered queries)
✅ **Stripe integration** for Pro status
✅ **Works across devices** (same account)
✅ **Immediate Pro activation** (webhook-driven)
✅ **Fallback to local** (when offline)

The system is **production-ready** and **maintenance-free**! 🎉
