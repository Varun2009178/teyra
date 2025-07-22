# Switching from Supabase to Neon with Clerk Authentication

This guide explains how to set up and use Neon PostgreSQL database with Clerk authentication for the task management application.

## What is Neon?

Neon is a serverless PostgreSQL database that scales automatically and offers a reliable connection. It's a great alternative to Supabase if you're experiencing connection issues.

## Setup Instructions

### 1. Create a Neon Account and Database

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Create a new database within your project
4. Get your connection string from the dashboard

### 2. Update Environment Variables

You'll need two different connection strings from Neon:

1. **DATABASE_URL**: The pooled connection string for regular database operations
2. **DIRECT_URL**: The direct connection string for migrations and schema operations

To get these connection strings:
1. Log in to your Neon dashboard at [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Go to the "Connection Details" section
4. Copy both the pooled and direct connection strings

Update your `.env.local` file with both connection strings:

```
# Neon database
DATABASE_URL=postgresql://[username]:[password]@[pooled-endpoint]/[database]
DIRECT_URL=postgresql://[username]:[password]@[direct-endpoint]/[database]

# Replace the placeholders with your actual Neon database credentials
```

#### Connection Pooling

Neon provides built-in connection pooling, which is automatically used when you use the pooled connection string (DATABASE_URL). This helps your application handle multiple concurrent connections efficiently without overwhelming the database.

Our configuration in `src/lib/db.ts` is optimized for connection pooling with:
```typescript
neonConfig.fetchConnectionCache = true;
```

This setting enables connection caching, which improves performance by reusing connections.

### 3. Initialize the Database

Run the database setup script to create the necessary tables:

```bash
npm run db:setup
```

This will create the following tables:
- `tasks`: Stores user tasks
- `user_progress`: Stores user progress and mood information

## How It Works

### Authentication Flow

1. Users authenticate with Clerk
2. The application uses Clerk's user ID to associate tasks with users
3. API routes verify the user's identity using Clerk's `currentUser()` function
4. Database operations are performed using the user's ID as a reference

### Database Operations

The application uses the following database operations:

- `getUserTasks`: Fetches all tasks for a user
- `createTask`: Creates a new task for a user
- `updateTask`: Updates a task's completion status
- `deleteTask`: Deletes a task
- `getUserProgress`: Gets or creates a user's progress record
- `updateUserMood`: Updates a user's mood

### Optimistic UI Updates

The application uses optimistic UI updates to provide instant feedback to users:

1. When a user adds a task, it appears immediately in the UI
2. When a user completes or deletes a task, the change is reflected immediately
3. If the server operation fails, the UI is reverted to its previous state

## Troubleshooting

If you encounter any issues:

1. Check your database connection string in `.env.local`
2. Ensure the database tables are created by running `npm run db:setup`
3. Check the server logs for any errors
4. Verify that Clerk authentication is working correctly

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Clerk Documentation](https://clerk.dev/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)