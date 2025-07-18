"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, MessageSquare, Send } from 'lucide-react';

interface TaskSummary {
  completed: string[];
  not_completed: string[];
  total: number;
  completed_count: number;
  not_completed_count: number;
}

interface DailyResetPopupProps {
  taskSummary: TaskSummary | null;
  onClose: () => void;
  onReflectionSubmit?: (reflection: string) => void;
}

export const DailyResetPopup: React.FC<DailyResetPopupProps> = ({
  taskSummary,
  onClose,
  onReflectionSubmit
}) => {
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReflectionSubmit = async () => {
    if (!reflection.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (onReflectionSubmit) {
        await onReflectionSubmit(reflection);
      }
      // You could also save the reflection to the database here
      setReflection('');
    } catch (error) {
      console.error('Error submitting reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!taskSummary) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🌵</div>
                <div>
                  <h2 className="text-xl font-bold">Daily Reset Complete!</h2>
                  <p className="text-green-100 text-sm">Here's your task summary from yesterday</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{taskSummary.completed_count}</div>
                <div className="text-sm text-green-700 font-medium">Completed</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-600">{taskSummary.not_completed_count}</div>
                <div className="text-sm text-red-700 font-medium">Not Completed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{taskSummary.total}</div>
                <div className="text-sm text-blue-700 font-medium">Total</div>
              </div>
            </div>

            {/* Completed Tasks */}
            {taskSummary.completed.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-green-700 font-semibold">
                  <CheckCircle size={20} />
                  Completed Tasks
                </h3>
                <div className="space-y-2">
                  {taskSummary.completed.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                      <span className="text-green-800">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Not Completed Tasks */}
            {taskSummary.not_completed.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-red-700 font-semibold">
                  <XCircle size={20} />
                  Not Completed
                </h3>
                <div className="space-y-2">
                  {taskSummary.not_completed.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <XCircle size={16} className="text-red-600 flex-shrink-0" />
                      <span className="text-red-800">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reflection Section */}
            {taskSummary.not_completed.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-gray-700 font-semibold">
                  <MessageSquare size={20} />
                  Reflection
                </h3>
                <p className="text-sm text-gray-600">
                  What do you think went wrong with the missed tasks? This helps us improve your experience.
                </p>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Share your thoughts on what prevented you from completing these tasks..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
                <button
                  onClick={handleReflectionSubmit}
                  disabled={!reflection.trim() || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                  {isSubmitting ? 'Submitting...' : 'Submit Reflection'}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Your mood check-in and AI task splitter have been refreshed for today!
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Start Fresh Today 🌵
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 