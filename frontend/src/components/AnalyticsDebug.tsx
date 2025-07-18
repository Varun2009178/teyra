'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AnalyticsDebug() {
  const pathname = usePathname()

  useEffect(() => {
    // Manual page view tracking
    console.log('📊 Manual Analytics: Page view detected:', pathname)
    
    // Check if Vercel Analytics is available
    if (typeof window !== 'undefined' && (window as any).va) {
      console.log('✅ Vercel Analytics is available, tracking page view')
      ;(window as any).va('pageview', { url: pathname })
    } else {
      console.log('❌ Vercel Analytics not available')
    }

    // Check for analytics script
    const analyticsScript = document.querySelector('script[src*="va.vercel-scripts.com"]')
    if (analyticsScript) {
      console.log('✅ Analytics script found')
    } else {
      console.log('❌ Analytics script not found')
    }
  }, [pathname])

  return null
} 