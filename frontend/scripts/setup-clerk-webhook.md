# Clerk Webhook Setup Guide

## 🎯 **Purpose**
This webhook automatically deletes user data from Supabase when a user is deleted from Clerk, preventing orphaned data.

## 🔧 **Setup Steps**

### 1. **Get Your Webhook Secret**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** in the sidebar
3. Click **Add Endpoint**
4. Set the endpoint URL to: `https://your-domain.com/api/webhooks/clerk`
5. Select these events:
   - ✅ `user.created`
   - ✅ `user.updated` 
   - ✅ `user.deleted`
6. Copy the **Signing Secret** (starts with `whsec_`)

### 2. **Add Environment Variable**
Add this to your `.env.local`:
```
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. **Deploy Your App**
The webhook endpoint is now ready at `/api/webhooks/clerk`

## 🧪 **Testing the Webhook**

### Test User Deletion:
1. Create a test user in Clerk
2. Add some tasks for that user in your app
3. Delete the user from Clerk Dashboard
4. Check your app logs - you should see:
   ```
   📡 Clerk webhook received: user.deleted
   🗑️ User deleted from Clerk: user_xxx
   🗄️ Cleaning up user data from Supabase...
   ✅ Tasks deleted for user: user_xxx
   ✅ User stats deleted for user: user_xxx
   ✅ User data cleanup completed for: user_xxx
   ```

### Verify Data Cleanup:
1. Check your Supabase database
2. Confirm that all tasks and user_stats for the deleted user are gone

## 🔍 **Manual Cleanup (If Needed)**

If you have existing orphaned data, run this SQL in Supabase:

```sql
-- Find orphaned user_stats (users that don't exist in Clerk)
SELECT us.userId, us.email 
FROM user_stats us 
WHERE us.userId NOT IN (
  -- You'll need to manually check these against Clerk
  SELECT 'user_xxx' -- Replace with actual Clerk user IDs
);

-- Delete orphaned data (BE CAREFUL!)
DELETE FROM tasks WHERE userId NOT IN (SELECT userId FROM user_stats);
DELETE FROM user_stats WHERE userId NOT IN (
  -- List of valid Clerk user IDs
  SELECT 'user_xxx' -- Replace with actual Clerk user IDs
);
```

## 🚨 **Important Notes**

- **Backup First**: Always backup your database before running cleanup scripts
- **Test Environment**: Test the webhook in development first
- **Monitoring**: Monitor webhook logs for any failures
- **Fallback**: Keep the manual cleanup script as a backup

## 🔄 **Webhook Events Handled**

- `user.deleted` → Deletes all user data from Supabase
- `user.created` → Logs the event (no action needed)
- `user.updated` → Logs the event (no action needed)

## 📊 **Benefits**

✅ **Automatic cleanup** - No orphaned data  
✅ **GDPR compliance** - Complete user data deletion  
✅ **Database hygiene** - Keeps your database clean  
✅ **Scalable** - Works for any number of users  
✅ **Secure** - Verified webhook signatures 