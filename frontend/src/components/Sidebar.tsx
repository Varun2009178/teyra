'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { Calendar, FileText, Settings, HelpCircle, User, Command, Menu, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProBadgeDropdown from '@/components/ProBadgeDropdown';
import { toast } from 'sonner';

interface SidebarProps {
  isPro?: boolean;
  showSettings?: boolean;
  onSettingsClick?: () => void;
  onAccountClick?: () => void;
  onHelpClick?: () => void;
  currentMood?: { emoji: string; label: string } | null;
  showAccountButton?: boolean;
  customDeleteHandler?: () => Promise<void>;
  onCommandMenuClick?: () => void;
  onUpgradeClick?: () => void;
  dailyTasksCount?: number;
}

export default function Sidebar({
  isPro = false,
  showSettings = true,
  onSettingsClick,
  onAccountClick,
  onHelpClick,
  currentMood,
  showAccountButton = false,
  customDeleteHandler,
  onCommandMenuClick,
  onUpgradeClick,
  dailyTasksCount = 0
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize mobile state immediately to prevent desktop sidebar flash
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    return false;
  });
  const [isNavigating, setIsNavigating] = useState(false);

  // Detect mobile devices and update on resize
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 1024 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle navigation with debouncing
  const handleNavigation = (path: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(path);
    window.scrollTo(0, 0);
    setTimeout(() => setIsNavigating(false), 500);
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      // Check for exact match or if it's the root dashboard
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }
    return pathname?.startsWith(path);
  };

  const handleDeleteAccount = async () => {
    if (customDeleteHandler) {
      await customDeleteHandler();
      return;
    }

    const confirmed = window.confirm(
      "⚠️ DELETE ACCOUNT?\n\n" +
      "This will PERMANENTLY delete:\n" +
      "• All your tasks and progress\n" +
      "• Your Mike the Cactus\n" +
      "• All account data\n\n" +
      "IMPORTANT:\n" +
      "• Active subscriptions will continue until the end of your billing period\n" +
      "• NO REFUNDS will be issued\n" +
      "• This action CANNOT be undone\n\n" +
      "Are you absolutely sure?"
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      "⚠️ FINAL WARNING\n\n" +
      "This is your last chance to cancel.\n\n" +
      "Type DELETE to confirm or click Cancel to go back."
    );

    if (doubleConfirmed) {
      try {
        const response = await fetch('/api/user/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          toast.success('Account deleted successfully');
          setTimeout(() => window.location.href = '/', 1500);
        } else {
          const error = await response.json().catch(() => ({}));
          if (error.code === 'VERIFICATION_REQUIRED') {
            toast.error('Account deletion requires additional verification. Please contact support if you need assistance.');
          } else {
            toast.error(error.error || 'Failed to delete account');
          }
        }
      } catch (error) {
        toast.error(`Failed to delete account: ${error instanceof Error ? error.message : 'Network error'}`);
      }
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: null,
      badge: null
    },
    {
      label: 'Notes',
      path: '/dashboard/notes',
      icon: FileText,
      badge: 'beta'
    },
    {
      label: 'Calendar',
      path: '/dashboard/calendar',
      icon: Calendar,
      badge: 'beta'
    }
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-6 border-b border-white/10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isNavigating) return;
            handleNavigation('/dashboard');
            if (isMobile) setIsMobileOpen(false);
          }}
          className="flex items-center gap-3 focus:outline-none p-0 bg-transparent border-0"
          aria-label="Dashboard"
          disabled={isNavigating}
        >
          <Image
            src="/teyra-logo-64kb.png"
            alt="Teyra"
            width={32}
            height={32}
            className="w-8 h-8"
            priority
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-hidden px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <div key={item.path} className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isNavigating) return;
                  handleNavigation(item.path);
                  if (isMobile) setIsMobileOpen(false);
                }}
                disabled={isNavigating}
                type="button"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium relative group ${
                  active
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/90'
                } ${isNavigating ? 'opacity-50 cursor-wait' : ''}`}
              >
                {/* Active indicator - subtle left bar (but not for Dashboard) */}
                {active && item.path !== '/dashboard' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
                {Icon && (
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
                )}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-white/10 text-white/70 text-[10px] font-semibold rounded-md uppercase tracking-wide">
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {isPro && (
          <div className="pt-2">
            <ProBadgeDropdown />
          </div>
        )}

        {currentMood && (
          <div className="px-4 py-3 text-white/50 text-sm bg-white/5 rounded-xl border border-white/10 mt-2">
            {currentMood.emoji} {currentMood.label}
          </div>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-white/10 px-4 py-4 space-y-1">
        {onCommandMenuClick && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCommandMenuClick();
              if (isMobile) setIsMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white/90 text-sm font-medium group"
            title="Command Center (Press / on desktop)"
          >
            <Command className="w-5 h-5" />
            <span className="flex-1 text-left">Command Center</span>
            <span className="text-xs text-white/40 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">/</kbd>
              <span className="text-[10px]">for advanced options</span>
            </span>
          </button>
        )}

        {showAccountButton && (
          <div className="space-y-2">
            <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAccountClick?.();
              if (isMobile) setIsMobileOpen(false);
            }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white/90 text-sm font-medium group cursor-pointer"
            title="Account Status"
          >
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Profile"
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-white/60" />
                </div>
              )}
            <span className="flex-1 text-left">Account</span>
            </div>
            
            {/* Account Status Display */}
            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60 font-medium uppercase">
                  {isPro ? 'PRO' : 'FREE'} account
                </span>
                {isPro ? (
                  <span className="px-2 py-0.5 bg-white text-black rounded text-[10px] font-bold">PRO</span>
                ) : (
                  <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded text-[10px] font-medium">FREE</span>
                )}
              </div>
              {!isPro && onUpgradeClick && dailyTasksCount >= 10 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onUpgradeClick();
                    if (isMobile) setIsMobileOpen(false);
                  }}
                  className="w-full mt-2 px-3 py-1.5 bg-white hover:bg-white/90 text-black rounded-lg text-xs font-semibold transition-colors"
                >
                  upgrade to pro!
          </button>
              )}
            </div>
          </div>
        )}

        {showSettings && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSettingsClick?.();
                if (isMobile) setIsMobileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white/90 text-sm font-medium group"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
              <span className="flex-1 text-left">Settings</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onHelpClick?.();
                if (isMobile) setIsMobileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white/90 text-sm font-medium group"
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="flex-1 text-left">Help</span>
            </button>
          </>
        )}

        <div className="pt-2">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 rounded-full",
                userButtonPopover: "bg-zinc-900 border border-white/10 shadow-xl",
                userButtonTrigger: "rounded-full"
              }
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action
                label="Manage Account"
                labelIcon={<User className="w-4 h-4" />}
                onClick={() => {
                  // Clerk UserButton has built-in account management
                  // This will open the user profile modal
                }}
              />
              <UserButton.Action
                label="Delete Account"
                labelIcon={<Trash2 className="w-4 h-4" />}
                onClick={handleDeleteAccount}
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </>
  );

  // Desktop Sidebar - Always hidden on mobile screens (using CSS)
  if (!isMobile) {
    return (
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-black/60 backdrop-blur-2xl border-r border-white/10 z-30 flex-col">
        <SidebarContent />
      </aside>
    );
  }

  // Mobile Sidebar - Only show hamburger button, sidebar opens on click
  return (
    <>
      {/* Mobile Menu Button - Always visible on mobile */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white hover:bg-white/15 transition-all shadow-lg"
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Sidebar Overlay - Only shown when isMobileOpen is true */}
      <AnimatePresence>
      {isMobileOpen && (
        <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsMobileOpen(false)}
          />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-black/90 via-black/85 to-black/90 backdrop-blur-xl border-r border-white/20 liquid-glass-strong z-50 flex flex-col shadow-2xl"
            >
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <span className="text-white font-semibold text-lg">Menu</span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                  aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent />
            </motion.aside>
        </>
      )}
      </AnimatePresence>
    </>
  );
}

