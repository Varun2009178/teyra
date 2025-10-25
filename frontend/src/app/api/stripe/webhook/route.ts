import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
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
        const { error } = await supabase
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
          });

        if (error) {
          console.error('❌ Error updating user progress:', error);
        } else {
          console.log('✅ User upgraded to Pro:', userId);
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
