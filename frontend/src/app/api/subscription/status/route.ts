import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user subscription status
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_premium, premium_expires_at')
      .eq('clerk_user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching subscription:', error)
      return NextResponse.json({ isPremium: false })
    }

    // Check if premium is active
    const premiumActive = userData?.is_premium &&
      (!userData?.premium_expires_at || new Date(userData.premium_expires_at) > new Date())

    return NextResponse.json({
      isPremium: premiumActive,
      expiresAt: userData?.premium_expires_at
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json({ isPremium: false })
  }
}
