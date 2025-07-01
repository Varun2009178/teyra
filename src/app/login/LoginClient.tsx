"use client";

import { FcGoogle } from "react-icons/fc";
import { FaDiscord, FaHome } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function LoginClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.onboarded) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding/username");
      }
    }
  }, [session, status, router]);

  const handleSignIn = async (provider: "google" | "discord") => {
    try {
      await signIn(provider, { 
        callbackUrl: "/dashboard",
        redirect: true 
      });
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border-4 border-brand-dark-orange bg-yellow-50 p-8 text-center shadow-[8px_8px_0_0_#FCA311]">
        <Link href="/" className="mb-8 inline-block">
          <Image
            src="/teyra-logo.png"
            alt="Teyra Logo"
            width={64}
            height={64}
            className="mx-auto"
          />
        </Link>
        <h1 className="mb-2 text-2xl font-bold">Welcome Back!</h1>
        <p className="mb-8 text-gray-600">Sign in to continue your journey.</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error === "OAuthSignin" && "Error signing in. Please try again."}
            {error === "OAuthCallback" && "Error during callback. Please try again."}
            {error === "AccountNotFound" && "Account not found. Please sign up first."}
            {error === "Default" && "An error occurred. Please try again."}
          </div>
        )}
        
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleSignIn("google")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000]"
          >
            <FcGoogle className="text-xl" />
            Continue with Google
          </button>
          <button
            onClick={() => handleSignIn("discord")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#5865F2] px-4 py-2 font-bold text-white shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000]"
          >
            <FaDiscord className="text-xl" />
            Continue with Discord
          </button>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold text-brand-purple hover:underline">
              Sign up
          </Link>
          </p>
        </div>
      </div>
    </main>
  );
} 