# User Synchronization System

This system ensures proper synchronization between Clerk (authentication) and Supabase (database), preventing duplicate users and ensuring complete cleanup when users are deleted.

## Overview

The user synchronization system consists of:

1. **Webhook Handler** (`/api/webhooks/clerk/route.ts`) - Automatically handles user creation/deletion events
2. **User Sync Manager** (`scripts/user-sync-manager.ts`) - Comprehensive CLI tool for managing user sync
3. **Database Policies** - Row Level Security (RLS) policies for data protection

## Tables Managed

The system manages these Supabase tables that contain user data:

- `tasks` - User's task list
- `user_progress` - User's progress tracking and mood data
- `daily_checkins` - Daily mood check-ins
- `moods` - Mood tracking data

## Webhook Events Handled

### User Creation (`user.created`)
- Creates a `user_progress` record for new users
- Prevents duplicate records by checking existing data first
- Handles webhook failures gracefully

### User Deletion (`user.deleted`)
- Deletes ALL user data from ALL tables
- Handles missing tables gracefully
- Provides detailed logging for debugging

## CLI Commands

### Analyze Current Status
```bash
npm run user-sync analyze
```
Generates a detailed report showing:
- Users properly synced between Clerk and Supabase
- Users missing progress records
- Orphaned data from deleted users
- Clerk-only users

### Fix Missing Progress Records
```bash
npm run user-sync fix-progress
```
Creates missing `user_progress` records for users who exist in Clerk but don't have progress data.

### Clean Up Orphaned Data
```bash
npm run user-sync cleanup
```
Removes all data for users who exist in Supabase but have been deleted from Clerk.

### Fix Duplicate Records
```bash
npm run user-sync fix-duplicates
```
Removes duplicate `user_progress` records, keeping the oldest one.

### Full Synchronization
```bash
npm run user-sync full-sync
```
Runs all fixes in sequence:
1. Analyzes current status
2. Creates missing progress records
3. Cleans up orphaned data
4. Removes duplicate records

## Database Policies

The system relies on these RLS policies for security:

```sql
-- Tasks table policies
CREATE POLICY "Users can delete own tasks" ON "public"."tasks"
AS PERMISSIVE FOR DELETE TO public
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own tasks" ON "public"."tasks"
AS PERMISSIVE FOR SELECT TO public
USING (auth.uid()::text = user_id);

-- User progress table policies
CREATE POLICY "Users can delete own progress" ON "public"."user_progress"
AS PERMISSIVE FOR DELETE TO public
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own progress" ON "public"."user_progress"
AS PERMISSIVE FOR SELECT TO public
USING (auth.uid()::text = user_id);
```

## Manual User Deletion

Users can delete their own accounts via the API endpoint `/api/user/delete`, which:
- Deletes all user data from all tables
- Provides detailed logging
- Handles errors gracefully

## Monitoring and Debugging

### Webhook Logs
Check your application logs for webhook events:
- `👤 Webhook: Creating user progress record for: {userId}`
- `🗑️ Webhook: Deleting user data for: {userId}`
- `✅ Webhook: User {userId} data cleanup completed`

### Sync Analysis
Run analysis to check system health:
```bash
npm run user-sync analyze
```

### Common Issues

1. **Missing Progress Records**
   - Cause: Webhook failed during user creation
   - Fix: `npm run user-sync fix-progress`

2. **Orphaned Data**
   - Cause: User deleted from Clerk but data remains in Supabase
   - Fix: `npm run user-sync cleanup`

3. **Duplicate Records**
   - Cause: Multiple webhook calls or manual data insertion
   - Fix: `npm run user-sync fix-duplicates`

## Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret
```

## Best Practices

1. **Regular Monitoring**: Run `npm run user-sync analyze` weekly to check system health
2. **Backup Before Cleanup**: Always backup data before running cleanup operations
3. **Test in Development**: Test all sync operations in development environment first
4. **Monitor Webhook Logs**: Keep an eye on webhook logs for any failures
5. **Use Full Sync**: Run `npm run user-sync full-sync` after major deployments

## Troubleshooting

### Webhook Not Working
1. Check `CLERK_WEBHOOK_SECRET` environment variable
2. Verify webhook endpoint URL in Clerk dashboard
3. Check application logs for errors

### Sync Script Fails
1. Verify all environment variables are set
2. Check network connectivity to Clerk and Supabase
3. Ensure proper permissions for database operations

### Data Inconsistencies
1. Run analysis to identify issues
2. Use specific fix commands rather than full sync
3. Check RLS policies are properly configured

## Security Considerations

- All operations respect Row Level Security (RLS) policies
- Users can only access their own data
- Webhook verification prevents unauthorized requests
- Sensitive operations are logged for audit purposes

## Performance Notes

- The sync manager fetches all data at once for analysis
- Large user bases may require pagination in future versions
- Database operations are batched where possible
- Parallel processing is used for deletions and creations


