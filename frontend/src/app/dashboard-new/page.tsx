'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Plus, Check, Trash2, Sparkles, Calendar as CalendarIcon } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { CommandPalette } from '@/components/CommandPalette';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export default function DashboardNew() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);

  // Load tasks
  useEffect(() => {
    loadTasks();
    loadStats();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStreak(data.current_streak || 0);
      setCompletedToday(data.completed_today || 0);
    } catch (error) {
      console.error('error loading stats:', error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      // "/" to open command palette
      if (e.key === '/' && !isCommandOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandOpen]);

  const handleCommand = async (command: string, args?: string) => {
    switch (command) {
      case 'task':
        if (args?.trim()) {
          await createTask(args.trim());
        } else {
          // Focus on new task input
          document.getElementById('new-task-input')?.focus();
        }
        break;
      case 'note':
        toast.info('notes feature coming soon');
        break;
      case 'plan':
        await handleAIPlan();
        break;
      case 'reflect':
        await handleReflect();
        break;
    }
  };

  const createTask = async (title: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      setTasks((prev) => [data.task, ...prev]);
      setNewTaskInput('');
      toast.success('task created');
    } catch (error) {
      console.error('error creating task:', error);
      toast.error('failed to create task');
    }
  };

  const toggleTask = async (id: string) => {
    try {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (response.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
        );
        if (!task.completed) {
          setCompletedToday((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error('error toggling task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success('task deleted');
    } catch (error) {
      console.error('error deleting task:', error);
    }
  };

  const handleAIPlan = async () => {
    toast.info('ai planning your day...');
    // TODO: Implement AI planning
  };

  const handleReflect = async () => {
    toast.info('generating weekly insights...');
    // TODO: Implement reflection
  };

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <>
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onCommand={handleCommand}
      />

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-xl z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-light">teyra</h1>
            </div>

            <div className="flex items-center gap-6">
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <span className="font-light">{completedToday} done today</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-light">{streak} day streak</span>
                </div>
              </div>

              {/* Command hint */}
              <button
                onClick={() => setIsCommandOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm"
              >
                <Command className="w-4 h-4 text-white/60" />
                <span className="hidden sm:inline text-white/60 font-light">press / or ⌘k</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-6 py-12">
          {/* Welcome message */}
          <div className="mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-light mb-2"
            >
              {user?.firstName ? `hey, ${user.firstName.toLowerCase()}` : 'hey there'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/40 font-light"
            >
              what are you working on today?
            </motion.p>
          </div>

          {/* Quick add task */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newTaskInput.trim()) {
                  createTask(newTaskInput.trim());
                }
              }}
              className="flex items-center gap-3"
            >
              <Plus className="w-5 h-5 text-white/40" />
              <input
                id="new-task-input"
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder="add a task... (or press / for commands)"
                className="flex-1 bg-transparent border-b border-white/10 text-lg font-light py-3 outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
                autoComplete="off"
                spellCheck="false"
              />
            </form>
          </motion.div>

          {/* Tasks */}
          <div className="space-y-12">
            {/* Incomplete tasks */}
            {incompleteTasks.length > 0 && (
              <div>
                <h3 className="text-sm text-white/40 font-light mb-4 uppercase tracking-wider">
                  to do ({incompleteTasks.length})
                </h3>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {incompleteTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                        className="group flex items-center gap-4 p-4 rounded-lg hover:bg-white/[0.02] transition-colors"
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="w-6 h-6 rounded border border-white/20 hover:border-white/40 transition-colors flex-shrink-0"
                        />
                        <span className="flex-1 text-white/90 font-light">{task.title}</span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-sm text-white/40 font-light mb-4 uppercase tracking-wider">
                  completed ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {completedTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group flex items-center gap-4 p-4 rounded-lg hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="w-6 h-6 rounded border border-white/20 bg-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-black" strokeWidth={3} />
                        </div>
                        <span className="flex-1 text-white/40 font-light line-through">
                          {task.title}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Empty state */}
            {tasks.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/30 font-light mb-2">no tasks yet</p>
                <p className="text-white/20 text-sm font-light">
                  press <kbd className="px-2 py-1 bg-white/5 rounded text-white/30">/</kbd> to get started
                </p>
              </motion.div>
            )}
          </div>
        </main>

        {/* Subtle background pattern */}
        <div
          className="fixed inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    </>
  );
}
