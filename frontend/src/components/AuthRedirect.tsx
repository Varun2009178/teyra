"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function AuthRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once when the component mounts and user is signed in
    if (isLoaded && isSignedIn && pathname === "/" && !hasRedirected.current) {
      hasRedirected.current = true;
      // Use setTimeout to prevent immediate redirect that causes flickering
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    }
  }, [isLoaded, isSignedIn]); // Remove pathname and router from dependencies

  return null;
} 