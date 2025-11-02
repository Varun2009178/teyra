import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createUserProgress, serviceSupabase } from '@/lib/supabase-service';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('🎯 WEBHOOK CALLED - Clerk webhook endpoint hit!');
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('🌐 Environment:', process.env.NODE_ENV);
  console.log('🔗 Request URL:', req.url);
  
  // Get the headers (await required in Next.js 15)
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  console.log('📋 Webhook headers:', {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature ? '[REDACTED]' : null,
    'content-type': headerPayload.get('content-type'),
    'user-agent': headerPayload.get('user-agent')
  });

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('❌ Missing svix headers');
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  console.log('📦 Webhook payload preview:', {
    type: payload.type,
    object: payload.object,
    data_id: payload.data?.id,
    data_keys: payload.data ? Object.keys(payload.data) : []
  });

  // Check webhook secret
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    console.error('❌ CLERK_WEBHOOK_SECRET not found in environment');
    return new Response('Webhook secret not configured', {
      status: 500
    });
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log('✅ Webhook signature verified successfully');
  } catch (err) {
    console.error('❌ Error verifying webhook signature:', err);
    return new Response('Error verifying webhook signature', {
      status: 400
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`🎯 Webhook verified: ${eventType} for user ${id}`);

  // Handle user creation
  if (eventType === 'user.created') {
    try {
      console.log(`👤 Webhook: Creating user progress record for: ${id}`);
      
      // Get user email from Clerk payload
      const userEmail = evt.data.email_addresses?.[0]?.email_address;
      console.log(`📧 User email: ${userEmail}`);
      
      // First check if user_progress already exists by user_id to prevent duplicates
      const { data: existingProgress, error: checkError } = await serviceSupabase
        .from('user_progress')
        .select('id, user_id')
        .eq('user_id', id)
        .limit(1);
      
      if (checkError) {
        console.error(`❌ Webhook: Error checking existing progress for ${id}:`, checkError);
        return new Response('Error checking existing user', { status: 500 });
      }
      
      if (existingProgress && existingProgress.length > 0) {
        console.log(`⚠️  Webhook: User ${id} already has progress record, skipping creation`);
        return new Response('User already exists', { status: 200 });
      }
      
      // Check if user with same email already exists in our system
      if (userEmail) {
        console.log(`🔍 Checking for existing users with email: ${userEmail}`);
        
        // Note: We can't directly query by email since we only store user_id
        // But we can log this for manual review if needed
        console.log(`📝 New user ${id} with email ${userEmail} - creating fresh account`);
      }
      
      // Create new user progress record using Supabase
      await createUserProgress(id);
      
      console.log(`✅ Webhook: User progress created for ${id}`);
      return new Response('User created successfully', { status: 200 });
      
    } catch (error) {
      console.error(`❌ Webhook: Error creating user ${id}:`, error);
      
      // Don't fail if user already exists (handle race conditions)
      if (error instanceof Error && (error.message.includes('duplicate key') || 
          (error as any)?.code === '23505')) {
        console.log(`⚠️  Webhook: User ${id} already exists (duplicate key error)`);
        return new Response('User already exists', { status: 200 });
      }
      
      return new Response('Error creating user', { status: 500 });
    }
  }

  // Handle user deletion
  if (eventType === 'user.deleted') {
    try {
      console.log(`🗑️  Webhook: Starting deletion process for user: ${id}`);
      
      // First, check what data exists for this user before deletion
      console.log(`🔍 Checking existing data for user ${id}...`);
      
      // Check all tables that might have user data
      const tablesToCheck = [
        'tasks', 
        'user_progress', 
        'user_behavior_events', 
        'user_behavior_analysis',
        'daily_checkins',
        'moods',
        'user_ai_patterns',
        'user_behavior'
      ];
      
      const checkPromises = tablesToCheck.map(table => 
        serviceSupabase.from(table).select('id').eq('user_id', id)
      );
      
      const checkResults = await Promise.allSettled(checkPromises);
      
      checkResults.forEach((result, index) => {
        const tableName = tablesToCheck[index];
        if (result.status === 'fulfilled' && result.value.data) {
          console.log(`📋 Found ${result.value.data.length} records in ${tableName} for user ${id}`);
        } else {
          console.log(`⚠️  Could not check ${tableName} for user ${id}:`, result.status === 'rejected' ? result.reason : 'No data');
        }
      });
      
      // Define ALL user-related tables for complete cleanup
      const userTables = [
        'tasks', 
        'user_progress', 
        'user_behavior_events', 
        'user_behavior_analysis',
        'daily_checkins',
        'moods',
        'user_ai_patterns',
        'user_behavior'
        // Removed notification_logs since it doesn't exist in schema
      ];
      
      // Delete from all user-related tables sequentially for better error tracking
      const deletionResults = [];
      
      for (const table of userTables) {
        try {
          console.log(`🗑️  Deleting from ${table} for user ${id}...`);
          
          const deleteResult = await serviceSupabase
            .from(table)
            .delete()
            .eq('user_id', id);
          
          if (deleteResult.error) {
            console.error(`❌ Error deleting from ${table}:`, deleteResult.error);
            deletionResults.push({ table, success: false, error: deleteResult.error });
          } else {
            console.log(`✅ Successfully deleted from ${table} for user ${id} (count: ${deleteResult.count || 'unknown'})`);
            deletionResults.push({ table, success: true, count: deleteResult.count || 0 });
          }
        } catch (error) {
          console.error(`❌ Exception while deleting from ${table}:`, error);
          deletionResults.push({ table, success: false, error });
        }
      }
      
      // Summary of deletion results
      const successfulDeletions = deletionResults.filter(r => r.success).length;
      const failedDeletions = deletionResults.filter(r => !r.success);
      
      console.log(`📊 Deletion summary for user ${id}:`);
      console.log(`   ✅ Successful: ${successfulDeletions}/${userTables.length} tables`);
      if (failedDeletions.length > 0) {
        console.log(`   ❌ Failed: ${failedDeletions.length} tables`);
        failedDeletions.forEach(failure => {
          console.log(`      - ${failure.table}: ${failure.error}`);
        });
      }
      
      if (failedDeletions.length > 0) {
        console.warn(`⚠️  Some deletions failed for user ${id}, but webhook completed`);
        return new Response(`User deletion partially completed (${successfulDeletions}/${userTables.length} tables)`, { status: 200 });
      }
      
      console.log(`✅ Webhook: User ${id} data cleanup completed successfully`);
      return new Response('User deleted successfully', { status: 200 });
      
    } catch (error) {
      console.error(`❌ Webhook: Critical error deleting user ${id}:`, error);
      return new Response(`Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
    }
  }
  
  console.log(`⚠️  Webhook: Unhandled event type: ${eventType}`);
  return new Response('Event processed', { status: 200 });
}

// GET endpoint for testing webhook connectivity
export async function GET() {
  console.log('🧪 Webhook GET test endpoint called');
  return new Response(JSON.stringify({
    status: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}