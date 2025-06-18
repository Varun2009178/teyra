import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import ClientLayoutWrapper from "@/lib/components/client-layout-wrapper";

export const metadata: Metadata = {
  title: "teyra",
  description: "Build consistency and make an impact with daily motivational and sustainable tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-black">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased text-white`}
      >
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
