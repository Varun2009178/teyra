"use client";

import { FcGoogle } from "react-icons/fc";
import { FaDiscord, FaHome } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (session?.user) {
      if (session.user.onboardingComplete) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding/username");
      }
    }
  }, [session, router]);

  const handleSignIn = (provider: "google" | "discord") => {
    // Set a temporary cookie to indicate a login attempt
    document.cookie = "next-auth.login-attempt=true; path=/; max-age=5"; // Expires in 5 seconds
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light-blue">
      <div className="w-full max-w-sm rounded-2xl border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0_0_#000]">
        <h1 className="text-4xl font-black text-gray-800">Welcome Back!</h1>
        <p className="mt-2 text-gray-600">Please sign in to continue.</p>

        {error === "AccountExists" && (
          <div className="mt-6 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
            <p className="font-bold">Account Already Exists</p>
            <p className="text-sm">
              An account with that email already exists. Please sign in.
            </p>
          </div>
        )}
        
        {error === "AccountNotFound" && (
          <div className="mt-6 rounded-lg border-2 border-red-300 bg-red-50 p-4 text-red-700">
            <p className="font-bold">Account Not Found</p>
            <p className="text-sm">
              We couldn't find an account with that email. Please{" "}
              <Link href="/signup" className="font-bold underline">
                Sign Up
              </Link>{" "}
              instead.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleSignIn("google")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <FcGoogle className="text-xl" />
            <span>Sign In with Google</span>
          </button>
          <button
            onClick={() => handleSignIn("discord")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <FaDiscord className="text-xl text-[#5865F2]" />
            <span>Sign In with Discord</span>
          </button>
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <FaHome className="text-xl" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="mt-6 text-sm">
          <span>Don't have an account? </span>
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