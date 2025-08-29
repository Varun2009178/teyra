# Webhook Debugging Steps

## Step 1: Check Clerk Webhook Configuration

1. Go to your **Clerk Dashboard**
2. Navigate to **Webhooks** in the sidebar
3. Check if you have a webhook configured for your app
4. The webhook should:
   - **URL**: `https://your-domain.com/api/webhooks/clerk`
   - **Events**: Make sure `user.deleted` is checked ✅
   - **Status**: Should be "Active"

## Step 2: Test if Webhook Endpoint is Reachable

Run this command to test if your webhook endpoint is working:

```bash
curl -X GET https://your-domain.com/api/test-webhook
```

Expected response:
```json
{
  "message": "Test webhook endpoint is working",
  "timestamp": "2024-...",
  "environment": {
    "hasWebhookSecret": true,
    "hasSupabaseUrl": true,
    "hasSupabaseServiceKey": true
  }
}
```

## Step 3: Check Environment Variables

Make sure these are set in your deployment environment:

```bash
CLERK_WEBHOOK_SECRET=whsec_...  # From Clerk Dashboard → Webhooks → Your Webhook → Signing Secret
SUPABASE_SERVICE_ROLE_KEY=sb-...  # From Supabase Dashboard → Settings → API → service_role secret
NEXT_PUBLIC_SUPABASE_URL=https://...  # Your Supabase project URL
```

## Step 4: Test Webhook Manually

If you have a webhook configured, you can test it by:

1. Creating a test user account
2. Deleting it
3. Checking your deployment logs (Vercel, Railway, etc.) for webhook activity

## Step 5: Manual Cleanup (Temporary Fix)

If webhook isn't working, you can manually clean up the orphaned data:

```bash
# Check what data exists for your deleted user
npx tsx scripts/test-user-cleanup.ts check user_XXXXXXX

# Clean it up
npx tsx scripts/test-user-cleanup.ts cleanup user_XXXXXXX
```

## Common Issues:

### Issue 1: No Webhook Configured
**Solution**: Add webhook in Clerk Dashboard

### Issue 2: Wrong Webhook URL
**Solution**: Make sure URL points to your deployed app, not localhost

### Issue 3: Webhook Secret Mismatch
**Solution**: Copy exact secret from Clerk Dashboard to environment variables

### Issue 4: Events Not Selected
**Solution**: Make sure `user.deleted` event is checked in Clerk webhook config

### Issue 5: Webhook Failing Silently
**Solution**: Check deployment logs for error messages

## Quick Test Commands:

```bash
# Test if endpoint exists
curl https://your-domain.com/api/test-webhook

# Check user data in database
npx tsx scripts/test-user-cleanup.ts check YOUR_USER_ID

# Manual cleanup if needed
npx tsx scripts/test-user-cleanup.ts cleanup YOUR_USER_ID
```