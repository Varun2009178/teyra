import { type Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import AuthProvider from '@/components/auth/AuthProvider'

const inter = Inter({ 
  subsets: ['latin'],
  weights: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Teyra - Your Personal Productivity Companion',
  description: 'Build sustainable productivity habits with Mike the Cactus. PWA with push notifications.',
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
      </head>
      <body className={`${inter.variable} font-sans h-full antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
