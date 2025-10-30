'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Calendar, FileText, Settings, HelpCircle, User, Trash2 } from 'lucide-react';
import ProBadgeDropdown from '@/components/ProBadgeDropdown';
import { toast } from 'sonner';

interface NavbarProps {
  isPro?: boolean;
  showSettings?: boolean;
  onSettingsClick?: () => void;
  onAccountClick?: () => void;
  onHelpClick?: () => void;
  currentMood?: { emoji: string; label: string } | null;
  showAccountButton?: boolean;
  customDeleteHandler?: () => Promise<void>;
}

export default function Navbar({
  isPro = false,
  showSettings = true,
  onSettingsClick,
  onAccountClick,
  onHelpClick,
  currentMood,
  showAccountButton = false,
  customDeleteHandler
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(path);
  };

  const handleDeleteAccount = async () => {
    if (customDeleteHandler) {
      await customDeleteHandler();
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently delete all your tasks, progress, and account data. This action cannot be undone."
    );

    if (confirmed) {
      try {
        const response = await fetch('/api/user/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          toast.success('Account deleted successfully');
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

  return (
    <header className="border-b border-white/10 liquid-glass sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-3 focus:outline-none"
            aria-label="Teyra Home"
          >
            <Image
              src="/teyra-logo-64kb.png"
              alt="Teyra"
              width={40}
              height={40}
              className="w-10 h-10"
              priority
            />
          </button>

          <nav className="hidden sm:flex items-center gap-4 lg:gap-6 text-base">
            <button
              onClick={() => router.push('/dashboard')}
              className={`px-3 py-1 rounded-lg border transition-all duration-150 font-medium ${
                isActive('/dashboard')
                  ? 'text-white border-white/15 bg-white/5'
                  : 'text-white/70 hover:text-white border-transparent hover:border-white/15 hover:bg-white/10'
              }`}
            >
              All Tasks
            </button>

            <button
              onClick={() => router.push('/dashboard/notes')}
              className={`px-3 py-1 rounded-lg border transition-all duration-150 font-medium flex items-center gap-2 ${
                isActive('/dashboard/notes')
                  ? 'text-white border-white/15 bg-white/5'
                  : 'text-white/70 hover:text-white border-transparent hover:border-white/15 hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              Notes
              <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] font-bold rounded uppercase tracking-wide">
                beta
              </span>
            </button>

            <button
              onClick={() => router.push('/dashboard/calendar')}
              className={`px-3 py-1 rounded-lg border transition-all duration-150 font-medium flex items-center gap-2 ${
                isActive('/dashboard/calendar')
                  ? 'text-white border-white/15 bg-white/5'
                  : 'text-white/70 hover:text-white border-transparent hover:border-white/15 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
              <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[10px] font-bold rounded uppercase tracking-wide">
                beta
              </span>
            </button>

            {isPro && <ProBadgeDropdown />}
            {currentMood && (
              <div className="text-white/50 text-sm">
                {currentMood.emoji} {currentMood.label}
              </div>
            )}
          </nav>

          {/* Mobile Navigation */}
          <nav className="flex sm:hidden items-center gap-2 text-sm">
            <button
              onClick={() => router.push('/dashboard')}
              className={`px-2 py-1 rounded-lg transition-all duration-150 font-medium ${
                isActive('/dashboard')
                  ? 'text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Tasks
            </button>

            <button
              onClick={() => router.push('/dashboard/notes')}
              className={`px-2 py-1 rounded-lg transition-all duration-150 font-medium flex items-center gap-1 ${
                isActive('/dashboard/notes')
                  ? 'text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              Notes
            </button>

            <button
              onClick={() => router.push('/dashboard/calendar')}
              className={`px-2 py-1 rounded-lg transition-all duration-150 font-medium flex items-center gap-1 ${
                isActive('/dashboard/calendar')
                  ? 'text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Cal
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showAccountButton && (
            <button
              onClick={onAccountClick}
              className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors rounded hover:bg-white/5"
              title="Account Status"
            >
              <User className="w-5 h-5" />
            </button>
          )}
          {showSettings && (
            <>
              <button
                onClick={onSettingsClick}
                className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors rounded hover:bg-white/5"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onHelpClick}
                className="hidden sm:flex w-9 h-9 items-center justify-center text-white/40 hover:text-white/70 transition-colors rounded hover:bg-white/5"
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </>
          )}
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
                label="Delete Account"
                labelIcon={<Trash2 className="w-4 h-4" />}
                onClick={handleDeleteAccount}
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </header>
  );
}
