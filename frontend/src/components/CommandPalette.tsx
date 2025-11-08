'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, FileText, Zap } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string, args?: string) => void;
}

interface CommandItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  action: string;
  keywords: string[];
}

const commands: CommandItem[] = [
  {
    id: 'task',
    name: '/task',
    description: 'create a new task',
    icon: Zap,
    action: 'task',
    keywords: ['task', 'todo', 'create', 'new', 'add'],
  },
  {
    id: 'search',
    name: '/search',
    description: 'find any task instantly',
    icon: Command,
    action: 'search',
    keywords: ['search', 'find', 'lookup', 'query'],
  },
  {
    id: 'note',
    name: '/note',
    description: 'start a new note',
    icon: FileText,
    action: 'note',
    keywords: ['note', 'write', 'journal', 'document'],
  },
];

export function CommandPalette({ isOpen, onClose, onCommand }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = search
    ? commands.filter((cmd) =>
        cmd.keywords.some((kw) => kw.toLowerCase().includes(search.toLowerCase())) ||
        cmd.name.toLowerCase().includes(search.toLowerCase())
      )
    : commands;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onCommand(filteredCommands[selectedIndex].action, search.replace(/^\/\w+\s*/, ''));
            setSearch('');
            onClose();
          }
          break;
      }
    },
    [isOpen, selectedIndex, filteredCommands, onCommand, onClose, search]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 modal-backdrop"
          style={{ backgroundColor: 'rgba(20, 20, 25, 0.95)', zIndex: -1 }}
          onClick={onClose}
        />

        {/* Command Palette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl mx-4"
        >
          <div 
            className="border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'rgb(50, 50, 55)' }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
              <Command className="w-5 h-5 text-white/40" />
              <input
                ref={inputRef}
                type="text"
                placeholder="type a command or search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-white text-lg placeholder:text-white/30 outline-none font-light"
                autoComplete="off"
                spellCheck="false"
              />
              <kbd className="hidden sm:block px-2 py-1 text-xs text-white/40 bg-white/5 rounded border border-white/10 font-mono">
                esc
              </kbd>
            </div>

            {/* Commands List */}
            <div className="max-h-[400px] overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="px-4 py-12 text-center text-white/30 text-sm">
                  no commands found
                </div>
              ) : (
                <div className="py-2">
                  {filteredCommands.map((cmd, index) => {
                    const Icon = cmd.icon;
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          onCommand(cmd.action, search.replace(/^\/\w+\s*/, ''));
                          setSearch('');
                          onClose();
                        }}
                        className={`w-full flex items-center gap-4 px-4 py-3 ${
                          isSelected
                            ? 'bg-white/5 border-l-2 border-white'
                            : 'border-l-2 border-transparent'
                        }`}
                        style={{ outline: 'none' }}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center pointer-events-none ${
                          isSelected ? 'bg-white/10' : 'bg-white/5'
                        }`}>
                          <Icon className="w-5 h-5 text-white pointer-events-none" />
                        </div>
                        <div className="flex-1 text-left select-none pointer-events-none">
                          <div className="text-white font-light select-none pointer-events-none">{cmd.name}</div>
                          <div className="text-sm text-white/40 font-light select-none pointer-events-none">{cmd.description}</div>
                        </div>
                        {isSelected && (
                          <kbd className="hidden sm:block px-2 py-1 text-xs text-white/40 bg-white/5 rounded border border-white/10 font-mono">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/[0.01]">
              <div className="flex items-center gap-4 text-xs text-white/30 font-light">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">↓</kbd>
                  <span>navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">↵</kbd>
                  <span>select</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
