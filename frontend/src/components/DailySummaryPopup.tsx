'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Cactus } from '@/components/Cactus';

interface Task {
  id: number | string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface DailySummaryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  progress: {
    completedTasks: number;
    totalTasks: number;
    allTimeCompleted: number;
    mood: string;
    displayCompleted?: number;
    maxValue?: number;
    currentMilestone?: number;
  };
  onTasksReset: () => void;
}

export function DailySummaryPopup({ 
  isOpen, 
  onClose, 
  tasks, 
  progress, 
  onTasksReset 
}: DailySummaryPopupProps) {
  const [isClosing, setIsClosing] = useState(false);

  const completedTasks = tasks.filter(task => task.completed);
  const incompleteTasks = tasks.filter(task => !task.completed);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleResetAndClose = () => {
    onTasksReset();
    handleClose();
  };

  // Calculate Mike's mood based on all-time progress
  const getMikeMood = (allTimeCompleted: number) => {
    if (allTimeCompleted >= 45) return 'excited';
    if (allTimeCompleted >= 25) return 'energized';
    if (allTimeCompleted >= 10) return 'neutral';
    return 'overwhelmed';
  };

  const mikeMood = getMikeMood(progress.allTimeCompleted || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 relative">
              {/* Removed close button - user must reset to continue */}
              
              <div className="text-center">
                <div className="text-4xl mb-4">🌵</div>
                <h2 className="text-2xl font-bold mb-2">Your 24 Hours Are Up!</h2>
                <p className="text-green-100">Check your tasks and see how you did!</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Mike's Progress */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="text-green-600" size={20} />
                    Mike's Progress
                  </h3>
                  <div className="text-2xl">
                    <Cactus mood={mikeMood} size={40} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{progress.allTimeCompleted || 0}</div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{progress.completedTasks || 0}</div>
                    <div className="text-sm text-gray-600">Completed Today</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{progress.totalTasks || 0}</div>
                    <div className="text-sm text-gray-600">Total Today</div>
                  </div>
                </div>
              </div>

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={20} />
                    Completed Tasks ({completedTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3"
                      >
                        <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                        <span className="text-green-800 font-medium">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incomplete Tasks */}
              {incompleteTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <XCircle className="text-red-600" size={20} />
                    Missed Tasks ({incompleteTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {incompleteTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3"
                      >
                        <XCircle className="text-red-600 flex-shrink-0" size={20} />
                        <span className="text-red-800 font-medium">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Tasks */}
              {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <p>No tasks were set for this period.</p>
                </div>
              )}

              {/* Summary Stats */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Star className="text-yellow-500" size={20} />
                  Daily Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {completedTasks.length}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-600">
                      {incompleteTasks.length}
                    </div>
                    <div className="text-sm text-gray-600">Missed</div>
                  </div>
                </div>
                {tasks.length > 0 && (
                  <div className="mt-3 text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round((completedTasks.length / tasks.length) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 border-t">
              <div className="text-center">
                <Button
                  onClick={handleResetAndClose}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-4"
                >
                  Reset Tasks & Start New Day
                </Button>
                <p className="text-xs text-gray-500 mt-3">
                  💡 Mike's progress will stay the same, but your daily tasks will reset
                </p>
                <p className="text-xs text-red-500 mt-2 font-medium">
                  ⚠️ You must reset to continue using the app
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 