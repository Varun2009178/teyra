"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { FiLogOut, FiSettings, FiSun, FiMoon } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const onboardingPaths = ["/onboarding/username", "/onboarding/preferences"];
  if (onboardingPaths.includes(pathname)) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 bg-white/80 px-4 py-3 shadow-md backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/teyra-logo.png" alt="Teyra Logo" className="h-8 w-auto" />
          <span className="text-xl font-bold text-gray-800">Teyra</span>
        </Link>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <div className="flex items-center gap-4">
              <span className="hidden font-semibold text-gray-700 sm:block">
                {session.user.username || session.user.name}
              </span>
              <Link
                href="/settings"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-600 transition-colors hover:bg-gray-200"
                aria-label="Settings"
              >
                <FiSettings />
              </Link>
              <button
                onClick={handleSignOut}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl text-red-600 transition-colors hover:bg-red-200"
                aria-label="Sign Out"
              >
                <FiLogOut />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {pathname === "/login" ? (
                <Link
                  href="/signup"
                  className="rounded-lg border-2 border-black bg-[#A18BFF] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none sm:px-6 sm:text-base"
                >
                  Get Started
                </Link>
              ) : pathname === "/signup" ? (
                <Link
                  href="/login"
                  className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none sm:px-6 sm:text-base"
                >
                  Log In
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none sm:px-6 sm:text-base"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg border-2 border-black bg-[#A18BFF] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none sm:px-6 sm:text-base"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 