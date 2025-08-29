import { config } from 'dotenv';
import crypto from 'crypto';

// Load environment variables
config({ path: '.env.local' });

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error('❌ CLERK_WEBHOOK_SECRET not found');
  process.exit(1);
}

// Simulate a user.deleted webhook event
const simulateUserDeletion = async (userId: string) => {
  console.log(`🧪 Simulating user deletion webhook for: ${userId}`);

  const payload = {
    data: {
      id: userId,
      object: "user",
      // Add minimal required fields for user deletion
      created_at: Date.now(),
      updated_at: Date.now()
    },
    object: "event",
    type: "user.deleted"
  };

  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = WEBHOOK_SECRET.replace('whsec_', '');
  const secretBytes = Buffer.from(secret, 'base64');
  
  // Create signature (Clerk/Svix format)
  const signedPayload = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedPayload)
    .digest('base64');

  const headers = {
    'Content-Type': 'application/json',
    'svix-id': `msg_${crypto.randomBytes(12).toString('hex')}`,
    'svix-timestamp': timestamp.toString(),
    'svix-signature': `v1,${signature}`
  };

  try {
    console.log('📤 Sending webhook simulation...');
    
    const response = await fetch('http://localhost:3001/api/webhooks/clerk', {
      method: 'POST',
      headers,
      body
    });

    const responseText = await response.text();
    
    console.log(`📥 Response status: ${response.status}`);
    console.log(`📥 Response body: ${responseText}`);
    
    if (response.ok) {
      console.log('✅ Webhook simulation successful!');
    } else {
      console.log('❌ Webhook simulation failed');
    }
    
  } catch (error) {
    console.error('❌ Error simulating webhook:', error);
  }
};

// Test with one of the orphaned user IDs
const orphanedUserId = 'user_31KpxpEj58BKNYOY6JLvkZYYBWt';
simulateUserDeletion(orphanedUserId).catch(console.error);