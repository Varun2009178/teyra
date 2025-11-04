import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sustainability',
  description: 'Learn about Teyra\'s commitment to sustainable productivity and environmental responsibility.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://teyra.vercel.app'}/sustainability`,
  },
  openGraph: {
    title: 'Sustainability | Teyra',
    description: 'Teyra\'s commitment to sustainable productivity and environmental responsibility.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://teyra.vercel.app'}/sustainability`,
  },
}

export default function SustainabilityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
