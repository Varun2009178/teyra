import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { deleteUserData } from '@/lib/db-service';

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook received: ${eventType} for user ${id}`);

  // Handle user deletion
  if (eventType === 'user.deleted') {
    try {
      console.log(`🔄 Webhook: Deleting all data for user: ${id}`);
      await deleteUserData(id);
      console.log(`✅ Webhook: Successfully deleted all data for user: ${id}`);
    } catch (error) {
      console.error(`❌ Webhook: Error deleting user data for ${id}:`, error);
      // Return 200 to prevent webhook retries for now
      // You can change this to 500 if you want Clerk to retry
      return new Response('Error deleting user data', { status: 200 });
    }
  }

  // Handle user creation (optional - for logging)
  if (eventType === 'user.created') {
    console.log(`👤 Webhook: New user created: ${id}`);
    // You could initialize user progress here if needed
  }

  return new Response('Webhook processed successfully', { status: 200 });
} 