import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Teyra team. We\'re here to help you build sustainable productivity habits.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://teyra.vercel.app'}/contact`,
  },
  openGraph: {
    title: 'Contact Us | Teyra',
    description: 'Get in touch with the Teyra team.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://teyra.vercel.app'}/contact`,
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
