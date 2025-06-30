import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NextAuthSessionProvider from "./SessionProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Teyra",
  description: "Stay Motivated Through Sustainability",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NextAuthSessionProvider>
          <Navbar />
          <main className="animate-fadeIn">{children}</main>
        </NextAuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
