"use client";

import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import Navbar from "@/components/Navbar";

export default function FeedbackPage() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-light-green">
      <Navbar />
      <main className="flex flex-grow items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0_0_#000]">
          <h1 className="text-4xl font-black text-gray-800">Feedback</h1>
          <p className="mt-4 text-lg text-gray-700">
            Have an idea for a new feature? Found something that is not working
            right? I would love to hear from you! Your feedback is crucial for making
            Teyra better for everyone.
          </p>
          <p className="mt-8 text-lg font-bold text-gray-800 sm:text-xl">
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
              className="inline-flex items-center gap-2 rounded-xl border-4 border-black bg-white px-6 py-3 text-lg font-bold text-black shadow-[8px_8px_0_0_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none sm:px-8 sm:py-4 sm:text-xl"
            >
              <FiArrowLeft />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 