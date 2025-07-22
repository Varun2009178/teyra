'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 shadow-md p-4 flex items-center justify-center"
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-1">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [-5, 5, -5, 5, 0]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              repeatDelay: 1
            }}
          >
            <Flame className="h-6 w-6 text-orange-500" />
          </motion.div>
          <span className="text-lg font-bold text-gray-800">Current Streak</span>
        </div>
        
        <div className="flex items-baseline">
          <motion.span
            key={streak}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-orange-500"
          >
            {streak}
          </motion.span>
          <span className="text-gray-500 ml-1">days</span>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          Complete at least one task daily to build your streak!
        </p>
      </div>
    </motion.div>
  );
}