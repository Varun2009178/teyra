'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface DailyResetCheckerProps {
  onResetCompleted?: () => void;
}

export default function DailyResetChecker({ onResetCompleted }: DailyResetCheckerProps = {}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!user?.id || isChecking) return;

    const checkForDailyReset = async () => {
      setIsChecking(true);
      
      try {
        // Get the daily start time from localStorage
        const dailyStartKey = `daily_start_time_${user.id}`;
        const storedStartTime = localStorage.getItem(dailyStartKey);
        
        let dailyStartTime: Date;
        const now = new Date();
        
        if (!storedStartTime) {
          // First time user - set start time to now
          dailyStartTime = now;
          localStorage.setItem(dailyStartKey, dailyStartTime.toISOString());
          console.log('🕐 First time user - daily timer started');
          setIsChecking(false);
          return;
        } else {
          dailyStartTime = new Date(storedStartTime);
        }

        // Check if 24 hours have passed
        const hoursSinceStart = (now.getTime() - dailyStartTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceStart >= 24) {
          console.log(`🔄 24 hours passed! Performing daily reset... (${hoursSinceStart.toFixed(1)} hours)`);
          
          try {
            // Clear all tasks via API
            const token = await getToken();
            const response = await fetch('/api/tasks', {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ deleteAll: true })
            });

            if (!response.ok) {
              console.error('Failed to clear tasks via API');
            }
          } catch (error) {
            console.error('Error clearing tasks:', error);
          }
          
          // Clear localStorage items for new day
          if (user.id) {
            // Reset daily timer
            localStorage.setItem(dailyStartKey, now.toISOString());
            
            // Clear mood data
            localStorage.removeItem(`current_mood_${user.id}`);
            
            // Clear daily limits
            localStorage.removeItem(`mood_selections_${user.id}`);
            localStorage.removeItem(`ai_splits_used_${user.id}`);
            
            // Clear daily commitment data
            localStorage.removeItem(`hasCommittedToday_${user.id}`);
            localStorage.removeItem(`dailyTaskLimit_${user.id}`);
            localStorage.setItem(`dailyCommitmentDate_${user.id}`, now.toDateString());
            
            console.log('🗑️ Cleared all daily data for new day');
          }
          
          toast.success('🌅 New day started! Your progress has been reset and you can add new tasks.');
          
          // Notify parent component
          onResetCompleted?.();
          
          // Refresh the page to reflect changes after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
        } else {
          const hoursRemaining = 24 - hoursSinceStart;
          console.log(`⏰ ${hoursRemaining.toFixed(1)} hours until daily reset`);
        }
        
      } catch (error) {
        console.error('Error during daily reset check:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Check immediately when component mounts
    checkForDailyReset();
    
    // Check every minute for more responsive reset timing
    const intervalId = setInterval(checkForDailyReset, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user?.id, isChecking, getToken, onResetCompleted]);

  // This component doesn't render anything visible
  return null;
}