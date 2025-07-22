'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMotivationalMessage } from '@/lib/ai';

interface MikeSpeechBubbleProps {
  mood: string;
  completedTasks: number;
}

export function MikeSpeechBubble({ mood, completedTasks }: MikeSpeechBubbleProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMessage = async () => {
      setIsLoading(true);
      try {
        const motivationalMessage = await getMotivationalMessage(mood, completedTasks);
        setMessage(motivationalMessage);
      } catch (error) {
        console.error('Error fetching motivational message:', error);
        // Fallback messages
        if (mood === 'happy') {
          setMessage("You're crushing it today! Keep that awesome energy going! 🎉");
        } else if (mood === 'neutral') {
          setMessage("Making steady progress! Each task you complete is a win! 👍");
        } else {
          setMessage("Let's take it one step at a time. You've got this! 💪");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessage();
  }, [mood, completedTasks]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="relative"
      >
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-12">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 font-medium">{message}</p>
          )}
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-gray-200"></div>
      </motion.div>
    </AnimatePresence>
  );
}