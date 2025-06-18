'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, LineChart, ListChecks, Users, User, Settings, Award, History } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

const navItems = [
  { href: '/dashboard', label: 'Calendar', icon: CalendarDays },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/impact', label: 'Impact', icon: LineChart },
  { href: '/community', label: 'Community', icon: Users, comingSoon: true },
  { href: '/badges', label: 'Badges', icon: Award, comingSoon: true },
  { href: '/profile', label: 'Profile', icon: User },
];

const Navbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <>
      {/* --- Desktop Sidebar (Visible md and up) --- */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:z-50 bg-[#111111] border-r border-neutral-800 p-6">
        <div className="flex flex-col flex-grow">
          {/* Logo/Brand */}
          <Link href="/dashboard" className="mb-10">
            <h1 className="font-bold text-white text-2xl tracking-tighter">teyra</h1>
          </Link>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.comingSoon ? '#' : item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 relative ${isActive
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
                    } ${item.comingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.comingSoon && (
                    <span className="ml-auto text-xs bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded">Soon</span>
                  )}
                  {isActive && (
                    <motion.div 
                      className="absolute inset-y-0 left-0 w-1 bg-emerald-600 rounded-r-md"
                      layoutId="active-indicator-desktop"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Optional: Settings/Footer link */}
          <div className="mt-auto">
            <Link
                href="/settings" // Example settings path
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ${pathname === '/settings' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'}`}
            >
                <Settings className="mr-3 h-5 w-5" aria-hidden="true" />
                <span>Settings</span>
                 {pathname === '/settings' && (
                    <motion.div 
                      className="absolute inset-y-0 left-0 w-1 bg-emerald-600 rounded-r-md"
                      layoutId="active-indicator-desktop"
                       transition={{ duration: 0.3 }}
                    />
                  )}
            </Link>
          </div>
        </div>
      </aside>

      {/* --- Mobile Bottom Bar (Hidden md and up) --- */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#111111] border-t border-neutral-800">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.comingSoon ? '#' : item.href}
                className={`flex flex-col items-center justify-center p-2 rounded-lg w-full h-full relative transition-colors duration-150 ${isActive ? 'text-emerald-500' : 'text-neutral-500 hover:text-neutral-300'} ${item.comingSoon ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {isActive && (
                    <motion.div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-emerald-600 rounded-b-md"
                      layoutId="active-indicator-mobile"
                      transition={{ duration: 0.3 }}
                    />
                )}
                <item.icon className="h-6 w-6 mb-0.5" aria-hidden="true" />
                <span className="text-xs font-medium">{item.label}</span>
                {/* Simple indicator for coming soon on mobile */}
                {item.comingSoon && <span className="absolute top-1 right-1 w-2 h-2 bg-neutral-600 rounded-full"></span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar; 