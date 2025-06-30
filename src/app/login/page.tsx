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
        <div className="w-full max-w-sm">
          <h1 className="text-center text-4xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-center text-lg text-foreground/70">
            Let&apos;s get you signed in.
          </p>
          <div className="mt-8 space-y-4">
            <form action={handleGoogleSignIn}>
              <button
                onClick={() => handleSignIn("google")}
                className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                <FcGoogle className="text-xl" />
                <span>Sign In with Google</span>
              </button>
            </form>
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

          <p className="mt-8 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-brand-sea-green">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 