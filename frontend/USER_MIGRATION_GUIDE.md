# User Migration Guide

## Overview
This guide helps you migrate your existing 60-70 users from your old NextAuth + Supabase app to the new Clerk + Supabase app while preserving all their data.

## Prerequisites

### 1. Environment Setup
Add these environment variables to your `.env.local`:

```env
# New app (Clerk + Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_new_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_supabase_anon_key
NEW_SUPABASE_SERVICE_KEY=your_new_supabase_service_key

# Old app (NextAuth + Supabase)
OLD_SUPABASE_URL=your_old_supabase_url
OLD_SUPABASE_SERVICE_KEY=your_old_supabase_service_key

# Clerk
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 2. Install Dependencies
```bash
npm install @clerk/nextjs
```

## Migration Process

### Step 1: Prepare Your Old Database
1. **Export your old database schema** to understand the table structure
2. **Note the table names** for users, tasks, and user stats
3. **Update the migration script** with your actual table names

### Step 2: Run Database Migrations
1. Go to your **new Supabase dashboard**
2. Run the SQL migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_user_migrations.sql`

### Step 3: Update Migration Script
Edit `scripts/migrate-users.ts` and update these table names to match your old database:

```typescript
// Update these table names to match your old database
.from('users') // Your old users table name
.from('tasks') // Your old tasks table name  
.from('user_stats') // Your old user stats table name
```

### Step 4: Run the Migration
```bash
# Run the migration script
npx tsx scripts/migrate-users.ts
```

The script will:
- ✅ Create Clerk users for all existing users
- ✅ Migrate all their tasks to the new database
- ✅ Migrate all their user stats and preferences
- ✅ Track the migration for reference

### Step 5: Notify Your Users
Send an email to your users explaining:

```
Subject: Teyra has been upgraded! 🎉

Hi [User Name],

We've upgraded Teyra with new features and better performance! 

To access your account:
1. Go to [your-new-app-url]
2. Click "Sign In"
3. Enter your email: [user-email]
4. Check your email for a magic link
5. Click the link to sign in

All your tasks and progress have been preserved! 

Let us know if you need any help.

Best,
The Teyra Team
```

## What Gets Migrated

### ✅ User Data
- Email address
- Name (if available)
- Account creation date

### ✅ Tasks
- All task text
- Completion status
- Creation dates

### ✅ User Stats
- All-time completion count
- Current streak
- Weekly/daily completion counts
- Subscription level
- AI preferences
- User mood settings
- Analytics preferences

### ✅ What's New
- Better authentication (Clerk)
- Improved UI/UX
- Enhanced AI features
- Better data persistence

## Troubleshooting

### Common Issues

**1. Table not found errors**
- Check your old database table names
- Update the migration script accordingly

**2. Clerk user creation fails**
- Verify your `CLERK_SECRET_KEY` is correct
- Check if users already exist in Clerk

**3. Supabase connection errors**
- Verify your Supabase URLs and keys
- Check if RLS policies are blocking access

### Rollback Plan
If something goes wrong:
1. **Don't panic** - your old data is still safe
2. **Check the migration logs** for specific errors
3. **Fix the issues** and re-run the migration
4. **Use the user_migrations table** to track what was migrated

## Post-Migration

### 1. Test the Migration
- Sign in as a few migrated users
- Verify their tasks and stats are correct
- Test the new features

### 2. Monitor for Issues
- Check for any failed migrations
- Monitor user feedback
- Address any data inconsistencies

### 3. Clean Up (Optional)
- Archive your old database after confirming everything works
- Remove old environment variables
- Update your documentation

## Benefits for Your Users

### 🎉 What They Get
- **Seamless transition** - all their data preserved
- **Better experience** - improved UI and features
- **More reliable** - better data persistence
- **Enhanced AI** - smarter task management
- **Cross-device sync** - works on all devices

### 📈 What You Get
- **Modern tech stack** - easier to maintain
- **Better security** - Clerk's enterprise-grade auth
- **Scalability** - can handle more users
- **Analytics** - better user insights
- **Future-proof** - easier to add features

## Support

If you run into issues:
1. Check the migration logs
2. Verify your environment variables
3. Test with a single user first
4. Contact support if needed

Your users will love the upgrade! 🚀 