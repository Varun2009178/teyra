"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FiLogOut, FiSettings, FiSun, FiMoon } from "react-icons/fi";
import SignOutButton from "./SignOutButton";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <Image
                className="h-8 w-auto"
                src="/teyra-logo.png"
                alt="Teyra"
                width={32}
                height={32}
              />
              <span className="font-bold text-xl">Teyra</span>
            </Link>
          </div>
          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {session ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Settings
                    </Link>
                    <SignOutButton />
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none sm:px-5"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="ml-2 rounded-lg border-2 border-black bg-[#A18BFF] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none sm:px-5"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 