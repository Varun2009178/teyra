import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NextAuthSessionProvider from "./SessionProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Teyra",
  description: "Stay Motivated Through Sustainability",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
