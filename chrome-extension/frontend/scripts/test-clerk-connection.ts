#!/usr/bin/env tsx

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { createClerkClient } from '@clerk/clerk-sdk-node';

async function testClerkConnection() {
  console.log('🔍 Testing Clerk connection...\n');
  
  console.log('Environment variables:');
  console.log(`   CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET'}`);
  
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY not found in environment variables');
    process.exit(1);
  }
  
  try {
    console.log('\n🔗 Creating Clerk client...');
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!
    });
    
    console.log('✅ Clerk client created successfully');
    
    console.log('\n📋 Testing getUserList API...');
    const response = await clerkClient.users.getUserList({
      limit: 5
    });
    
    console.log('📊 Raw API Response:');
    console.log(`   Type: ${typeof response}`);
    console.log(`   Keys: ${Object.keys(response)}`);
    console.log(`   Full response:`, JSON.stringify(response, null, 2));
    
    // Try different API endpoints
    console.log('\n🔍 Testing getUserCount API...');
    try {
      const countResponse = await clerkClient.users.getCount();
      console.log(`   User count: ${countResponse}`);
    } catch (error) {
      console.error('   Error getting count:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing Clerk connection:', error);
    
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error name:', error.name);
    }
  }
}

testClerkConnection()
  .then(() => console.log('✅ Test completed'))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });