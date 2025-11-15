import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

// Using shared singleton

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error('Stripe secrets missing; cannot process webhook');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  console.log('✅ Webhook received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id;
        const referralCode = session.metadata?.referralCode;

        if (!userId) {
          console.error('❌ No userId found in session');
          break;
        }

        // Log referral conversion if present
        if (referralCode) {
          console.log('🎯 REFERRAL CONVERSION:', {
            referralCode,
            userId,
            subscriptionId: session.subscription,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            timestamp: new Date().toISOString()
          });
        }

        // Upsert user's subscription status in database (create or update)
        // Updating database, setting is_pro: true

        const { data, error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: userId,
            is_pro: true,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            pro_since: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          })
          .select();

        if (error) {
          console.error('❌ Error updating user progress:', error);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by customer ID
        const { data: user } = await supabase
          .from('user_progress')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          const isActive = subscription.status === 'active';

          await supabase
            .from('user_progress')
            .update({
              is_pro: isActive,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.user_id);

          console.log(`✅ Subscription ${isActive ? 'activated' : 'deactivated'}:`, user.user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by customer ID
        const { data: user } = await supabase
          .from('user_progress')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          await supabase
            .from('user_progress')
            .update({
              is_pro: false,
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.user_id);

          console.log('✅ Subscription cancelled:', user.user_id);
        }
        break;
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
