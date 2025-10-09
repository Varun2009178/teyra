'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { getAuthenticatedClient } from '@/lib/supabase-client'

export default function AccountPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const showUpgrade = searchParams.get('upgrade') === 'true'

  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usageData, setUsageData] = useState<{ count: number; month: string } | null>(null)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (!user) return

      try {
        const supabase = getAuthenticatedClient()

        // Check if user has premium subscription
        const { data: userData, error } = await supabase
          .from('users')
          .select('is_premium, premium_expires_at')
          .eq('clerk_user_id', user.id)
          .single()

        if (error) {
          console.error('Error fetching subscription:', error)
          return
        }

        const premiumActive = userData?.is_premium &&
          (!userData?.premium_expires_at || new Date(userData.premium_expires_at) > new Date())

        setIsPremium(premiumActive)

        // Fetch usage data (this would come from your backend)
        // For now, we'll simulate it
        const now = new Date()
        setUsageData({
          count: 12, // This should come from your backend
          month: `${now.getFullYear()}-${now.getMonth() + 1}`
        })

      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionStatus()
  }, [user])

  async function handleUpgrade() {
    // TODO: Re-enable when Stripe is integrated
    alert('Payment processing will be available soon! Check back when the Chrome extension launches.')
    return

    /* STRIPE INTEGRATION - TEMPORARILY DISABLED
    if (!user) return

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID // You'll need to set this
        })
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    }
    */
  }

  async function handleManageSubscription() {
    // TODO: Re-enable when Stripe is integrated
    alert('Subscription management will be available soon!')
    return

    /* STRIPE INTEGRATION - TEMPORARILY DISABLED
    try {
      // Create Stripe customer portal session
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id
        })
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
    }
    */
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const remaining = usageData ? 50 - usageData.count : 50

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">Teyra</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your subscription and billing</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {isPremium ? 'Teyra Pro' : 'Free Plan'}
                </h2>
                {isPremium && (
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm">
                {isPremium ? '100 AI breakdowns per month + premium features' : '3 AI breakdowns per day'}
              </p>
            </div>
            {isPremium && (
              <div className="text-right">
                <div className="text-3xl font-bold text-white">$10</div>
                <div className="text-sm text-gray-400">/month</div>
              </div>
            )}
          </div>

          {/* Usage Stats */}
          {usageData && (
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  {isPremium ? 'AI Breakdowns this month' : 'AI Breakdowns today'}
                </span>
                <span className="text-sm font-semibold text-white">
                  {usageData.count} / {isPremium ? '100' : '3'}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isPremium
                      ? 'bg-green-500'
                      : remaining > 1 ? 'bg-green-500' : remaining > 0 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(usageData.count / (isPremium ? 100 : 3)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {isPremium ? `${100 - usageData.count} remaining this month` : `${3 - usageData.count} remaining today`}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isPremium ? (
              <button
                onClick={handleUpgrade}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                Upgrade to Pro - $10/month
              </button>
            ) : (
              <button
                onClick={handleManageSubscription}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-colors border border-white/20"
              >
                Manage Subscription
              </button>
            )}
          </div>
        </div>

        {/* Upgrade Modal (shows when redirected from extension) */}
        {showUpgrade && !isPremium && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-2xl p-8 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
                <p className="text-gray-400 text-sm">You've reached your monthly limit</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-white">$10</div>
                  <div className="text-sm text-gray-400">per month</div>
                </div>
                <div className="space-y-3">
                  {['100 AI breakdowns/month (way more!)', 'Smart context linking', 'Google Calendar sync', 'Priority support'].map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/account')}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">AI-Powered Breakdown</h3>
            <p className="text-gray-400 text-sm">
              {isPremium ? '100 breakdowns/month' : '3 breakdowns/day'} with smart context understanding
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Google Calendar Sync</h3>
            <p className="text-gray-400 text-sm">
              Seamlessly sync tasks with deadlines to your Google Calendar
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Context Linking</h3>
            <p className="text-gray-400 text-sm">
              AI finds and links related tasks automatically for better organization
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600/20 to-orange-800/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Priority Support</h3>
            <p className="text-gray-400 text-sm">
              {isPremium ? 'Get' : 'Upgrade to get'} priority email support and faster response times
            </p>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-6 bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-gray-400 text-sm">Email</span>
              <span className="text-white text-sm">{user.primaryEmailAddress?.emailAddress}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-gray-400 text-sm">Plan</span>
              <span className="text-white text-sm font-semibold">{isPremium ? 'Pro' : 'Free'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400 text-sm">Member since</span>
              <span className="text-white text-sm">{new Date(user.createdAt || '').toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
