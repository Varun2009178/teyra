"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Star, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MilestoneCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: number;
  newMood: string;
}

export function MilestoneCelebration({ isOpen, onClose, milestone, newMood }: MilestoneCelebrationProps) {
  const getMilestoneMessage = () => {
    switch (milestone) {
      case 10:
        return {
          title: "🎉 Congratulations!",
          message: "You've completed 10 tasks! Your cactus is feeling much better now!",
          icon: <Star className="w-12 h-12 text-yellow-500" />
        };
      case 25:
        return {
          title: "🏆 Amazing Achievement!",
          message: "25 tasks completed! Your cactus is absolutely thriving!",
          icon: <Trophy className="w-12 h-12 text-yellow-500" />
        };
      default:
        return {
          title: "🎯 Milestone Reached!",
          message: `You've completed ${milestone} tasks! Keep up the great work!`,
          icon: <CheckCircle className="w-12 h-12 text-green-500" />
        };
    }
  };

  const getMoodTransition = () => {
    switch (milestone) {
      case 10:
        return "Your cactus has grown from sad to neutral! 🌱";
      case 25:
        return "Your cactus is now happy and energized! 🌵✨";
      default:
        return "Your cactus is evolving! 🌵";
    }
  };

  const milestoneInfo = getMilestoneMessage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 500, damping: 30 }}
              className="flex justify-center mb-6"
            >
              {milestoneInfo.icon}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              {milestoneInfo.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              {milestoneInfo.message}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6 border border-green-200"
            >
              <p className="text-sm font-medium text-gray-700">
                {getMoodTransition()}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={onClose}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                Continue My Journey! 🚀
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 