'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

export function FocusMode({ isOpen, onClose, tasks, onToggleTask }: FocusModeProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showAICoach, setShowAICoach] = useState(false);
  const [focusTime, setFocusTime] = useState(0);

  const incompleteTasks = tasks.filter(t => !t.completed);
  const currentTask = incompleteTasks[currentTaskIndex];

  // Timer for focus time
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setFocusTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // AI Coach nudge every 20 minutes
  useEffect(() => {
    if (!isOpen) return;

    const coachInterval = setInterval(() => {
      setShowAICoach(true);
      setTimeout(() => setShowAICoach(false), 8000);
    }, 20 * 60 * 1000); // 20 minutes

    return () => clearInterval(coachInterval);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextTask();
      if (e.key === 'ArrowLeft') previousTask();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (currentTask) onToggleTask(currentTask.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentTaskIndex, currentTask]);

  const nextTask = () => {
    if (currentTaskIndex < incompleteTasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    }
  };

  const previousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-zinc-950"
      >
        {/* Ambient background animation */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 blur-3xl" />
          </motion.div>

          {/* Growing lines animation */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 origin-left"
              style={{
                transform: `rotate(${i * 30}deg)`,
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: [0, 1, 0] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            >
              <div className="w-96 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </motion.div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white/40 z-50"
          style={{ outline: 'none' }}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Focus timer */}
        <div className="absolute top-8 left-8 text-white/40 text-sm font-light">
          focus time: {formatTime(focusTime)}
        </div>

        {/* Main content */}
        <div className="relative h-full flex flex-col items-center justify-center px-4">
          {incompleteTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mb-4 text-6xl">✨</div>
              <h2 className="text-2xl text-white/90 font-light mb-2">all done!</h2>
              <p className="text-white/40 text-sm">you've completed all your tasks</p>
            </motion.div>
          ) : (
            <>
              {/* Task counter */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white/30 text-sm font-light mb-8"
              >
                {currentTaskIndex + 1} of {incompleteTasks.length}
              </motion.div>

              {/* Current task */}
              <motion.div
                key={currentTask?.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-2xl w-full"
              >
                <div className="text-center mb-12">
                  <h1 className="text-4xl md:text-5xl text-white font-light leading-relaxed">
                    {currentTask?.title}
                  </h1>
                </div>

                {/* Complete button */}
                <div className="flex justify-center gap-4">
                  <motion.button
                    onClick={() => currentTask && onToggleTask(currentTask.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white text-black rounded-full font-light flex items-center gap-2"
                    style={{ outline: 'none' }}
                  >
                    <Check className="w-5 h-5" />
                    complete
                  </motion.button>
                </div>
              </motion.div>

              {/* Navigation arrows */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6">
                <button
                  onClick={previousTask}
                  disabled={currentTaskIndex === 0}
                  className="text-white/40 disabled:opacity-20"
                  style={{ outline: 'none' }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <div className="flex gap-2">
                  {incompleteTasks.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentTaskIndex ? 'bg-white' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextTask}
                  disabled={currentTaskIndex === incompleteTasks.length - 1}
                  className="text-white/40 disabled:opacity-20"
                  style={{ outline: 'none' }}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* AI Flow Coach */}
        <AnimatePresence>
          {showAICoach && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-md"
            >
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white/90 text-sm font-light mb-1">
                      you've been focusing for {Math.floor(focusTime / 60)} minutes
                    </p>
                    <p className="text-white/60 text-xs font-light">
                      {focusTime < 600
                        ? "great start! keep this momentum going."
                        : focusTime < 1200
                        ? "you're doing amazing. consider a quick stretch?"
                        : "incredible focus! maybe take a short break?"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard hints */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-white/20 font-light">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-white/5 rounded">←</kbd>
            <kbd className="px-2 py-1 bg-white/5 rounded">→</kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-white/5 rounded">space</kbd>
            <span>complete</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-white/5 rounded">esc</kbd>
            <span>exit</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
