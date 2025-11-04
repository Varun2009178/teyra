require('dotenv').config({ path: '.env.local' });

async function testCronEndpoint() {
  console.log('🧪 Testing cron endpoint manually...');

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const CRON_SECRET = process.env.CRON_SECRET_KEY;

  if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET_KEY not found in environment');
    return;
  }

  try {
    console.log(`📡 Calling: ${APP_URL}/api/cron/daily-emails`);

    const response = await fetch(`${APP_URL}/api/cron/daily-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });

    console.log(`📊 Response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cron job response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ Cron job failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Error calling cron endpoint:', error.message);
  }
}

testCronEndpoint();