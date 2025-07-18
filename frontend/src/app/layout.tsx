import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import TransitionProvider from '@/components/TransitionProvider'
import { Analytics } from '@vercel/analytics/react'
import { useEffect } from 'react'
import AnalyticsDebug from '@/components/AnalyticsDebug'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Teyra - Productivity that understands you',
  description: 'The best damn to-do list in the world.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Debug analytics loading
  useEffect(() => {
    console.log('🔍 Vercel Analytics: Checking if script is loaded...')
    const script = document.querySelector('script[src*="va.vercel-scripts.com"]')
    if (script) {
      console.log('✅ Vercel Analytics script found:', script.src)
    } else {
      console.log('❌ Vercel Analytics script not found')
    }
  }, [])

  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#ef4444',
          colorBackground: '#ffffff',
          colorText: '#000000',
        },
      }}
    >
      <html lang="en" className="h-full">
        <body className={`${inter.className} h-full`}>
          <TransitionProvider>{children}</TransitionProvider>
          <Toaster />
          <Analytics />
          <AnalyticsDebug />
        </body>
      </html>
    </ClerkProvider>
  )
}
