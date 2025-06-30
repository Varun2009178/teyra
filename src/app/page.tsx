"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Page() {
  const { data: session } = useSession();

  return (
    <main className="text-center font-bold">
      {/* Original Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center bg-white p-8 text-black">
        <div className="max-w-5xl">
          <h1 className="flex flex-col text-7xl font-black leading-none lg:text-8xl">
            <span className="w-full text-center">Stay Motivated</span>
            <span className="my-2 w-full text-center">Through</span>
            <span className="w-full text-center">Sustainability</span>
          </h1>
          <p className="mt-6 text-2xl text-foreground/80">
            {session
              ? `Welcome back, ${session.user?.name}!`
              : "Grow your habits. Grow your impact."}{" "}
            <span role="img" aria-label="seedling">
              🌱
            </span>
          </p>
          {!session && (
            <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Link
                href="/signup"
                className="w-full rounded-xl border-4 border-black bg-[#A18BFF] px-8 py-4 font-bold text-black shadow-[8px_8px_0_0_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none sm:w-auto"
              >
                Get Started with Teyra
              </Link>
              <a
                href="#meet-mike"
                className="w-full rounded-xl border-4 border-black bg-[#FCA311] px-8 py-4 font-bold text-black shadow-[8px_8px_0_0_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none sm:w-auto"
              >
                Learn More
              </a>
            </div>
          )}
        </div>
        <div className="absolute bottom-10 w-full text-center">
          <p className="animate-bounce text-lg text-foreground/70">
            ↓ Scroll to learn more ↓
          </p>
        </div>
      </section>

      {/* Section 1: Meet Mike */}
      <section
        id="meet-mike"
        className="relative flex min-h-screen flex-col items-center justify-center bg-[#F7F7F7] p-8"
      >
        <div className="max-w-md">
          <h1 className="text-7xl font-black">This is Mike.</h1>
          <Image
            src="/animations/cactus_medium.png"
            alt="Mike the Cactus"
            width={300}
            height={300}
            className="mx-auto my-8"
          />
          <p className="text-2xl text-foreground/80">
            He&apos;s your new accountability partner.
          </p>
        </div>
        <div className="absolute bottom-10 w-full text-center">
          <p className="animate-bounce text-lg text-foreground/70">
            ↓ Scroll for more ↓
          </p>
        </div>
      </section>

      {/* Section 2: Mike's Moods */}
      <section className="flex min-h-screen flex-col items-center justify-center bg-[#dcfce7] p-8">
        <h2 className="text-7xl font-black">He has Three Moods.</h2>
        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="flex flex-col items-center">
            <Image
              src="/animations/cactus_sad.png"
              alt="Sad Mike"
              width={200}
              height={200}
            />
            <p className="mt-4 text-3xl">Sad</p>
          </div>
          <div className="flex flex-col items-center">
            <Image
              src="/animations/cactus_medium.png"
              alt="Neutral Mike"
              width={200}
              height={200}
            />
            <p className="mt-4 text-3xl">Neutral</p>
          </div>
          <div className="flex flex-col items-center">
            <Image
              src="/animations/cactus_happy.png"
              alt="Happy Mike"
              width={200}
              height={200}
            />
            <p className="mt-4 text-3xl">Happy</p>
          </div>
        </div>
      </section>

      {/* Section 3: Making Mike Happy */}
      <section className="flex min-h-screen flex-col items-center justify-center bg-[#fce7f3] p-8 text-black">
        <h2 className="max-w-2xl text-7xl font-black leading-tight">
          Completing Your Tasks Makes Mike Happy!
        </h2>
        <p className="mt-6 max-w-xl text-2xl">
          Each day, you&apos;ll get a new set of sustainable tasks. The more you
          complete, the happier he gets.
        </p>
      </section>

      {/* Section 4: Mike is Motivation */}
      <section className="flex min-h-screen flex-col items-center justify-center bg-[#ffedd5] p-8 text-black">
        <div className="max-w-2xl">
          <h2 className="text-7xl font-black">Mike is Motivation.</h2>
          <p className="mt-6 text-2xl">
            He&apos;s a simple, visual representation of your progress. Keeping Mike
            happy means you&apos;re building strong, consistent, and sustainable
            habits.
          </p>
          {!session && (
            <div className="mt-12">
              <Link
                href="/signup"
                className="rounded-xl border-4 border-black bg-white px-12 py-5 text-2xl font-bold text-black shadow-[8px_8px_0_0_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}