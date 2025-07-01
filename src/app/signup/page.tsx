"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord, FaHome } from "react-icons/fa";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignupPage() {
  const { data: session } = useSession();
  const router = useRouter();

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
    // Don't force a callbackUrl - let the auth system handle redirects
    // New users will go to onboarding, existing users will be redirected to login with error
    signIn(provider);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light-green">
      <div className="w-full max-w-sm rounded-2xl border-4 border-black bg-white p-6 text-center shadow-[8px_8px_0_0_#000] sm:p-8">
        <h1 className="text-3xl font-black text-gray-800 sm:text-4xl">
          Create Account
        </h1>
        <p className="mt-2 text-base text-gray-600 sm:text-lg">
          Join us on the sustainability journey!
        </p>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleSignIn("google")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100 sm:px-6 sm:py-3"
          >
            <FcGoogle className="text-xl" />
            <span>Sign Up with Google</span>
          </button>
          <button
            onClick={() => handleSignIn("discord")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100 sm:px-6 sm:py-3"
          >
            <FaDiscord className="text-xl text-[#5865F2]" />
            <span>Sign Up with Discord</span>
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
          <span>Already have an account? </span>
          <Link
            href="/login"
            className="font-bold text-brand-sea-green hover:underline"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}