"use client";
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, User, Star, Plus, Calendar } from 'lucide-react'
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useUser, useClerk, useAuth, UserButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CartoonTaskCard } from '@/components/CartoonTaskCard';
import { TaskInput } from '@/components/TaskInput';
import { ProgressCircle } from '@/components/ProgressCircle';
import { Cactus } from '@/components/Cactus';
import { MoodCheckIn } from '@/components/MoodCheckIn';
import { MikeSpeechBubble } from '@/components/MikeSpeechBubble';
import Image from 'next/image';
import { MilestoneCelebration } from '@/components/MilestoneCelebration';
import { DeleteAccountButton } from '@/components/DeleteAccountButton';
import { DailySummaryPopup } from '@/components/DailySummaryPopup';
import { DailyCountdownTimer } from '@/components/DailyCountdownTimer';
import { usePendingTasks } from '@/hooks/usePendingTasks';

interface Task {
  id: number | string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  hasBeenSplit?: boolean;
}

interface UserProgress {
  id: string | number;
  completedTasks: number;
  totalTasks: number;
  mood: string;
  displayCompleted: number;
  maxValue: number;
  allTimeCompleted: number;
  currentMilestone: number;
  dailyCompletedTasks: number;
  dailyMoodChecks: number;
  dailyAISplits: number;
  lastResetDate: string;
  updatedAt?: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  // Process any pending tasks from localStorage
  usePendingTasks();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showProgressPopup, setShowProgressPopup] = useState(false);
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<number | null>(null);
  const [newMood, setNewMood] = useState<string>('');
  const [lastVisitDate, setLastVisitDate] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [showMoodCheck, setShowMoodCheck] = useState(true);
  const [moodCheckDismissed, setMoodCheckDismissed] = useState(false);
  const [lastMoodCheckDate, setLastMoodCheckDate] = useState<string>('');
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [dailySummaryData, setDailySummaryData] = useState<any>(null);

  // Check if user is new (created in the last 30 minutes) - for UI display and onboarding
  useEffect(() => {
    if (user?.createdAt && isLoaded) {
      const creationTime = new Date(user.createdAt).getTime();
      const now = new Date().getTime();
      const thirtyMinutesInMs = 30 * 60 * 1000; // Increased to 30 minutes
      const isNew = now - creationTime < thirtyMinutesInMs;
      setIsNewUser(isNew);
      
      // Check if user has completed onboarding
      let hasCompletedOnboarding = false;
      try {
        hasCompletedOnboarding = localStorage.getItem(`onboarded_${user.id}`) === 'true';
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
      
      console.log('Dashboard user status:', {
        isNew,
        hasCompletedOnboarding,
        createdAt: user.createdAt,
        timeSinceCreation: (now - creationTime) / 1000 / 60 + ' minutes'
      });
      
      // If this is a new user who hasn't completed onboarding, redirect to welcome page
      if (isNew && !hasCompletedOnboarding) {
        console.log('New user detected in dashboard, redirecting to welcome');
        
        // Use both router.replace and direct window.location for maximum reliability
        router.replace('/welcome');
        
        // Also use direct navigation as a backup
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            console.log('Forcing redirect to welcome page via window.location');
            window.location.href = '/welcome';
          }
        }, 100);
        
        return;
      }
    }
  }, [user?.createdAt, isLoaded, user?.id, router]);

  // Calculate time until next reset
  useEffect(() => {
    const calculateTimeUntilReset = () => {
      if (progress?.lastResetDate) {
        const lastReset = new Date(progress.lastResetDate);
        const nextReset = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        const timeLeft = nextReset.getTime() - now.getTime();
        
        if (timeLeft > 0) {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          setTimeUntilReset(`${hours}h ${minutes}m`);
        } else {
          setTimeUntilReset('Reset now!');
        }
      }
    };

    calculateTimeUntilReset();
    const interval = setInterval(calculateTimeUntilReset, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [progress?.lastResetDate]);

  // Clean up duplicate tasks on mount
  useEffect(() => {
    if (tasks.length > 0) {
      const taskMap = new Map();
      tasks.forEach(task => {
        taskMap.set(task.id, task);
      });
      const uniqueTasks = Array.from(taskMap.values());
      if (uniqueTasks.length !== tasks.length) {
        console.log(`Cleaned up ${tasks.length - uniqueTasks.length} duplicate tasks`);
        setTasks(uniqueTasks);
      }
    }
  }, []); // Only run on mount

  // Debug progress data
  useEffect(() => {
    if (progress) {
      console.log('[Dashboard] Progress data:', progress);
    }
  }, [progress]);

  // Debug progress changes
  useEffect(() => {
    if (progress) {
      console.log('[Dashboard] Progress updated:', {
        displayCompleted: progress.displayCompleted,
        completedTasks: progress.completedTasks,
        allTimeCompleted: progress.allTimeCompleted,
        maxValue: progress.maxValue,
        mood: progress.mood,
        currentMilestone: progress.currentMilestone,
        dailyCompletedTasks: progress.dailyCompletedTasks,
      });
    }
  }, [progress]);



  // Check if we need to reset mood check-in daily
  useEffect(() => {
    if (user?.id) {
      const today = new Date().toDateString();
      const lastCheck = localStorage.getItem(`lastMoodCheck_${user.id}`);
      
      if (lastCheck !== today) {
        // New day - reset mood check-in
        setShowMoodCheck(true);
        setMoodCheckDismissed(false);
        localStorage.setItem(`lastMoodCheck_${user.id}`, today);
        console.log('[Dashboard] Daily mood check-in reset');
      }
    }
  }, [user?.id]);



  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated and auth is loaded
    if (isLoaded && !user) {
      router.replace("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Check for expired timer and send email if needed
  const checkExpiredTimer = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/check-timer-expired', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.expired) {
          console.log('Timer expired, email sent and reset completed');
          // Refresh progress data after reset
          fetchProgress();
        }
      }
    } catch (error) {
      console.error('Error checking expired timer:', error);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      console.log("User authenticated:", user.emailAddresses[0]?.emailAddress);
      
      // Initial data fetch
      fetchTasks();
      fetchProgress();
      
      // Check for expired timer
      checkExpiredTimer();
      
      // Set up periodic refresh to handle server restarts
      const refreshInterval = setInterval(() => {
        fetchTasks();
        fetchProgress();
      }, 10000); // Refresh every 10 seconds
      
      // Handle window focus events to refresh data when user returns to the tab
      const handleFocus = () => {
        console.log("Window focused, refreshing data");
        fetchTasks();
        fetchProgress();
        // Check for expired timer when user returns to the tab
        checkExpiredTimer();
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(refreshInterval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [isLoaded, user]);

  const fetchTasks = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Ensure no duplicates by using a Map to deduplicate by ID
        const taskMap = new Map();
        data.forEach((task: Task) => {
          taskMap.set(task.id, task);
        });
        const uniqueTasks = Array.from(taskMap.values());
        setTasks(uniqueTasks);
      } else {
        console.error('Failed to fetch tasks:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Set empty tasks if database is unavailable
        if (response.status === 500) {
          setTasks([]);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Set empty tasks on network error
      setTasks([]);
    }
  };

  const fetchProgress = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/progress?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgress({
          id: data.id,
          completedTasks: data.completedTasks,
          totalTasks: data.totalTasks,
          mood: data.mood,
          displayCompleted: data.displayCompleted,
          maxValue: data.maxValue,
          allTimeCompleted: data.allTimeCompleted,
          currentMilestone: data.currentMilestone,
          dailyCompletedTasks: data.dailyCompletedTasks,
          dailyMoodChecks: data.dailyMoodChecks,
          dailyAISplits: data.dailyAISplits,
          lastResetDate: data.lastResetDate,
          updatedAt: data.updatedAt
        });
      } else {
        const errorText = await response.text();
        console.error('Progress fetch error:', response.status, errorText);
        
        // Set default progress if database is unavailable
        if (response.status === 500) {
          setProgress({
            id: 'fallback',
            completedTasks: 0,
            totalTasks: 0,
            mood: 'neutral',
            displayCompleted: 0,
            maxValue: 10,
            allTimeCompleted: 0,
            currentMilestone: 0,
            dailyCompletedTasks: 0,
            dailyMoodChecks: 0,
            dailyAISplits: 0,
            lastResetDate: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      
      // Set default progress on network error
      setProgress({
        id: 'fallback',
        completedTasks: 0,
        totalTasks: 0,
        mood: 'neutral',
        displayCompleted: 0,
        maxValue: 10,
        allTimeCompleted: 0,
        currentMilestone: 0,
        dailyCompletedTasks: 0,
        dailyMoodChecks: 0,
        dailyAISplits: 0,
        lastResetDate: new Date().toISOString()
      });
    }
  };

  const handleAddTask = async (title: string) => {
    setIsAddingTask(true);
    
    // Check if task with same title already exists
    const existingTask = tasks.find(task => task.title.toLowerCase() === title.toLowerCase());
    if (existingTask) {
      toast.error('A task with this title already exists!');
      setIsAddingTask(false);
      return;
    }
    
    try {
      const token = await getToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, hasBeenSplit: false })
      });

      if (response.ok) {
        const newTask = await response.json();
        // Add the new task smoothly without flickering
        setTasks(prev => [newTask, ...prev]);
        
        // Fetch progress in the background
        fetchProgress().catch(console.error);
        toast.success('Task added successfully!');
      } else {
        toast.error('Failed to add task');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleComplete = async (id: number | string, completed: boolean) => {
    const previousTask = tasks.find(task => task.id === id);
    const previousCompleted = previousTask?.completed;
    if (!previousTask) {
      console.error('Task not found for toggle:', id);
      return;
    }
    console.log(`Toggling task ${id} to ${completed ? 'completed' : 'not completed'}`);
    setTasks(prev => prev.map(task =>
      String(task.id) === String(id) ? { ...task, completed } : task
    ));
    try {
      const token = await getToken();
      console.log(`Sending PATCH request to /api/tasks/${id}`);
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, },
        body: JSON.stringify({ completed })
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          const previousCompletedTasks = progress?.completedTasks || 0;
          const newCompletedTasks = data.completedTasks;
          
          // Check for milestone achievements
          if (data.reachedNewMilestone) {
            setCurrentMilestone(data.currentMilestone);
            setNewMood(data.newMood);
            setShowMilestoneCelebration(true);
            toast.success(`🎉 Milestone reached! You're now ${data.newMood}!`);
          }
          
          // Update progress with all the data from the server
          setProgress(prev => prev ? {
            ...prev, 
            completedTasks: data.completedTasks, 
            mood: data.newMood,
            displayCompleted: data.displayCompleted, 
            maxValue: data.maxValue,
            allTimeCompleted: data.allTimeCompleted, 
            currentMilestone: data.currentMilestone
          } : null);
          
          // Also refresh progress from server to ensure consistency
          fetchProgress().catch(console.error);
        }
        // Only show regular toast if not a milestone achievement
        if (!data.reachedNewMilestone) {
          toast.success(completed ? 'Task completed!' : 'Task uncompleted');
        }
      } else {
        setTasks(prev => prev.map(task =>
          String(task.id) === String(id) ? { ...task, completed: previousCompleted || false } : task
        ));
        toast.error('Failed to update task');
      }
    } catch (error) {
      setTasks(prev => prev.map(task =>
        String(task.id) === String(id) ? { ...task, completed: previousCompleted || false } : task
      ));
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (id: number | string) => {
    // Store the task before removing it (for recovery if API call fails)
    const taskToDelete = tasks.find(task => task.id === id);
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (!taskToDelete) {
      console.error('Task not found for deletion:', id);
      return;
    }
    
    // Optimistically update UI - remove the task
    setTasks(prev => prev.filter(task => task.id !== id));
    
    try {
      const token = await getToken();
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Fetch progress in the background
        fetchProgress().catch(console.error);
        toast.success('Task deleted successfully!');
      } else {
        // Revert the optimistic update if the API call failed
        setTasks(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          if (existingIds.has(id)) {
            return prev; // Don't add back if already exists
          }
          return [...prev.slice(0, taskIndex), taskToDelete, ...prev.slice(taskIndex)];
        });
        toast.error('Failed to delete task');
      }
    } catch (error) {
      // Revert the optimistic update if there was an error
      setTasks(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        if (existingIds.has(id)) {
          return prev; // Don't add back if already exists
        }
        return [...prev.slice(0, taskIndex), taskToDelete, ...prev.slice(taskIndex)];
      });
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleMoodSelect = async (mood: string) => {
    try {
      const token = await getToken();
      
      // Check daily limit first
      const limitResponse = await fetch('/api/progress/check-mood-limit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (limitResponse.ok) {
        const limitData = await limitResponse.json();
        if (limitData.limitReached) {
          toast.error('Daily mood check-in limit reached! Try again tomorrow.');
          return;
        }
      }
      
      const response = await fetch('/api/progress', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mood })
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(prev => prev ? {
          ...prev,
          mood: data.mood,
          dailyMoodChecks: data.dailyMoodChecks
        } : null);
        setShowMoodCheck(false); // Hide the mood check after selection
        setMoodCheckDismissed(true); // Mark as dismissed
        toast.success('Mood updated!');
      }
    } catch (error) {
      console.error('Error updating mood:', error);
      toast.error('Failed to update mood');
    }
  };

  const showMoodCheckAgain = () => {
    setShowMoodCheck(true);
  };

  const dismissMoodCheck = () => {
    setShowMoodCheck(false);
    setMoodCheckDismissed(true);
  };

  const handleDailyReset = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/daily-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Daily reset completed:', result);
        
        // Refresh data after reset
        fetchTasks();
        fetchProgress();
        
        toast.success('Daily tasks reset! Mike\'s progress preserved.');
      } else {
        console.error('❌ Daily reset failed:', await response.text());
        toast.error('Failed to reset daily tasks');
      }
    } catch (error) {
      console.error('❌ Daily reset error:', error);
      toast.error('Failed to reset daily tasks');
    }
  };

  const showDailySummaryPopup = () => {
    setDailySummaryData({
      tasks,
      progress
    });
    setShowDailySummary(true);
  };

  const handleAddSubtasks = async (subtasks: string[], originalTaskId?: number | string) => {
    try {
      // Remove the original task from state immediately for instant feedback
      if (originalTaskId) {
        setTasks(prev => prev.filter(task => task.id !== originalTaskId));
      }
      
      // Add each subtask with hasBeenSplit flag
      for (const title of subtasks) {
        const token = await getToken();
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            title: title.trim(),
            hasBeenSplit: true // Mark as split so it can't be split again
          })
        });

        if (response.ok) {
          const newTask = await response.json();
          setTasks(prev => [newTask, ...prev]);
        }
        // Small delay between adding subtasks
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Delete the original task from database
      if (originalTaskId) {
        await handleDeleteTask(originalTaskId);
      }
    } catch (error) {
      console.error('Error creating subtasks:', error);
      // Don't remove the original task if subtask creation failed
    }
  };

  const completedTasksCount = tasks.filter(task => task.completed).length;
  const pendingTasksCount = tasks.length - completedTasksCount;

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading state while user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center space-x-3"
          >
            <motion.div
              whileHover={{ rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-sm">
                <Image
                  src="/teyra-logo-64kb.png"
                  alt="Teyra"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            <span className="text-xl sm:text-2xl font-bold text-black">
              Teyra
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0"
          >
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
              <User className="w-4 h-4" />
              <span className="truncate max-w-[150px] md:max-w-none">{user.emailAddresses[0]?.emailAddress}</span>
            </div>

            {moodCheckDismissed && (progress?.dailyMoodChecks || 0) < 1 && (
              <button
                onClick={showMoodCheckAgain}
                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs sm:text-sm rounded-full hover:from-pink-600 hover:to-purple-700"
              >
                😊 Mood
              </button>
            )}
            {moodCheckDismissed && (progress?.dailyMoodChecks || 0) >= 1 && progress?.mood && (
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-50 to-blue-50 text-green-700 text-xs sm:text-sm rounded-full border border-green-200">
                😊 {progress.mood}
              </div>
            )}
            <button
              onClick={() => { fetchTasks(); fetchProgress(); }}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500 text-white text-xs sm:text-sm rounded-full hover:bg-blue-600"
            >
              🔄
            </button>
            <Button variant="ghost" asChild className="hover:bg-gray-50 text-gray-700 font-medium hidden sm:flex">
              <Link href="/">Home</Link>
            </Button>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7 sm:w-8 sm:h-8"
                }
              }}
            />
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 sm:pt-24 pb-12 px-3 sm:px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Mood Check-in (conditionally shown) */}
          {showMoodCheck && (
            <div className="mb-6 sm:mb-8">
              <MoodCheckIn 
                onMoodSelect={handleMoodSelect} 
                onTaskSuggestion={handleAddTask}
                onDismiss={dismissMoodCheck}
                existingTasks={tasks.map(task => task.title)}
              />
            </div>
          )}
          
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Tasks */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Add Task Card - For all users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-5"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">✨</span>
                  What's one thing you want to complete today?
                </h2>
                <TaskInput onAddTask={handleAddTask} isLoading={isAddingTask} />
              </motion.div>
              
              {/* Tasks List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: isNewUser ? 0.1 : 0 }}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-5"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="mr-2">📝</span>
                    Today's Tasks
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">
                        {completedTasksCount} <span className="text-red-600">completed</span>
                      </span>
                      {pendingTasksCount > 0 && (
                        <span className="bg-yellow-100 text-yellow-600 text-xs font-bold px-2 py-1 rounded-full">
                          {pendingTasksCount} pending
                        </span>
                      )}
                    </div>

                  </div>
                </div>
                
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        transition={{ 
                          duration: 0.2, 
                          ease: "easeOut"
                        }}
                      >
                        <CartoonTaskCard
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onDelete={handleDeleteTask}
                          onAddSubtasks={handleAddSubtasks}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {tasks.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="text-gray-500">
                        <motion.div
                          whileHover={{ rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
                          className="inline-block"
                        >
                          <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        </motion.div>
                        <p className="text-sm font-medium mb-2">No tasks yet!</p>
                        <p className="text-xs text-gray-400 mb-4">
                          Add your first task above to get started!
                        </p>
                        <Button 
                          onClick={() => handleAddTask("My first task")}
                          className="bg-black hover:bg-gray-800 text-white"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add Example Task
                          </div>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
            
            {/* Right Column - Mike and Stats */}
            <div className="space-y-6">
              {/* Mike the Cactus Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Meet Mike! 🌵
                </h3>
                
                {/* Mike the Cactus */}
                <div className="flex justify-center mb-8 py-4">
                  {progress ? (
                    <motion.div 
                      className="transform scale-150"
                      whileHover={{ scale: 1.6 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      <Cactus 
                        mood={progress.mood as 'sad' | 'neutral' | 'happy'} 
                        todayCompletedTasks={[]}
                      />
                    </motion.div>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      Loading Mike...
                    </div>
                  )}
                </div>

                {/* Mike's Speech Bubble */}
                {progress ? (
                  <div className="mb-6">
                    <MikeSpeechBubble 
                      mood={progress.mood} 
                      completedTasks={progress.completedTasks} 
                    />
                  </div>
                ) : (
                  <div className="mb-6 text-gray-500 text-sm">
                    Loading speech bubble...
                  </div>
                )}

                {/* Progress Circle */}
                {progress ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-6"
                  >
                    <ProgressCircle 
                      completed={progress.displayCompleted || 0} 
                      total={progress.maxValue || 10}
                      maxValue={progress.maxValue || 10}
                      mood={progress.mood}
                    />
                  </motion.div>
                ) : (
                  <div className="mt-6 text-gray-500 text-sm">
                    Loading progress...
                  </div>
                )}
              </motion.div>
              
              {/* Date Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-700">Today</h3>
                  </div>
                  <span className="text-lg font-bold">
                    {new Date().toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                {/* Daily Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tasks Completed Today:</span>
                    <span className="text-lg font-bold text-green-600">
                      {progress?.dailyCompletedTasks || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">All-Time Completed:</span>
                    <span className="text-lg font-bold text-purple-600">
                      {progress?.allTimeCompleted || 0}
                    </span>
                  </div>
                  {progress?.mood && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Mood:</span>
                      <span className="text-sm font-medium text-pink-600 capitalize">
                        😊 {progress.mood}
                      </span>
                    </div>
                  )}
                  
                  {/* Daily Limits */}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="text-xs text-gray-500 mb-2">Daily Limits:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Mood Check-ins:</span>
                        <span className={`text-xs font-medium ${(progress?.dailyMoodChecks || 0) >= 1 ? 'text-red-500' : 'text-green-500'}`}>
                          {progress?.dailyMoodChecks || 0}/1
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">AI Task Splits:</span>
                        <span className={`text-xs font-medium ${(progress?.dailyAISplits || 0) >= 2 ? 'text-red-500' : 'text-green-500'}`}>
                          {progress?.dailyAISplits || 0}/2
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Countdown Timer */}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="text-xs text-gray-500 mb-1">Next Reset:</div>
                    <div className="text-sm font-bold text-orange-600">
                      ⏰ {timeUntilReset}
                    </div>
                  </div>
                  

                  
                  {/* Delete Account Button */}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="text-xs text-gray-500 mb-2">Account:</div>
                    <DeleteAccountButton />
                  </div>
                </div>
              </motion.div>
              
              {/* Daily Countdown Timer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <DailyCountdownTimer
                  lastDailyReset={progress?.lastResetDate || null}
                  lastActivityAt={progress?.updatedAt || null}
                  timezone="UTC"
                  onResetDue={(isDue) => {
                    if (isDue) {
                      console.log('Reset is due!');
                    }
                  }}
                  onEmailDue={(isDue) => {
                    if (isDue) {
                      console.log('Email is due!');
                    }
                  }}
                  isNewUser={isNewUser}
                  userId={user?.id}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Milestone Celebration */}
      <MilestoneCelebration
        isOpen={showMilestoneCelebration}
        onClose={() => setShowMilestoneCelebration(false)}
        milestone={currentMilestone || 0}
        newMood={newMood}
      />

      {/* Daily Summary Popup */}
      {showDailySummary && dailySummaryData && (
        <DailySummaryPopup
          isOpen={showDailySummary}
          onClose={() => setShowDailySummary(false)}
          tasks={dailySummaryData.tasks}
          progress={dailySummaryData.progress}
          onTasksReset={handleDailyReset}
        />
      )}
    </div>
  );
}