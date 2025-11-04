'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser, useAuth } from '@clerk/nextjs';

interface DashboardClockProps {
  className?: string;
}

export default function DashboardClock({ className = '' }: DashboardClockProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showClock, setShowClock] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Daily reset countdown logic - now uses server-side data
  useEffect(() => {
    if (!user?.id) return;

    const updateCountdown = async () => {
      try {
        // Get server-side daily start time from user progress
        const token = await getToken();
        const response = await fetch('/api/progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          setTimeRemaining(null);
          return;
        }

        const progressData = await response.json();
        const dailyStartTime = progressData.dailyStartTime || progressData.daily_start_time;
        
        if (!dailyStartTime) {
          // No start time yet, user is new
          setTimeRemaining(null);
          return;
        }

        const startTime = new Date(dailyStartTime);
        const now = new Date();
        const resetTime = new Date(startTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from start
        const timeLeft = resetTime.getTime() - now.getTime();

        if (timeLeft <= 0) {
          setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 });
          return;
        }

        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        setTimeRemaining({ hours, minutes, seconds, total: timeLeft });
      } catch (error) {
        console.error('Error fetching reset countdown:', error);
        // Fallback to localStorage for backward compatibility
        const dailyStartKey = `daily_start_time_${user.id}`;
        const storedStartTime = localStorage.getItem(dailyStartKey);
        
        if (storedStartTime) {
          const startTime = new Date(storedStartTime);
          const now = new Date();
          const resetTime = new Date(startTime.getTime() + (24 * 60 * 60 * 1000));
          const timeLeft = resetTime.getTime() - now.getTime();

          if (timeLeft > 0) {
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            setTimeRemaining({ hours, minutes, seconds, total: timeLeft });
          } else {
            setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 });
          }
        } else {
          setTimeRemaining(null);
        }
      }
    };

    // Update immediately
    updateCountdown();

    // Update every 30 seconds (less frequent for server calls)
    const interval = setInterval(updateCountdown, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const switchMode = () => {
    setShowClock(!showClock);
  };

  // If there's no countdown data (new user), show regular clock
  if (!timeRemaining) {
    return (
      <motion.div 
        className={`bg-white/60 backdrop-blur-sm border border-gray-200/30 rounded-lg p-2 shadow-sm ${className}`}
        whileHover={{ scale: 1.01 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        title="Current Time & Date"
      >
        <div className="flex items-center space-x-2">
          <Clock className="w-3 h-3 text-blue-600" />
          
          <div className="flex-1">
            <div className="text-sm font-mono font-semibold text-gray-900">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-gray-500">
              {currentTime.toLocaleDateString([], { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show countdown to daily reset
  const { hours, minutes, seconds, total } = timeRemaining;

  if (total <= 0) {
    return (
      <motion.div 
        className={`bg-green-100/80 backdrop-blur-sm border border-green-200/50 rounded-lg p-2 shadow-sm ${className}`}
        whileHover={{ scale: 1.01 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        title="Daily reset is ready - Incomplete tasks will clear, completed tasks saved, cactus progress stays, mood resets, email sent"
      >
        <div className="flex items-center space-x-2">
          <Mail className="w-3 h-3 text-green-600" />
          
          <div className="flex-1">
            <div className="text-sm font-semibold text-green-800">
              Reset Ready!
            </div>
            <div className="text-xs text-green-600">
              tasks will reset soon
            </div>
          </div>

          <button
            onClick={switchMode}
            className="text-xs px-1.5 py-0.5 bg-white/50 text-green-700 rounded hover:bg-white/80 transition-colors"
            title={showClock ? 'Show countdown' : 'Show current time'}
          >
            {showClock ? '⏰' : '🕐'}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`bg-white/60 backdrop-blur-sm border border-gray-200/30 rounded-lg p-2 shadow-sm ${className}`}
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      title={showClock ? "Current time - switch to see daily reset countdown" : "Daily Reset Countdown - When this reaches zero: Incomplete tasks clear • Completed tasks saved • Cactus progress stays • Mood resets • Email sent"}
    >
      <div className="flex items-center space-x-2">
        {showClock ? (
          <Clock className="w-3 h-3 text-blue-600" />
        ) : (
          <AlertCircle className="w-3 h-3 text-orange-600" />
        )}
        
        <div className="flex-1">
          <div className="text-sm font-mono font-semibold text-gray-900">
            {showClock ? formatTime(currentTime) : 
              `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            }
          </div>
          <div className="text-xs text-gray-500">
            {showClock ? currentTime.toLocaleDateString([], { 
              month: 'short', 
              day: 'numeric' 
            }) : 'until daily reset'}
          </div>
        </div>
        
        <button
          onClick={switchMode}
          className="text-xs px-1.5 py-0.5 bg-blue-100/80 text-blue-700 rounded hover:bg-blue-200/80 transition-colors"
          title={showClock ? 'Show daily reset countdown' : 'Show current time'}
        >
          {showClock ? '⏰' : '🕐'}
        </button>
      </div>
    </motion.div>
  );
}