"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: { [key: string]: string } = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "Access denied. You may need to sign in with a different account.",
    AccountNotFound: "Account not found. Please sign up first.",
    AccountExists: "Account already exists. Please log in instead.",
    ServerError: "An unexpected error occurred. Please try again later.",
    Default: "An error occurred during authentication.",
  };

  const message = errorMessages[error || "Default"];

  return (
    <div className="w-full max-w-md rounded-2xl border-4 border-brand-dark-orange bg-yellow-50 p-8 text-center shadow-[8px_8px_0_0_#FCA311]">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">Authentication Error</h1>
      <p className="mb-6 text-gray-600">{message}</p>
      <div className="flex justify-center gap-4">
        <Link
          href="/login"
          className="rounded-lg border-2 border-black bg-[#A18BFF] px-4 py-2 font-bold text-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000]"
        >
          Back to Login
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000]"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F7F4] p-4">
      <Suspense fallback={
        <div className="w-full max-w-md rounded-2xl border-4 border-brand-dark-orange bg-yellow-50 p-8 text-center shadow-[8px_8px_0_0_#FCA311]">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">Loading...</h1>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
} 