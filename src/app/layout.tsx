import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NextAuthSessionProvider from "./SessionProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "Teyra - Stay Motivated Through Sustainability",
    template: "%s | Teyra"
  },
  description: "Grow your habits. Grow your impact. Meet Mike, your sustainability accountability partner who helps you build consistent eco-friendly habits through daily tasks and visual motivation.",
  keywords: [
    "sustainability",
    "habits",
    "motivation",
    "eco-friendly",
    "environmental",
    "daily tasks",
    "habit tracker",
    "green living",
    "sustainable lifestyle",
    "accountability partner"
  ],
  authors: [{ name: "Teyra Team" }],
  creator: "Teyra",
  publisher: "Teyra",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.teyra.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.teyra.app',
    title: 'Teyra - Stay Motivated Through Sustainability',
    description: 'Grow your habits. Grow your impact. Meet Mike, your sustainability accountability partner who helps you build consistent eco-friendly habits through daily tasks and visual motivation.',
    siteName: 'Teyra',
    images: [
      {
        url: '/teyra-logo.png',
        width: 1200,
        height: 630,
        alt: 'Teyra - Stay Motivated Through Sustainability',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teyra - Stay Motivated Through Sustainability',
    description: 'Grow your habits. Grow your impact. Meet Mike, your sustainability accountability partner.',
    images: ['/teyra-logo.png'],
    creator: '@teyra', // Replace with your actual Twitter handle if you have one
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
  verification: {
    // Add these if you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Teyra",
    "description": "Stay motivated through sustainability. Meet Mike, your accountability partner who helps you build consistent eco-friendly habits through daily tasks and visual motivation.",
    "url": "https://www.teyra.app",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "Teyra"
    },
    "keywords": "sustainability, habits, motivation, eco-friendly, environmental, daily tasks, habit tracker, green living"
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <NextAuthSessionProvider>
          <Navbar />
          <main className="animate-fadeIn min-h-screen">{children}</main>
        </NextAuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
