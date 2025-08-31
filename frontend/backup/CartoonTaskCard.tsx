'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, ChevronDown, ChevronUp, Split, Loader2 } from 'lucide-react';
import { TaskSplitter } from './TaskSplitter';
import { splitTask } from '@/lib/ai';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface CartoonTaskCardProps {
  task: {
    id: number | string;
    title: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    hasBeenSplit?: boolean;
  };
  onToggleComplete: (id: number | string, completed: boolean) => void;
  onDelete: (id: number | string) => void;
  onAddSubtasks: (subtasks: string[], taskId: number | string) => void;
}

export function CartoonTaskCard({ task, onToggleComplete, onDelete, onAddSubtasks }: CartoonTaskCardProps) {
  const { getToken } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSplitter, setShowSplitter] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitSuccess, setSplitSuccess] = useState(false);

  const handleSplitTask = async () => {
    setIsSplitting(true);
    try {
      // Check daily AI split limit first
      const token = await getToken();
      const limitResponse = await fetch('/api/progress/check-ai-split-limit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (limitResponse.ok) {
        const limitData = await limitResponse.json();
        if (limitData.limitReached) {
          toast.error('Daily AI split limit reached! Try again tomorrow.');
          setIsSplitting(false);
          return;
        }
      }
      
      const subtasks = await splitTask(task.title);
      onAddSubtasks(subtasks, task.id);
      setShowSplitter(false);
    } catch (error) {
      console.error('Error splitting task:', error);
      toast.error('Failed to split task');
    } finally {
      setIsSplitting(false);
    }
  };

  // Only show split button for tasks longer than 50 chars AND not already split
  const shouldShowSplitButton = task.title.length > 50 && !task.hasBeenSplit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-lg hover:scale-[1.002] transition-all duration-200 ${
        shouldShowSplitButton 
          ? 'border-blue-200 bg-gradient-to-r from-white to-blue-50' 
          : 'border-gray-200'
      }`}
    >
      {shouldShowSplitButton && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium px-3 py-1 rounded-t-lg text-center">
          ✨ AI Split Available
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onToggleComplete(task.id, !task.completed)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                  task.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {task.completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </motion.div>
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium ${
                  task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                }`}>
                  {task.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-3">
            {splitSuccess && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg shadow-md flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Replaced with subtasks! ✨</span>
              </motion.div>
            )}
            
            {shouldShowSplitButton && !splitSuccess && (
              <button
                onClick={handleSplitTask}
                disabled={isSplitting}
                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                title="Split into smaller tasks"
              >
                {isSplitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Split className="w-4 h-4" />
                )}
                <span>Split</span>
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="space-y-3">
                  {shouldShowSplitButton && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200 shadow-lg"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Split className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-blue-800">
                            🎯 Break Down This Task!
                          </h4>
                          <p className="text-xs text-blue-600">
                            This task will be replaced with 2-3 smaller, manageable subtasks!
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-blue-100 mb-3">
                        <p className="text-xs text-gray-600 mb-2">Current task:</p>
                        <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded border-l-4 border-blue-400">
                          "{task.title}"
                        </p>
                      </div>
                      
                      <button
                        onClick={handleSplitTask}
                        disabled={isSplitting}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {isSplitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Creating subtasks...</span>
                          </>
                        ) : (
                          <>
                            <Split className="w-4 h-4" />
                            <span>✨ Replace with Subtasks</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                  
                  {showSplitter && (
                    <TaskSplitter
                      taskTitle={task.title}
                      onSplit={onAddSubtasks}
                      onCancel={() => setShowSplitter(false)}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}