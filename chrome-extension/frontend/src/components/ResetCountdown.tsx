'use client';

import { useState, useEffect } from 'react';
import { Clock, Mail } from 'lucide-react';

interface ResetCountdownProps {
  dailyStartTime?: string | Date | null;
  className?: string;
}

export default function ResetCountdown({ dailyStartTime, className = '' }: ResetCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!dailyStartTime) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const startTime = new Date(dailyStartTime).getTime();
      const resetTime = startTime + (24 * 60 * 60 * 1000); // 24 hours from start
      const timeLeft = resetTime - now;

      if (timeLeft <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, total: timeLeft });
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [dailyStartTime]);

  if (!dailyStartTime || !timeRemaining) {
    return null;
  }

  const { hours, minutes, seconds, total } = timeRemaining;

  if (total <= 0) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <Mail className="w-4 h-4" />
        <span className="text-sm font-medium">Reset available now!</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-orange-600 ${className}`}>
      <Clock className="w-4 h-4" />
      <span className="text-sm font-medium">
        Next reset & email in {hours.toString().padStart(2, '0')}:
        {minutes.toString().padStart(2, '0')}:
        {seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}