'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: {
    title: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => Promise<void>;
}

export function TaskModal({ isOpen, onClose, onCreateTask }: TaskModalProps) {
  const [taskInput, setTaskInput] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent' | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim() || isCreating) return;

    setIsCreating(true);

    const taskData: any = {
      title: taskInput.trim(),
    };

    if (priority) taskData.priority = priority;

    await onCreateTask(taskData);

    // Reset form
    setTaskInput('');
    setPriority(null);
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 task-create-modal">
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
          className="border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
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
              <h3 className="text-white font-light text-xl select-none pointer-events-none">new task</h3>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white"
                style={{ outline: 'none', background: 'transparent' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6" style={{ background: 'transparent' }}>
              {/* Task Title */}
              <input
                ref={inputRef}
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="what needs to be done?"
                className="w-full bg-transparent text-white text-2xl font-light py-4 px-0 border-b border-white/10 placeholder:text-white/30 placeholder:italic"
                style={{ outline: 'none', boxShadow: 'none' }}
                autoComplete="off"
                spellCheck="false"
                disabled={isCreating}
              />

              {/* Quick Priority */}
              <div className="mt-6" style={{ background: 'transparent' }}>
                <div className="flex items-center gap-3 mb-3" style={{ background: 'transparent' }}>
                  <Flag className="w-4 h-4 text-white/30" />
                  <span className="text-sm text-white/40 font-light select-none">priority (optional)</span>
                </div>
                <div className="flex gap-2" style={{ background: 'transparent' }}>
                  {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(priority === p ? null : p)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-light border ${
                        priority === p
                          ? p === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            p === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            p === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                      style={{ outline: 'none' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 mt-8" style={{ background: 'transparent' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm text-white/60 hover:text-white font-light"
                  style={{ outline: 'none', background: 'transparent' }}
                >
                  cancel
                </button>
                <button
                  type="submit"
                  disabled={!taskInput.trim() || isCreating}
                  className="px-6 py-2.5 text-sm bg-white text-black rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90"
                  style={{ outline: 'none' }}
                >
                  {isCreating ? 'creating...' : 'create'}
                </button>
              </div>

              {/* Hint */}
              <p className="text-xs text-white/30 font-light text-center mt-4 select-none pointer-events-none">
                <span className="pointer-events-none">you can add more details after creating</span>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
