"use client";

import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function FeedbackPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F7F4] p-8">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-5xl font-black text-gray-800">
          Suggestions & Bugs
        </h1>
        <p className="mt-6 text-lg text-gray-700">
          Have an idea for a new feature? Found something that isn't working
          right? I'd love to hear from you! Your feedback is crucial for making
          this app better for everyone.
        </p>
        <p className="mt-8 text-xl font-bold text-gray-800">
          Please send all feedback to:
          <a
            href="mailto:greenteyra@gmail.com"
            className="ml-2 text-brand-sea-green underline transition-all hover:text-green-700"
          >
            greenteyra@gmail.com
          </a>
        </p>
        <div className="mt-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border-4 border-black bg-white px-8 py-4 text-xl font-bold text-black shadow-[8px_8px_0_0_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none"
          >
            <FiArrowLeft />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </main>
  );
} 