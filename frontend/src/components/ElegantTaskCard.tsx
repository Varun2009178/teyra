'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, Star } from 'lucide-react';

interface Task {
  id: number | string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface ElegantTaskCardProps {
  task: Task;
  onToggleComplete: (id: number | string, completed: boolean) => void;
  onDelete: (id: number | string) => void;
}

export function ElegantTaskCard({ task, onToggleComplete, onDelete }: ElegantTaskCardProps) {
  // Very subtle random rotation for a slightly hand-placed feel
  const rotation = React.useMemo(() => {
    return Math.random() * 0.6 - 0.3; // Between -0.3 and 0.3 degrees
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{ transform: `rotate(${rotation}deg)` }}
      className={`bg-white rounded-lg shadow-sm border ${
        task.completed 
          ? 'border-gray-200 bg-gray-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      whileHover={{ 
        y: -2,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
      }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <motion.button
              onClick={() => onToggleComplete(task.id, !task.completed)}
              whileTap={{ scale: 0.9 }}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                task.completed 
                  ? 'bg-black border-black' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {task.completed && (
                <Check className="w-3 h-3 text-white" />
              )}
            </motion.button>
            
            <span
              className={`flex-1 ${
                task.completed 
                  ? 'line-through text-gray-500' 
                  : 'text-gray-800'
              }`}
            >
              {task.title}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {task.completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 15, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
              </motion.div>
            )}
            
            <motion.button
              onClick={() => onDelete(task.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-6 h-6 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}