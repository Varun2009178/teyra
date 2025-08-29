# Development Environment Setup

This guide helps you set up a separate development environment that won't interfere with your production data.

## 🎯 Problem Solved

You have production users in your main Supabase database and want to:
- Test new features safely
- Create test data without affecting production
- Have a clean development environment
- Avoid accidentally modifying production data

## 🚀 Quick Setup

### Step 1: Create Development Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name it `teyra-dev` or `teyra-staging`
4. Choose a region close to you
5. Set a secure database password
6. Wait for setup to complete

### Step 2: Get Development Credentials

1. In your new Supabase project dashboard
2. Go to **Settings > API**
3. Copy the **Project URL** and **anon public** key
4. These will be your `DEV_SUPABASE_URL` and `DEV_SUPABASE_ANON_KEY`

### Step 3: Create Environment File

Create a `.env.development` file in your project root:

```bash
# Development Supabase (separate from production)
DEV_SUPABASE_URL=your_dev_supabase_url
DEV_SUPABASE_ANON_KEY=your_dev_supabase_anon_key

# Keep production variables for reference
NEXT_PUBLIC_SUPABASE_URL=your_prod_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_supabase_anon_key

# Clerk (can use same or create dev organization)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret
```

### Step 4: Setup Development Database

Run the setup script:

```bash
npm run setup:dev-db
```

This will:
- Create all necessary tables (`tasks`, `user_progress`, `daily_checkins`, `moods`)
- Set up Row Level Security (RLS) policies
- Create indexes for performance
- Test the connection

### Step 5: Test the Setup

```bash
npm run test:dev-env
```

This verifies:
- Supabase connection works
- All tables are accessible
- Clerk connection works
- Environment variables are configured correctly

## 🔧 Available Scripts

### Setup Scripts
```bash
# Get setup instructions
npm run setup:dev-env

# Setup development database schema
npm run setup:dev-db

# Test development environment
npm run test:dev-env
```

### User Sync Scripts (Development Safe)
```bash
# Analyze user sync status (read-only)
npm run user-sync analyze

# Fix missing progress records
npm run user-sync fix-progress

# Clean up orphaned data
npm run user-sync cleanup

# Remove duplicate records
npm run user-sync fix-duplicates

# Run complete synchronization
npm run user-sync full-sync
```

## 🏗️ Environment Structure

```
Your Project/
├── .env.local          # Production environment variables
├── .env.development    # Development environment variables
├── src/
│   ├── lib/
│   │   └── supabase.ts # Uses NEXT_PUBLIC_* variables
│   └── app/
└── scripts/
    ├── setup-dev-database.ts
    ├── test-dev-environment.ts
    └── user-sync-manager.ts
```

## 🔄 Switching Between Environments

### Development Mode
```bash
npm run dev
```
- Uses `.env.development` variables
- Connects to development Supabase
- Safe for testing and development

### Production Mode
```bash
npm run build
npm start
```
- Uses `.env.local` variables
- Connects to production Supabase
- For production deployment

## 🧪 Testing Safely

### Create Test Users
1. Sign up with test email addresses
2. Create test data without affecting production
3. Test all features safely

### Test User Sync
```bash
# Analyze current state
npm run user-sync analyze

# Test user creation/deletion
# (Safe in development environment)

# Clean up test data
npm run user-sync cleanup
```

### Test Database Operations
```bash
# All operations are safe in development
npm run user-sync full-sync
```

## 🛡️ Safety Features

### Environment Separation
- Development and production use different Supabase projects
- No risk of affecting production data
- Clear separation of concerns

### Read-Only Analysis
- `npm run user-sync analyze` is read-only
- Safe to run on any environment
- Provides detailed reports

### Controlled Operations
- All destructive operations are logged
- Clear confirmation messages
- Error handling and rollback capabilities

## 🔍 Monitoring

### Development Database
- Monitor in Supabase dashboard
- Check table contents
- View logs and performance

### Application Logs
- Webhook events are logged
- User sync operations are tracked
- Error messages are detailed

## 🚨 Troubleshooting

### Connection Issues
```bash
# Test connection
npm run test:dev-env

# Check environment variables
cat .env.development
```

### Database Setup Issues
```bash
# Re-run setup
npm run setup:dev-db

# Check Supabase dashboard
# Verify tables exist
```

### Sync Issues
```bash
# Analyze current state
npm run user-sync analyze

# Check logs for errors
# Verify webhook configuration
```

## 📋 Best Practices

1. **Always use development environment for testing**
2. **Never run destructive operations on production without backup**
3. **Test user sync operations in development first**
4. **Monitor logs for any issues**
5. **Keep development and production environments separate**
6. **Use descriptive test data**
7. **Clean up test data regularly**

## 🔄 Migration from Neon

If you're migrating from Neon to Supabase:

1. **Keep Neon for development** (if you prefer)
2. **Use Supabase for production**
3. **Set up separate development Supabase project**
4. **Test migration scripts in development first**
5. **Verify data integrity before production migration**

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify environment variables are correct
3. Test connections individually
4. Check Supabase dashboard for errors
5. Review application logs for details

## 🎉 Benefits

With this setup, you can:

✅ **Test safely** without affecting production data  
✅ **Create test users** and data freely  
✅ **Experiment with features** without risk  
✅ **Debug issues** in isolation  
✅ **Deploy confidently** knowing production is safe  
✅ **Scale development** with multiple developers  
✅ **Maintain data integrity** across environments


