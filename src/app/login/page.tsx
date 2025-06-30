"use client";

import { FcGoogle } from "react-icons/fc";
import { FaDiscord, FaHome } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function LoginContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (session?.user) {
      if (session.user.onboarded) {
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
      <div className="w-full max-w-sm rounded-2xl border-4 border-black bg-white p-6 text-center shadow-[8px_8px_0_0_#000] sm:p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-3xl font-bold sm:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-2 text-center text-base text-foreground/70 sm:text-lg">
            Let us get you signed in.
          </p>
          {error && (
            <div className="mt-4 rounded-md bg-red-100 p-3 text-sm font-semibold text-red-700">
              {error}
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
            <span>Do not have an account? </span>
            <Link
              href="/signup"
              className="font-bold text-brand-sea-green hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
} 