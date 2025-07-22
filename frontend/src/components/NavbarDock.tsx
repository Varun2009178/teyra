"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { Home, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export type IconProps = React.HTMLAttributes<SVGElement>;

export function NavbarDock() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();

  const handleHomeClick = () => {
    router.push('/');
  };

  return (
    <div className="relative">
      <Dock 
        iconMagnification={60} 
        iconDistance={400} 
        className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm border border-gray-200/20 dark:border-gray-600/20 rounded-2xl px-12 py-4 gap-12 transition-colors duration-150"
      >
        <DockIcon 
          className={`transition-colors cursor-pointer ${
            pathname === '/' 
              ? 'bg-red-500/80 hover:bg-red-600/80 text-white' 
              : 'bg-white/20 hover:bg-white/40 dark:bg-gray-700/20 dark:hover:bg-gray-600/40'
          }`}
          onClick={handleHomeClick}
        >
          <Home className="size-8" />
        </DockIcon>
        <DockIcon 
          className="bg-white/20 hover:bg-white/40 dark:bg-gray-700/20 dark:hover:bg-gray-600/40 transition-colors cursor-pointer"
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="size-8" /> : <Moon className="size-8" />}
        </DockIcon>
        
        {/* Separator */}
        <div className="w-px h-8 bg-gray-300/50 mx-2"></div>
        
        <DockIcon className="bg-white/20 hover:bg-white/40 transition-colors">
          <Icons.x className="size-8" />
        </DockIcon>
        <DockIcon className="bg-white/20 hover:bg-white/40 transition-colors">
          <Icons.linkedin className="size-8" />
        </DockIcon>
        <DockIcon className="bg-white/20 hover:bg-white/40 transition-colors">
          <Icons.instagram className="size-8" />
        </DockIcon>
        <DockIcon className="bg-white/20 hover:bg-white/40 transition-colors">
          <Icons.tiktok className="size-8" />
        </DockIcon>
      </Dock>
    </div>
  );
}

const Icons = {
  x: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  ),
  linkedin: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  ),
  instagram: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.923-.175-1.297-.49-.374-.315-.49-.748-.49-1.238 0-.49.116-.923.49-1.238.374-.315.807-.49 1.297-.49s.923.175 1.297.49c.374.315.49.748.49 1.238 0 .49-.116.923-.49 1.238-.374.315-.807.49-1.297.49z"
      />
    </svg>
  ),
  tiktok: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
      />
    </svg>
  ),
}; 