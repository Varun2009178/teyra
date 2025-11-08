'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded?: () => void;
}

export default function CommandMenu({ isOpen, onClose, onTaskAdded }: CommandMenuProps) {
  const router = useRouter();
  const [taskTitle, setTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setTaskTitle('');
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!taskTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle.trim() })
      });

      if (response.ok) {
        toast.success('Task added');
        setTaskTitle('');
        onClose();
        
        // Dispatch event for calendar refresh
        window.dispatchEvent(new CustomEvent('teyra:task-added'));
        
        if (onTaskAdded) {
          onTaskAdded();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add task');
      }
    } catch (error) {
      toast.error('Failed to add task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Command Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            data-command-menu
          >
            <div className="w-full max-w-md">
            <div className="liquid-glass-strong rounded-2xl p-6 shadow-2xl border border-white/15 liquid-glass-depth">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Add Task</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Task Form */}
              <form onSubmit={handleTaskSubmit}>
                  <input
                    id="task-input"
                    ref={inputRef}
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Task name..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-base focus:outline-none focus:ring-0 focus:border-white/25 focus:bg-white/8 transition-all liquid-glass-input"
                    style={{ 
                      outline: 'none !important', 
                      boxShadow: 'none !important',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      textDecoration: 'none',
                      WebkitTextDecoration: 'none'
                    }}
                    disabled={isSubmitting}
                    data-command-menu
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  
                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm text-white/60 hover:text-white/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!taskTitle.trim() || isSubmitting}
                      className="px-6 py-2 bg-white text-black text-sm font-medium rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Task'}
                    </button>
                  </div>
                </form>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
