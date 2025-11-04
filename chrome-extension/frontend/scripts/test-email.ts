#!/usr/bin/env npx tsx

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testEmail() {
  try {
    console.log('🧪 Testing email system...\n');

    // Test the send-daily-email endpoint
    const response = await fetch('http://localhost:3001/api/send-daily-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        type: 'daily_checkin',
        timezone: 'UTC',
        hoursSinceActivity: 25,
        userData: {
          tasks_completed: 3,
          current_streak: 2,
          longest_streak: 5
        },
        taskSummary: {
          completed: ['Task 1', 'Task 2'],
          incomplete: ['Task 3', 'Task 4'],
          total: 4,
          completed_count: 2,
          incomplete_count: 2
        }
      }),
    });

    console.log('📧 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email test successful!');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
      
      if (result.emailSkipped) {
        console.log('\n⚠️ Email was skipped - check if RESEND_API_KEY is set');
      } else {
        console.log('\n🎉 Email would be sent successfully in production!');
      }
    } else {
      const error = await response.text();
      console.log('❌ Email test failed');
      console.log('Error:', error);
    }

    console.log('\n🔍 Environment check:');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not set');

  } catch (error) {
    console.error('❌ Error testing email:', error);
  }
}

// Also test the cron endpoint
async function testCronEndpoint() {
  try {
    console.log('\n🔄 Testing cron email endpoint...\n');

    const response = await fetch('http://localhost:3001/api/cron/daily-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📧 Cron response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cron test successful!');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Cron test failed');
      console.log('Error:', error);
    }

  } catch (error) {
    console.error('❌ Error testing cron:', error);
  }
}

async function runTests() {
  console.log('🧪 Running email system tests...\n');
  
  await testEmail();
  await testCronEndpoint();
  
  console.log('\n✅ Email tests complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Test the AI notifications popup in browser');
  console.log('2. Check if email preferences are saved correctly');
  console.log('3. Verify users only get emails after opting in');
}

runTests();