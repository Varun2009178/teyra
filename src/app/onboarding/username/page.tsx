"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import MinimalHeader from "@/components/MinimalHeader";

export default function UsernamePage() {
  const router = useRouter();
  const { status, update } = useSession();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/onboarding/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      await update({ username });
      router.push("/onboarding/preferences");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <>
      <MinimalHeader />
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md text-center">
          <h1 className="text-xl text-foreground/80 sm:text-2xl">
            First things first, what should we call you?
          </h1>
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col items-center gap-4"
          >
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. SustainableSue"
              className="w-full max-w-md rounded-xl border-4 border-black p-4 text-center text-lg font-bold shadow-[8px_8px_0_0_#000] focus:outline-none sm:p-6"
              required
            />
            {error && (
              <p className="text-center text-red-500">
                An error occurred. Please try again or contact us at{" "}
                <a href="mailto:greenteyra@gmail.com" className="underline">
                  greenteyra@gmail.com
                </a>
                .
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full max-w-md rounded-xl border-4 border-black bg-[#A18BFF] px-6 py-3 font-bold text-black shadow-[8px_8px_0_0_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none disabled:opacity-50 sm:px-8 sm:py-4"
            >
              {isSubmitting ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}