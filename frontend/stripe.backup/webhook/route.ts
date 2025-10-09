import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSuccess(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const clerkUserId = session.metadata?.clerkUserId
  if (!clerkUserId) return

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  await updateUserSubscription(clerkUserId, subscription, true)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  if (customer.deleted) return

  const clerkUserId = customer.metadata.clerkUserId
  if (!clerkUserId) return

  const isActive = subscription.status === 'active' || subscription.status === 'trialing'
  await updateUserSubscription(clerkUserId, subscription, isActive)
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  )

  const customer = await stripe.customers.retrieve(subscription.customer as string)
  if (customer.deleted) return

  const clerkUserId = customer.metadata.clerkUserId
  if (!clerkUserId) return

  await updateUserSubscription(clerkUserId, subscription, true)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  )

  const customer = await stripe.customers.retrieve(subscription.customer as string)
  if (customer.deleted) return

  const clerkUserId = customer.metadata.clerkUserId
  if (!clerkUserId) return

  // Mark subscription as inactive if payment failed
  await updateUserSubscription(clerkUserId, subscription, false)
}

async function updateUserSubscription(
  clerkUserId: string,
  subscription: Stripe.Subscription,
  isActive: boolean
) {
  const expiresAt = new Date(subscription.current_period_end * 1000)

  const { error } = await supabase
    .from('users')
    .update({
      is_premium: isActive,
      premium_expires_at: expiresAt.toISOString(),
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    })
    .eq('clerk_user_id', clerkUserId)

  if (error) {
    console.error('Error updating user subscription:', error)
    throw error
  }

  console.log(`Updated subscription for user ${clerkUserId}: ${isActive ? 'active' : 'inactive'}`)
}
