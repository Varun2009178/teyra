import { type Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import TransitionProvider from '@/components/TransitionProvider'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from '@/components/ThemeProvider'
import AuthProvider from '@/components/auth/AuthProvider'


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
  return (
    <html lang="en" className="h-full" data-theme="light">
      <body className={`${inter.className} h-full`}>
        <ThemeProvider>
          <AuthProvider>
            <TransitionProvider>{children}</TransitionProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
