'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSubtask: (title: string) => Promise<void>;
  parentTaskTitle: string;
}

export function SubtaskModal({ isOpen, onClose, onCreateSubtask, parentTaskTitle }: SubtaskModalProps) {
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskInput.trim() || isCreating) return;

    setIsCreating(true);
    await onCreateSubtask(subtaskInput.trim());
    setSubtaskInput('');
    setIsCreating(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 subtask-modal">
        {/* Backdrop */}
        <div
          className="absolute inset-0 modal-backdrop"
          style={{ backgroundColor: 'rgba(20, 20, 25, 0.95)', zIndex: -1 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-md"
          style={{
            pointerEvents: 'none'
          }}
        >
          <div
            className="border border-white/20 rounded-2xl shadow-2xl overflow-hidden subtask-modal-container"
            style={{
              backgroundColor: 'rgb(50, 50, 55)',
              background: 'rgb(50, 50, 55)',
              pointerEvents: 'auto',
              transition: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(50, 50, 55)';
              e.currentTarget.style.background = 'rgb(50, 50, 55)';
            }}
            onMouseMove={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(50, 50, 55)';
              e.currentTarget.style.background = 'rgb(50, 50, 55)';
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(50, 50, 55)';
              e.currentTarget.style.background = 'rgb(50, 50, 55)';
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10" style={{ background: 'transparent' }}>
              <div>
                <h3 className="text-white font-light text-xl select-none pointer-events-none">add subtask</h3>
                <p className="text-white/40 text-sm font-light mt-1 select-none pointer-events-none">
                  for: {parentTaskTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/40"
                style={{ outline: 'none', background: 'transparent' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6" style={{ background: 'transparent' }}>
              {/* Subtask Title */}
              <input
                ref={inputRef}
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="what's the subtask?"
                className="w-full bg-transparent text-white text-2xl font-light py-4 px-0 border-b border-white/10 placeholder:text-white/30 placeholder:italic"
                style={{ outline: 'none', boxShadow: 'none' }}
                autoComplete="off"
                spellCheck="false"
                disabled={isCreating}
              />

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 mt-8" style={{ background: 'transparent' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm text-white/60 font-light"
                  style={{ outline: 'none', background: 'transparent' }}
                >
                  cancel
                </button>
                <button
                  type="submit"
                  disabled={!subtaskInput.trim() || isCreating}
                  className="px-6 py-2.5 text-sm bg-white text-black rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ outline: 'none' }}
                >
                  {isCreating ? 'creating...' : 'create'}
                </button>
              </div>

              {/* Hint */}
              <p className="text-xs text-white/30 font-light text-center mt-4 select-none pointer-events-none">
                <span className="pointer-events-none">subtask will be nested under parent</span>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
