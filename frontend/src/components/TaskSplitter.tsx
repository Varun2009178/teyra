'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { splitTask } from '@/lib/ai';
import { CheckCircle, Loader2, SplitSquareVertical } from 'lucide-react';

interface TaskSplitterProps {
  taskTitle: string;
  onSplit: (subtasks: string[], taskId?: number | string) => void;
  onCancel: () => void;
}

export function TaskSplitter({ taskTitle, onSplit, onCancel }: TaskSplitterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSplitTask = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await splitTask(taskTitle);
      setSubtasks(result);
      setIsExpanded(true);
    } catch (err) {
      console.error('Error splitting task:', err);
      setError('Failed to split task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubtasks = () => {
    onSplit(subtasks);
    setIsExpanded(false);
    setSubtasks([]);
  };

  return (
    <div className="mt-2">
      <AnimatePresence>
        {!isExpanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSplitTask}
              disabled={isLoading}
              className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SplitSquareVertical className="h-3 w-3" />
              )}
              Split into smaller tasks
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-md p-3 border border-gray-200"
          >
            <p className="text-sm font-medium mb-2">Suggested subtasks:</p>
            <ul className="space-y-2 mb-3">
              {subtasks.map((subtask, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-sm flex items-start gap-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{subtask}</span>
                </motion.li>
              ))}
            </ul>
            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddSubtasks}
                className="text-xs bg-black hover:bg-gray-800"
              >
                Add these subtasks
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}