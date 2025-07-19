# Production Issues Guide

## 🚨 Common Production vs Local Differences

### 1. **Environment Variables**
**Issue**: Using `NEW_SUPABASE_SERVICE_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`
- **Local**: ✅ Should use `NEW_SUPABASE_SERVICE_KEY`
- **Production**: ✅ Should use `NEW_SUPABASE_SERVICE_KEY`

**Fix**: Ensure your `.env.local` has:
```bash
NEW_SUPABASE_SERVICE_KEY=your_service_role_key_here
```

### 2. **Database Schema Differences**
**Issue**: Production database might not have the latest migrations applied

**Check**: Run migrations on production database:
```bash
# In production environment
npx supabase db push
```

**Key Migrations to Verify**:
- `011_fix_created_at_columns.sql` - Renames `created_at` to `createdAt`
- `012_add_missing_task_columns.sql` - Adds `expired`, `completedAt`, `assignedDate`
- `013_fix_updated_at_trigger.sql` - Fixes trigger function

### 3. **Authentication Setup**
**Issue**: Clerk authentication might be configured differently

**Check**:
- Production Clerk project settings
- Redirect URLs configured correctly
- Webhook endpoints set up

### 4. **Row Level Security (RLS)**
**Issue**: RLS policies might be different or missing

**Check**: Verify RLS policies in production:
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_stats', 'tasks');

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('user_stats', 'tasks');
```

### 5. **API Routes**
**Issue**: API routes might not be deployed or configured correctly

**Check**:
- `/api/daily-reset` - Daily reset functionality
- `/api/cron` - Cron job endpoints
- `/api/send-email` - Email functionality

## 🔧 Quick Fixes

### For New User Issues:
1. **Check if user stats are being created**:
   ```typescript
   // In browser console
   console.log('User stats:', userStats)
   console.log('Is new user:', isNewUser)
   ```

2. **Force onboarding modal**:
   ```typescript
   // Temporarily force onboarding
   setOnboardingModalOpen(true)
   ```

### For Task Creation Issues:
1. **Check database connection**:
   ```typescript
   // In browser console
   console.log('Supabase client:', supabase)
   ```

2. **Test task creation manually**:
   ```typescript
   // In browser console
   const { data, error } = await supabase
     .from('tasks')
     .insert([{ userId: 'test', title: 'test task' }])
     .select()
   console.log('Task creation result:', { data, error })
   ```

## 🧪 Testing Scripts

### Run Production Environment Test:
```bash
npx tsx scripts/test-production-differences.ts
```

### Run Database Schema Test:
```bash
npx tsx scripts/test-database-schema.ts
```

### Test Current User:
```bash
npx tsx scripts/test-current-user.ts
```

## 📱 Mobile Optimization

### Current Mobile Improvements:
- ✅ Responsive grid layout (`grid-cols-1 lg:grid-cols-12`)
- ✅ Mobile-first spacing (`px-4 sm:px-6 py-6 sm:py-12`)
- ✅ Responsive text sizes (`text-lg sm:text-xl`)
- ✅ Mobile-optimized buttons and cards
- ✅ Proper touch targets and spacing

### Additional Mobile Considerations:
- Test on actual mobile devices
- Check touch interactions
- Verify keyboard behavior on mobile
- Test different screen sizes

## 🚀 Deployment Checklist

### Before Deploying:
1. ✅ All environment variables set in production
2. ✅ Database migrations applied
3. ✅ RLS policies configured
4. ✅ API routes tested
5. ✅ Mobile responsiveness verified
6. ✅ New user flow tested

### After Deploying:
1. ✅ Test new user registration
2. ✅ Test task creation
3. ✅ Test user stats updates
4. ✅ Test mobile experience
5. ✅ Check console for errors
6. ✅ Verify onboarding modal appears

## 🔍 Debugging Steps

### 1. Check Browser Console
Look for:
- Database connection errors
- Missing column errors
- Authentication errors
- API route errors

### 2. Test Environment Variables
Run these scripts to check your setup:
```bash
# Test service key
npx tsx scripts/test-service-key.ts

# Test anon key
npx tsx scripts/test-anon-key.ts

# Test production differences
npx tsx scripts/test-production-differences.ts
```

**Expected Results**:
- ✅ Service key should work (if valid)
- ✅ Anon key should work
- ⚠️ RLS should block anon key from accessing user data

### 2. Check Network Tab
Look for:
- Failed API requests
- 404 errors on routes
- Database query errors

### 3. Check Environment Variables
Verify all required variables are set in production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEW_SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### 4. Check Database Schema
Verify all columns exist:
- `user_stats.userId` (not `user_id`)
- `user_stats.createdAt` (not `created_at`)
- `user_stats.updatedAt` (not `updated_at`)
- `tasks.userId` (not `user_id`)
- `tasks.createdAt` (not `created_at`)
- `tasks.expired`
- `tasks.completedAt`
- `tasks.assignedDate`

## 🎯 Most Likely Issues

Based on the current setup, the most likely production issues are:

1. **Invalid `NEW_SUPABASE_SERVICE_KEY`** - The service key is corrupted or invalid (confirmed locally)
2. **RLS policies not enabled** - Local database allows all access, production might have RLS enabled
3. **Database migrations not applied** - Production schema might be outdated
4. **Environment variable differences** - Production might be missing some variables

## 🛠️ Immediate Actions

1. **Fix the service key**:
   ```bash
   # Get a fresh service key from Supabase dashboard
   # Settings > API > service_role key
   # Replace in .env.local
   NEW_SUPABASE_SERVICE_KEY=your_fresh_key_here
   ```

2. **Check RLS policies**:
   ```bash
   # In Supabase dashboard
   # Authentication > Policies
   # Make sure RLS is enabled and policies are set correctly
   ```

3. **Apply migrations to production**:
   ```bash
   # In production environment
   npx supabase db push
   ```

4. **Test the fixes**:
   ```bash
   npx tsx scripts/test-service-key.ts
   npx tsx scripts/test-production-differences.ts
   ```

5. **Deploy and test**:
   - Test new user registration
   - Test task creation
   - Test mobile experience 