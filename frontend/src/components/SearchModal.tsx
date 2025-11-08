'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, Tag } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string | null;
  tags?: string[] | null;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  results: Task[];
  onSelectTask: (taskId: string) => void;
}

export function SearchModal({ isOpen, onClose, onSearch, results, onSelectTask }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query) {
        onSearch(query);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, onSearch]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl"
        >
          <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
              <Search className="w-5 h-5 text-white/40" />
              <input
                ref={inputRef}
                type="text"
                placeholder="search tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-white text-lg placeholder:text-white/30 outline-none font-light"
                autoComplete="off"
                spellCheck="false"
              />
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {query && results.length === 0 && (
                <div className="px-4 py-12 text-center text-white/30 text-sm">
                  no tasks found
                </div>
              )}

              {!query && (
                <div className="px-4 py-12 text-center text-white/30 text-sm">
                  type to search your tasks
                </div>
              )}

              {results.length > 0 && (
                <div className="py-2">
                  {results.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        onSelectTask(task.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/5 text-left"
                      style={{ outline: 'none' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-white font-light ${task.completed ? 'line-through text-white/40' : ''}`}>
                          {task.title}
                        </div>
                        {(task.due_date || (task.tags && task.tags.length > 0)) && (
                          <div className="flex items-center gap-2 mt-1">
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-xs text-white/40">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                            {task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {task.tags.map((tag: string) => (
                                  <span key={tag} className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded select-none">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/[0.01]">
              <div className="flex items-center gap-2 text-xs text-white/30 font-light">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">↵</kbd>
                <span>select</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30 font-light">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">esc</kbd>
                <span>close</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
