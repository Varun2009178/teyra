#!/usr/bin/env tsx

// This script simulates a Clerk webhook call to test the deletion flow locally
// WITHOUT actually deleting a user from Clerk

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function testWebhookLocally() {
  console.log('🧪 Testing webhook deletion flow locally...\n');
  
  const webhookUrl = 'http://localhost:3000/api/webhooks/clerk';
  
  // Create a fake user deletion webhook payload
  const testPayload = {
    type: 'user.deleted',
    data: {
      id: 'test_user_webhook_deletion_123', // Fake user ID for testing
      object: 'user',
      deleted: true
    }
  };

  console.log('📡 Simulating Clerk webhook call...');
  console.log('   Event Type: user.deleted');
  console.log('   Test User ID: test_user_webhook_deletion_123');
  console.log('   Webhook URL:', webhookUrl);

  try {
    // First, let's create some test data for this fake user
    console.log('\n1️⃣ Creating test data for fake user...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Create test user_progress record
    const { error: progressError } = await supabase
      .from('user_progress')
      .insert({
        user_id: 'test_user_webhook_deletion_123',
        current_mood: 'neutral',
        daily_mood_checks: 0,
        daily_ai_splits: 0,
        last_mood_update: new Date().toISOString(),
        last_reset_date: new Date().toISOString(),
        is_locked: false,
        daily_start_time: null
      });

    if (progressError) {
      console.log('   ⚠️  Test user may already exist or error:', progressError.message);
    } else {
      console.log('   ✅ Created test user_progress record');
    }

    // Create test task
    const { error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: 'test_user_webhook_deletion_123',
        title: 'Test task for webhook deletion',
        completed: false
      });

    if (taskError) {
      console.log('   ⚠️  Test task may already exist or error:', taskError.message);
    } else {
      console.log('   ✅ Created test task');
    }

    console.log('\n2️⃣ Calling webhook endpoint...');

    // Make the webhook call
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'test-webhook-id',
        'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
        'svix-signature': 'test-signature' // This will fail signature verification, but we can see the logic
      },
      body: JSON.stringify(testPayload)
    });

    console.log('   📊 Response Status:', response.status);
    console.log('   📊 Response Status Text:', response.statusText);

    const responseText = await response.text();
    console.log('   📊 Response Body:', responseText);

    if (response.status === 400) {
      console.log('\n⚠️  This is expected - signature verification failed (normal for test)');
      console.log('   The webhook is working but requires proper Clerk signatures in production.');
    }

    console.log('\n3️⃣ Checking if test data was cleaned up...');

    // Check if the data was deleted
    const { data: remainingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', 'test_user_webhook_deletion_123');

    const { data: remainingTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', 'test_user_webhook_deletion_123');

    console.log('   📊 Remaining progress records:', remainingProgress?.length || 0);
    console.log('   📊 Remaining tasks:', remainingTasks?.length || 0);

    if ((remainingProgress?.length || 0) === 0 && (remainingTasks?.length || 0) === 0) {
      console.log('   ✅ Test data was successfully cleaned up by webhook!');
    } else {
      console.log('   ❌ Test data still exists - webhook may not have processed correctly');
    }

    console.log('\n4️⃣ Cleaning up any remaining test data...');
    
    // Clean up any remaining test data
    await supabase.from('tasks').delete().eq('user_id', 'test_user_webhook_deletion_123');
    await supabase.from('user_progress').delete().eq('user_id', 'test_user_webhook_deletion_123');
    
    console.log('   ✅ Test cleanup completed');

  } catch (error) {
    console.error('❌ Error during webhook test:', error);
  }

  console.log('\n📋 Summary:');
  console.log('   - This test simulates a Clerk user deletion webhook');
  console.log('   - It creates test data, calls your webhook, and checks if data was cleaned up');
  console.log('   - A 400 error is expected due to signature verification');
  console.log('   - The important part is whether the test data gets cleaned up');
}

// Run the test
testWebhookLocally()
  .then(() => {
    console.log('\n✅ Webhook test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Webhook test failed:', error);
    process.exit(1);
  });