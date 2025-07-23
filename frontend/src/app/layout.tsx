import { type Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import TransitionProvider from '@/components/TransitionProvider'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/ThemeProvider'
import AuthProvider from '@/components/auth/AuthProvider'
import OnboardingProvider from '@/components/auth/OnboardingProvider'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Teyra - Productivity that understands you',
  description: 'The best damn to-do list in the world.',
  icons: {
    icon: '/teyra-logo-64kb.png',
    shortcut: '/teyra-logo-64kb.png',
    apple: '/teyra-logo-64kb.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full" data-theme="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <OnboardingProvider>
              <TransitionProvider>{children}</TransitionProvider>
            </OnboardingProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
