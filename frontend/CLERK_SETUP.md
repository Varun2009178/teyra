# Clerk Authentication Setup

## Environment Variables

Add these to your `.env.local` file:

### Development Environment
```env
# Clerk Development Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database (for your data)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
```

### Production Environment
```env
# Clerk Production Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Supabase Database (same as dev)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
```

## Getting Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select existing one
3. Go to API Keys section
4. Copy the Publishable Key and Secret Key
5. For development, use the test keys (starts with `pk_test_` and `sk_test_`)
6. For production, use the live keys (starts with `pk_live_` and `sk_live_`)

## How It Works

- **Clerk** handles all authentication (sign up, sign in, sessions, OAuth)
- **Supabase** is used only for your application data (tasks, user_stats, etc.)
- When users sign up with Clerk, you'll need to create user_stats records
- Your existing database tables remain unchanged
- The `user_id` column will store Clerk user IDs

## Next Steps

1. Set up your Clerk application in the dashboard
2. Configure OAuth providers (Google, GitHub, etc.) if needed
3. Update your API routes to use Clerk's `auth()` function
4. Create user_stats records when new users sign up
5. Test the authentication flow

## API Route Updates

You'll need to update your API routes to use Clerk instead of the old auth:

```typescript
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Your existing logic here
}
```

## User Stats Creation

When a new user signs up, you'll need to create their user_stats record. You can do this via:

1. Clerk webhooks (recommended)
2. Client-side after successful sign-up
3. Server-side in your API routes

## Migration Notes

- All old auth files have been removed
- Only Clerk components remain
- Supabase is still used for data storage
- You'll need to migrate existing users if any 