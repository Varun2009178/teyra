"use client";

import { ClerkProvider } from "@clerk/nextjs";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          helpPageUrl: "/help",
          logoImageUrl: "/teyra-logo-64kb.png", 
          logoPlacement: "inside",
          privacyPageUrl: "/privacy",
          termsPageUrl: "/terms",
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
} 