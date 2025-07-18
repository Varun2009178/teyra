# Database Setup Guide

## Overview
Teyra now uses Supabase for persistent data storage instead of localStorage. This ensures that tasks and user data persist across sessions, browsers, and devices.

## Setup Steps

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Set Environment Variables
Create a `.env.local` file in the frontend directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Migration
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the migration

### 4. Configure Authentication (Optional)
If you want to use Supabase Auth instead of Clerk:
1. Go to Authentication > Settings in your Supabase dashboard
2. Configure your authentication providers
3. Update the auth integration in the code

## Database Schema

### Tasks Table
- `id`: UUID primary key
- `user_id`: Text (Clerk user ID)
- `text`: Task description
- `completed`: Boolean
- `feedback`: Optional user feedback
- `effort`: JSONB for effort estimation
- `priority`: Integer priority level
- `created_at`: Timestamp
- `updated_at`: Timestamp

### User Stats Table
- `user_id`: Text primary key (Clerk user ID)
- `all_time_completed`: Total completed tasks
- `current_streak`: Current completion streak
- `completed_this_week`: Weekly completion count
- `completed_today`: Daily completion count
- `last_completed_date`: Last completion date
- `subscription_level`: User's subscription tier
- `ai_suggestions_enabled`: AI features toggle
- `user_mood`: Current user mood
- `show_analytics`: Analytics visibility toggle
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Security
- Row Level Security (RLS) is enabled
- Users can only access their own data
- All operations are authenticated via Clerk user ID

## Benefits
- ✅ Tasks persist across sessions
- ✅ Data survives browser clearing
- ✅ Works across different devices
- ✅ Proper user isolation
- ✅ Scalable and reliable
- ✅ Real-time capabilities (if needed)

## Migration from localStorage
The app will automatically migrate from localStorage to the database when users sign in. No manual migration is required. 