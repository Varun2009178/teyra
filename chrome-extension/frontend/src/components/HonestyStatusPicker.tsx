"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MoreHorizontal, Pause } from 'lucide-react';
import { TaskStatus } from '@/lib/types';

interface HonestyStatusPickerProps {
  currentStatus: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  disabled?: boolean;
}

// Animation variants for buttons
const buttonVariants = {
  idle: {
    scale: 1,
    backgroundColor: 'transparent'
  },
  hover: {
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  },
  selected: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

export function HonestyStatusPicker({ currentStatus, onStatusChange, disabled = false }: HonestyStatusPickerProps) {
  const statusOptions = [
    {
      status: TaskStatus.DONE,
      icon: Check,
      label: 'Completed',
      tooltip: 'I finished this task completely ✅',
      colors: {
        idle: 'text-gray-400',
        hover: 'text-green-600 bg-green-50',
        active: 'text-green-700 bg-green-100 shadow-sm'
      }
    },
    {
      status: TaskStatus.PARTIALLY_DONE,
      icon: MoreHorizontal,
      label: 'Partially Done',
      tooltip: 'I made some progress but didn\'t finish 🌓',
      colors: {
        idle: 'text-gray-400',
        hover: 'text-yellow-600 bg-yellow-50',
        active: 'text-yellow-700 bg-yellow-100 shadow-sm'
      }
    },
    {
      status: TaskStatus.SKIPPED_INTENTIONALLY,
      icon: Pause,
      label: 'Skipped',
      tooltip: 'I chose to skip this task intentionally ⏸️',
      colors: {
        idle: 'text-gray-400',
        hover: 'text-gray-600 bg-gray-50',
        active: 'text-gray-700 bg-gray-100 shadow-sm'
      }
    }
  ];

  return (
    <div className="flex gap-1">
      {statusOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = currentStatus === option.status;
        
        return (
          <motion.button
            key={option.status}
            variants={buttonVariants}
            initial="idle"
            animate={isSelected ? "selected" : "idle"}
            whileHover={disabled ? undefined : "hover"}
            whileTap={disabled ? undefined : "tap"}
            onClick={() => {
              if (!disabled) {
                if (isSelected) {
                  // Toggle back to default NOT_DONE state
                  onStatusChange(TaskStatus.NOT_DONE);
                } else {
                  onStatusChange(option.status);
                }
              }
            }}
            disabled={disabled}
            className={`
              relative w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-200 ease-out
              ${isSelected 
                ? option.colors.active
                : option.colors.idle
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:' + option.colors.hover}
            `}
            title={isSelected ? 'Click to reset to default' : option.tooltip}
          >
            {/* Background highlight for selected state */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                  style={{
                    backgroundColor: isSelected 
                      ? option.status === TaskStatus.DONE ? 'rgba(34, 197, 94, 0.1)'
                      : option.status === TaskStatus.PARTIALLY_DONE ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(107, 114, 128, 0.1)'
                      : 'transparent'
                  }}
                />
              )}
            </AnimatePresence>
            
            {/* Icon with smooth transitions */}
            <motion.div
              animate={{
                rotate: isSelected ? [0, -10, 10, 0] : 0,
                scale: isSelected ? 1.1 : 1
              }}
              transition={{
                rotate: {
                  duration: 0.4,
                  ease: "easeInOut"
                },
                scale: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }
              }}
            >
              <Icon className="w-4 h-4 relative z-10" />
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactHonestyStatusPicker({ currentStatus, onStatusChange, disabled = false }: HonestyStatusPickerProps) {
  const statusOptions = [
    { status: TaskStatus.DONE, emoji: '✅', color: 'green' },
    { status: TaskStatus.PARTIALLY_DONE, emoji: '🌓', color: 'yellow' },
    { status: TaskStatus.SKIPPED_INTENTIONALLY, emoji: '⏸️', color: 'gray' }
  ];

  const getStatusColor = (status: TaskStatus, isSelected: boolean) => {
    const colorMap = {
      [TaskStatus.DONE]: isSelected ? 'bg-green-500 border-green-500' : 'bg-green-100 border-green-300 hover:bg-green-200',
      [TaskStatus.PARTIALLY_DONE]: isSelected ? 'bg-yellow-500 border-yellow-500' : 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200',
      [TaskStatus.NOT_DONE]: isSelected ? 'bg-red-500 border-red-500' : 'bg-red-100 border-red-300 hover:bg-red-200',
      [TaskStatus.SKIPPED_INTENTIONALLY]: isSelected ? 'bg-gray-500 border-gray-500' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
    };
    return colorMap[status];
  };

  return (
    <div className="flex gap-1">
      {statusOptions.map((option) => {
        const isSelected = currentStatus === option.status;
        
        return (
          <motion.button
            key={option.status}
            whileHover={{ scale: disabled ? 1 : 1.1 }}
            whileTap={{ scale: disabled ? 1 : 0.9 }}
            onClick={() => {
              if (!disabled) {
                if (isSelected) {
                  onStatusChange(TaskStatus.NOT_DONE);
                } else {
                  onStatusChange(option.status);
                }
              }
            }}
            disabled={disabled}
            className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200
              ${getStatusColor(option.status, isSelected)}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isSelected ? 'shadow-md transform scale-110' : ''}
            `}
            title={`Mark as ${option.status.replace('_', ' ')}`}
          >
            <span className="text-sm">{option.emoji}</span>
          </motion.button>
        );
      })}
    </div>
  );
}