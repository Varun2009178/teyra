"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";

interface ProgressCircleProps {
  completed: number;
  total: number;
  maxValue: number;
  mood: string;
}

export function ProgressCircle({ completed, total, maxValue, mood }: ProgressCircleProps) {
  // Use all-time completed tasks for progress, but cap at maxValue for display
  const displayValue = Math.min(completed, maxValue);

  // Get color based on mood
  const getProgressColor = () => {
    if (mood === 'energized' || mood === 'excited' || mood === 'focused') {
      return '#10B981'; // Green
    } else if (mood === 'neutral') {
      return '#F59E0B'; // Yellow
    } else if (mood === 'overwhelmed' || mood === 'stressed') {
      return '#EF4444'; // Red
    } else if (mood === 'tired') {
      return '#8B5CF6'; // Purple
    } else {
      return '#6B7280'; // Grey fallback
    }
  };

  const getMoodMessage = () => {
    if (mood === 'energized' || mood === 'excited' || mood === 'focused') {
      return 'Amazing Progress! 🎉';
    } else if (mood === 'neutral') {
      return 'Getting There! 🌱';
    } else {
      return 'Keep Going! 💪';
    }
  };

  const getMoodDescription = () => {
    return `${displayValue} of ${maxValue} tasks completed (all-time)`;
  };

  // Only show checkmark when at the final threshold (20) and completed
  const showCheckmark = (mood === 'energized' || mood === 'excited' || mood === 'focused') && completed >= 20;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center space-y-4"
    >
      <div className="relative">
        <AnimatedCircularProgressBar
          max={maxValue}
          value={displayValue}
          min={0}
          gaugePrimaryColor={getProgressColor()}
          gaugeSecondaryColor="#9CA3AF"
          className="text-black font-bold"
        />

        {showCheckmark && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <CheckCircle className="w-8 h-8 text-green-500" />
          </motion.div>
        )}
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {getMoodMessage()}
        </h3>
        <p className="text-sm text-gray-600">
          {getMoodDescription()}
        </p>
      </div>
    </motion.div>
  );
} 