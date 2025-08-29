#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { createClient } from '@supabase/supabase-js';
import { createClerkClient } from '@clerk/clerk-sdk-node';

console.log('🚀 Development Environment Setup Guide\n');

console.log(`
📋 SETUP INSTRUCTIONS:

1. CREATE DEVELOPMENT SUPABASE PROJECT:
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Name it something like "teyra-dev" or "teyra-staging"
   - Choose a region close to you
   - Set a secure database password
   - Wait for setup to complete

2. GET DEVELOPMENT CREDENTIALS:
   - In your new Supabase project dashboard
   - Go to Settings > API
   - Copy the "Project URL" and "anon public" key
   - These will be your DEV_SUPABASE_URL and DEV_SUPABASE_ANON_KEY

3. SETUP ENVIRONMENT VARIABLES:
   Create a .env.development file with:
   
   # Development Supabase (separate from production)
   DEV_SUPABASE_URL=your_dev_supabase_url
   DEV_SUPABASE_ANON_KEY=your_dev_supabase_anon_key
   
   # Keep production variables for reference
   NEXT_PUBLIC_SUPABASE_URL=your_prod_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_supabase_anon_key
   
   # Clerk (can use same or create dev organization)
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_webhook_secret

4. SETUP DATABASE SCHEMA:
   Run this command to set up your dev database:
   npm run setup:dev-db

5. TEST THE SETUP:
   Run this command to verify everything works:
   npm run test:dev-env

6. SWITCH BETWEEN ENVIRONMENTS:
   - Development: npm run dev
   - Production: npm run build && npm start
`);

console.log('\n🔧 Would you like me to help you with any specific step?');
console.log('   - Run "npm run setup:dev-db" to set up the database schema');
console.log('   - Run "npm run test:dev-env" to test the setup');
console.log('   - Run "npm run migrate:dev" to migrate any existing dev data');


