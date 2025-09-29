import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testResetSystem() {
  console.log('🧪 Testing daily reset system...');

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const CRON_SECRET = process.env.CRON_SECRET_KEY;

  if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET_KEY not found in environment');
    return;
  }

  try {
    // 1. Test the daily resets cron endpoint
    console.log('\n🔄 Testing daily resets cron...');
    const resetsCronResponse = await fetch(`${APP_URL}/api/cron/daily-resets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });

    console.log(`📊 Resets cron status: ${resetsCronResponse.status}`);

    if (resetsCronResponse.ok) {
      const responseText = await resetsCronResponse.text();
      console.log('📄 Raw response:', responseText.substring(0, 200) + '...');
      try {
        const resetsResult = JSON.parse(responseText);
        console.log('✅ Daily resets cron response:', JSON.stringify(resetsResult, null, 2));
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError.message);
        console.log('📄 Full response:', responseText);
      }
    } else {
      const errorText = await resetsCronResponse.text();
      console.error('❌ Daily resets cron failed:', errorText);
    }

    // 2. Test the daily emails cron endpoint
    console.log('\n📧 Testing daily emails cron...');
    const emailsCronResponse = await fetch(`${APP_URL}/api/cron/daily-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });

    console.log(`📊 Emails cron status: ${emailsCronResponse.status}`);

    if (emailsCronResponse.ok) {
      const responseText = await emailsCronResponse.text();
      console.log('📄 Raw response:', responseText.substring(0, 200) + '...');
      try {
        const emailsResult = JSON.parse(responseText);
        console.log('✅ Daily emails cron response:', JSON.stringify(emailsResult, null, 2));
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError.message);
        console.log('📄 Full response:', responseText);
      }
    } else {
      const errorText = await emailsCronResponse.text();
      console.error('❌ Daily emails cron failed:', errorText);
    }

    console.log('\n🎯 SUMMARY:');
    console.log(`- Daily resets cron: ${resetsCronResponse.ok ? '✅ Working' : '❌ Failed'}`);
    console.log(`- Daily emails cron: ${emailsCronResponse.ok ? '✅ Working' : '❌ Failed'}`);

    if (resetsCronResponse.ok && emailsCronResponse.ok) {
      console.log('\n🎉 Both cron systems are working! Your users should now get:');
      console.log('   - Automatic daily resets every 6 hours (for users who need them)');
      console.log('   - Daily email summaries at 8 AM UTC');
      console.log('\nNext steps:');
      console.log('1. Deploy these changes to production');
      console.log('2. Monitor the Vercel cron logs to ensure they\'re running');
      console.log('3. Check that your account gets a reset/email within 24 hours');
    } else {
      console.log('\n⚠️ Some systems are not working. Check the errors above.');
    }

  } catch (error) {
    console.error('❌ Error testing reset system:', error.message);
  }
}

testResetSystem();