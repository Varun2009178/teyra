import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@clerk/nextjs/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await req.json()

    // Lookup the price using the lookup key
    const lookupKey = 'teyra_pro_monthly'
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      expand: ['data.product']
    })

    if (prices.data.length === 0) {
      return NextResponse.json(
        { error: 'Price not found. Please create a price with lookup_key: teyra_pro_monthly' },
        { status: 404 }
      )
    }

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    let customerId: string

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          clerkUserId: userId
        }
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1
        }
      ],
      subscription_data: {
        description: '$10/month recurring - 100 AI breakdowns per month, context linking, Google Calendar sync',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?canceled=true`,
      metadata: {
        clerkUserId: userId
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
