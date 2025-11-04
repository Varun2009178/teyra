# Teyra - Productivity App

A productivity app that helps you track your tasks and grow your virtual cactus companion.

## Getting Started

### Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your own values in `.env.local`:
   - Database credentials (Neon PostgreSQL)
   - Clerk authentication keys
   - Other API keys as needed

### Database Setup

1. Create a Neon PostgreSQL database at [neon.tech](https://neon.tech)
2. Get your connection strings and add them to `.env.local`
3. Run the database setup script:
   ```bash
   npm run db:setup
   ```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Security

- Never commit `.env.local` or any files containing credentials
- Use environment variables for all sensitive information
- Keep your database credentials secure

## Features

- Task management
- Mood tracking
- AI-powered task suggestions
- Daily reset and progress tracking
- Mobile-optimized interface

## Tech Stack

- Next.js
- Clerk Authentication
- Neon PostgreSQL
- Drizzle ORM
- Tailwind CSS