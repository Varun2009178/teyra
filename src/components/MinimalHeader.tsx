"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function MinimalHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 animate-fadeIn">
      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-1">
          <Image
            src="/teyra-logo.png"
            alt="Teyra Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold">Teyra</span>
        </Link>
      </div>
    </header>
  );
} 