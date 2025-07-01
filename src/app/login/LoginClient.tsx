"use client";

import { FcGoogle } from "react-icons/fc";
import { FaDiscord, FaHome } from "react-icons/fa";
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
  const provider = searchParams.get("provider");

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
    <div className="flex min-h-screen items-center justify-center bg-brand-light-green">
      <div className="w-full max-w-sm rounded-2xl border-4 border-black bg-white p-6 text-center shadow-[8px_8px_0_0_#000] sm:p-8">
        <h1 className="text-3xl font-black text-gray-800 sm:text-4xl">
          Welcome Back!
        </h1>
        <p className="mt-2 text-base text-gray-600 sm:text-lg">
          Sign in to continue your journey.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error === "OAuthSignin" && "Error signing in. Please try again."}
            {error === "OAuthCallback" && "Error during callback. Please try again."}
            {error === "AccountNotFound" && "Account not found. Please sign up first."}
            {error === "AccountExists" && `You already have an account with ${provider || 'another provider'}. Please use that method to sign in.`}
            {error === "Default" && "An error occurred. Please try again."}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleSignIn("google")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100 sm:px-6 sm:py-3"
          >
            <FcGoogle className="text-xl" />
            <span>Sign In with Google</span>
          </button>
          <button
            onClick={() => handleSignIn("discord")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100 sm:px-6 sm:py-3"
          >
            <FaDiscord className="text-xl text-[#5865F2]" />
            <span>Sign In with Discord</span>
          </button>
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100 sm:px-6 sm:py-3"
          >
            <FaHome className="text-xl" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="mt-6 text-sm">
          <span>Don&apos;t have an account? </span>
          <Link
            href="/signup"
            className="font-bold text-brand-sea-green hover:underline"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
} 