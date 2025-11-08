import { useState, useEffect, useCallback } from 'react';

export function useCommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if desktop on mount and resize
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const openMenu = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    // Only enable keyboard shortcut on desktop
    if (!isDesktop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;

      // Don't trigger if user is typing in an input field (unless it's the command menu itself)
      if (isInput && !target.closest('[data-command-menu]')) {
        return;
      }

      // Don't trigger if command menu is already open
      if (isOpen) {
        // Only handle Escape when open
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
        return;
      }

      // Trigger on "/" key (desktop only)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDesktop]);

  return {
    isOpen,
    openMenu,
    closeMenu,
    toggleMenu,
    isDesktop
  };
}

