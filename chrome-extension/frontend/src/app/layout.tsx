import { type Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import AuthProvider from '@/components/auth/AuthProvider'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { ReferralTracker } from '@/components/ReferralTracker'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://teyra.vercel.app'),
  title: {
    default: 'Teyra - Your Personal Productivity Companion',
    template: '%s | Teyra'
  },
  description: 'Build sustainable productivity habits with Mike the Cactus. AI-powered task management, smart scheduling, and Google Calendar integration. Track your progress and achieve your goals.',
  keywords: ['productivity', 'task management', 'AI scheduling', 'habit tracking', 'goal setting', 'calendar', 'to-do list'],
  authors: [{ name: 'Teyra' }],
  creator: 'Teyra',
  publisher: 'Teyra',
  manifest: '/manifest.json',
  icons: {
    icon: '/teyra-logo-64kb.png',
    shortcut: '/teyra-logo-64kb.png',
    apple: '/teyra-logo-64kb.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Teyra',
  },
  applicationName: 'Teyra',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://teyra.vercel.app',
    siteName: 'Teyra',
    title: 'Teyra - Your Personal Productivity Companion',
    description: 'Build sustainable productivity habits with Mike the Cactus. AI-powered task management and smart scheduling.',
    images: [
      {
        url: '/teyra-logo-64kb.png',
        width: 1200,
        height: 630,
        alt: 'Teyra - Personal Productivity Companion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teyra - Your Personal Productivity Companion',
    description: 'Build sustainable productivity habits with Mike the Cactus. AI-powered task management.',
    images: ['/teyra-logo-64kb.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://teyra.vercel.app',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#A855F7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full" data-theme="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Teyra" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <script src="/extension-bridge.js" defer></script>
      </head>
      <body className={`${inter.variable} font-sans h-full antialiased`}>
        <ReferralTracker />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
