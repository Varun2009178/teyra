"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Mail, RefreshCw } from 'lucide-react';

interface DailyCountdownTimerProps {
  lastDailyReset: string | null;
  lastActivityAt: string | null;
  timezone?: string;
  onResetDue?: (isDue: boolean) => void;
  onEmailDue?: (isDue: boolean) => void;
  isNewUser?: boolean;
}

export const DailyCountdownTimer: React.FC<DailyCountdownTimerProps> = ({
  lastDailyReset,
  lastActivityAt,
  timezone = 'UTC',
  onResetDue,
  onEmailDue,
  isNewUser = false
}) => {
  const [timeUntilReset, setTimeUntilReset] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  
  const [timeUntilEmail, setTimeUntilEmail] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });

  const [isResetDue, setIsResetDue] = useState(false);
  const [isEmailDue, setIsEmailDue] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      
      // Calculate time until next daily reset (24 hours from last reset)
      let nextResetTime: Date;
      if (lastDailyReset) {
        const lastReset = new Date(lastDailyReset);
        nextResetTime = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // If no last reset, assume it's due now
        nextResetTime = now;
      }
      
      const resetDiff = nextResetTime.getTime() - now.getTime();
      const resetSeconds = Math.max(0, Math.floor(resetDiff / 1000));
      
      const resetHours = Math.floor(resetSeconds / 3600);
      const resetMinutes = Math.floor((resetSeconds % 3600) / 60);
      const resetSecs = resetSeconds % 60;
      
      setTimeUntilReset({
        hours: resetHours,
        minutes: resetMinutes,
        seconds: resetSecs,
        totalSeconds: resetSeconds
      });
      
      // Only show reset as due if timer has reached zero AND user is not new
      // AND the last reset was actually more than 24 hours ago
      const lastResetTime = lastDailyReset ? new Date(lastDailyReset) : null;
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const actuallyNeedsReset = lastResetTime && lastResetTime < twentyFourHoursAgo;
      
      const newIsResetDue = resetSeconds === 0 && !isNewUser && actuallyNeedsReset;
      setIsResetDue(newIsResetDue);
      onResetDue?.(newIsResetDue);
      
      // Calculate time until next email (48 hours from last activity)
      let nextEmailTime: Date;
      if (lastActivityAt) {
        const lastActivity = new Date(lastActivityAt);
        nextEmailTime = new Date(lastActivity.getTime() + 48 * 60 * 60 * 1000);
      } else {
        // If no last activity, assume it's due now
        nextEmailTime = now;
      }
      
      const emailDiff = nextEmailTime.getTime() - now.getTime();
      const emailSeconds = Math.max(0, Math.floor(emailDiff / 1000));
      
      const emailHours = Math.floor(emailSeconds / 3600);
      const emailMinutes = Math.floor((emailSeconds % 3600) / 60);
      const emailSecs = emailSeconds % 60;
      
      setTimeUntilEmail({
        hours: emailHours,
        minutes: emailMinutes,
        seconds: emailSecs,
        totalSeconds: emailSeconds
      });
      
      // Only show email as due if timer has reached zero AND user is not new
      // AND the last activity was actually more than 48 hours ago
      const lastActivityTime = lastActivityAt ? new Date(lastActivityAt) : null;
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const actuallyNeedsEmail = lastActivityTime && lastActivityTime < fortyEightHoursAgo;
      
      const newIsEmailDue = emailSeconds === 0 && !isNewUser && actuallyNeedsEmail;
      setIsEmailDue(newIsEmailDue);
      onEmailDue?.(newIsEmailDue);
    };

    // Calculate immediately
    calculateTimeRemaining();
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [lastDailyReset, lastActivityAt, isNewUser, onResetDue, onEmailDue]);

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (totalSeconds: number, maxSeconds: number) => {
    return Math.max(0, Math.min(100, ((maxSeconds - totalSeconds) / maxSeconds) * 100));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Daily Countdown
        </h3>
        <div className="text-xs text-gray-500">
          {timezone}
        </div>
      </div>

      <div className="space-y-3">
        {/* Daily Reset Timer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isResetDue ? 'text-green-500' : 'text-blue-500'}`} />
              <span className="text-xs font-medium text-gray-600">
                {isResetDue ? 'Reset Ready!' : 'Next Reset'}
              </span>
            </div>
            <span className={`text-sm font-mono font-bold ${
              isResetDue ? 'text-green-600' : 'text-blue-600'
            }`}>
              {formatTime(timeUntilReset.hours, timeUntilReset.minutes, timeUntilReset.seconds)}
            </span>
          </div>
          
          {/* Progress bar for reset */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              className={`h-1.5 rounded-full ${
                isResetDue ? 'bg-green-500' : 'bg-blue-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage(timeUntilReset.totalSeconds, 24 * 60 * 60)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Email Timer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className={`w-4 h-4 ${isEmailDue ? 'text-orange-500' : 'text-purple-500'}`} />
              <span className="text-xs font-medium text-gray-600">
                {isEmailDue ? 'Email Due!' : 'Next Email'}
              </span>
            </div>
            <span className={`text-sm font-mono font-bold ${
              isEmailDue ? 'text-orange-600' : 'text-purple-600'
            }`}>
              {formatTime(timeUntilEmail.hours, timeUntilEmail.minutes, timeUntilEmail.seconds)}
            </span>
          </div>
          
          {/* Progress bar for email */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              className={`h-1.5 rounded-full ${
                isEmailDue ? 'bg-orange-500' : 'bg-purple-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage(timeUntilEmail.totalSeconds, 48 * 60 * 60)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Status indicators */}
      {(isResetDue || isEmailDue) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
        >
          <div className="text-xs text-yellow-800 font-medium">
            {isResetDue && isEmailDue && "🔄 Daily reset & 📧 Email notification ready!"}
            {isResetDue && !isEmailDue && "🔄 Daily reset ready - limits refreshed!"}
            {!isResetDue && isEmailDue && "📧 Email notification due - check your inbox!"}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 