"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Check, Trash2, Sparkles, Calendar, User, Settings, Home, LogOut, Search, Filter, Star, Circle, CheckCircle2, X, Zap } from 'lucide-react'
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useUser, useClerk, useAuth, UserButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Cactus } from '@/components/Cactus';
import { MoodCheckIn } from '@/components/MoodCheckIn';
import { ProgressCircle } from '@/components/ProgressCircle';
import { BeRealModal } from '@/components/BeRealModal';
import { DailySummaryPopup } from '@/components/DailySummaryPopup';
import { usePendingTasks } from '@/hooks/usePendingTasks';
import { motion } from 'framer-motion';
import NotificationToggle from '@/components/NotificationToggle';
import DailyResetChecker from '@/components/DailyResetChecker';
import { EmailSystemTester } from '@/components/EmailSystemTester';
import ResetCountdown from '@/components/ResetCountdown';

const OnboardingGuide = ({ 
  step, 
  onNext, 
  onSkip, 
  onComplete 
}: { 
  step: 'mood' | 'add-task' | 'complete-task' | 'done';
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}) => {
  const steps = {
    mood: {
      title: "Set Your Mood",
      description: "Start by checking in with how you're feeling today",
      position: "top-4 right-4",
      arrowDirection: "bottom",
      target: "mood-section"
    },
    'add-task': {
      title: "Add Your First Task",
      description: "Create a task to get started with your day",
      position: "bottom-4 left-4",
      arrowDirection: "top",
      target: "task-input"
    },
    'complete-task': {
      title: "Complete a Task",
      description: "Click the checkbox to mark a task as done",
      position: "top-4 left-4",
      arrowDirection: "right",
      target: "first-task"
    },
    done: {
      title: "You're All Set!",
      description: "You've completed the basics. Start being productive!",
      position: "center",
      arrowDirection: "none",
      target: null
    }
  };

  const currentStep = steps[step];

  // Add highlighting to target element
  React.useEffect(() => {
    if (currentStep.target) {
      const targetElement = document.querySelector(`[data-onboarding="${currentStep.target}"]`);
      if (targetElement) {
        targetElement.classList.add('ring-4', 'ring-red-500', 'ring-opacity-50', 'animate-pulse');
        return () => {
          targetElement.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-50', 'animate-pulse');
        };
      }
    }
  }, [currentStep.target]);

  if (step === 'done') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onComplete}
      >
        <motion.div
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{currentStep.title}</h3>
          <p className="text-gray-600 mb-6">{currentStep.description}</p>
          <Button 
            onClick={onComplete}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            Get Started!
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 pointer-events-none z-40"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Arrow and Tooltip */}
      <motion.div
        className={`absolute ${currentStep.position} pointer-events-auto`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Animated Arrow */}
        <motion.div
          className="relative"
          animate={{ 
            y: currentStep.arrowDirection === 'bottom' ? [0, 10, 0] : 
                currentStep.arrowDirection === 'top' ? [0, -10, 0] :
                currentStep.arrowDirection === 'right' ? [0, 0, 0] : [0, 0, 0]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className={`w-0 h-0 border-8 border-transparent ${
            currentStep.arrowDirection === 'bottom' ? 'border-t-red-500' :
            currentStep.arrowDirection === 'top' ? 'border-b-red-500' :
            currentStep.arrowDirection === 'right' ? 'border-l-red-500' : ''
          }`} />
        </motion.div>
        
        {/* Tooltip */}
        <motion.div
          className="bg-white rounded-xl p-4 shadow-2xl border border-gray-200 mt-2 max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className="font-bold text-gray-900 mb-1">{currentStep.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{currentStep.description}</p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onNext}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs px-3 py-1"
            >
              Next
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onSkip}
              className="text-xs px-3 py-1"
            >
              Skip
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

interface Task {
  id: number;
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

// Memoized Task Component for better performance
const TaskItem = React.memo(({ task, index, onToggleComplete, onDelete, onSplitTask, isSplitting, isToggling }: {
  task: Task;
  index: number;
  onToggleComplete: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  onSplitTask: (task: Task) => void;
  isSplitting: boolean;
  isToggling: boolean;
}) => {
  const isThisTaskToggling = isToggling;
  
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
      isSplitting ? 'ring-2 ring-green-200 bg-green-50' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={() => !isThisTaskToggling && onToggleComplete(task.id, task.completed)}
            disabled={isThisTaskToggling}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-75 ${
              task.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            } ${isThisTaskToggling ? 'animate-pulse' : ''}`}
          >
            {task.completed && (
              <Check className="w-3 h-3" />
            )}
            {isThisTaskToggling && !task.completed && (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            )}
          </button>
          
          <div className="flex items-center space-x-2 flex-1">
            <span className={`text-sm sm:text-base font-medium transition-all duration-300 ${
              task.completed ? 'line-through text-gray-500 transform scale-95' : 'text-gray-900'
            }`}>
              {task.title}
            </span>
            {task.hasBeenSplit && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                AI Split
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* AI Split Button - only show for non-completed tasks */}
          {!task.completed && (
            <button
              onClick={() => onSplitTask(task)}
              disabled={isSplitting || isThisTaskToggling}
              className={`text-gray-400 hover:text-green-500 transition-all duration-300 p-2 rounded-full hover:bg-green-50 transform hover:scale-110 w-8 h-8 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                isSplitting ? 'text-green-500 bg-green-50' : ''
              }`}
              title={isSplitting ? 'Splitting task...' : 'Split task with AI'}
            >
              {isSplitting ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
            </button>
          )}
          
          <button
            onClick={() => onDelete(task.id)}
            disabled={isThisTaskToggling}
            className="text-gray-400 hover:text-purple-500 transition-all duration-300 p-2 rounded-full hover:bg-purple-50 transform hover:scale-110 w-8 h-8 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  usePendingTasks();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [showFirstTaskPopup, setShowFirstTaskPopup] = useState(false);
  const [showFirstCompletePopup, setShowFirstCompletePopup] = useState(false);
  const [showTenTasksPopup, setShowTenTasksPopup] = useState(false);
  const [showHonestyModal, setShowHonestyModal] = useState(false);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [showAIInsightModal, setShowAIInsightModal] = useState(false);
  const [dailyTaskLimit, setDailyTaskLimit] = useState(5);
  const [hasCommittedToday, setHasCommittedToday] = useState(false);
  const [showTaskLimitReminder, setShowTaskLimitReminder] = useState(false);
  const [userReflections, setUserReflections] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState('');
  const [isSplittingTask, setIsSplittingTask] = useState<number | null>(null);
  const [showTaskSuccess, setShowTaskSuccess] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<'mood' | 'add-task' | 'complete-task' | 'done' | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showSmartMoodSuggestion, setShowSmartMoodSuggestion] = useState(false);
  const [showSmartAISplitSuggestion, setShowSmartAISplitSuggestion] = useState(false);
  const [pendingTaskTitle, setPendingTaskTitle] = useState('');
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [dailySummaryData, setDailySummaryData] = useState<any>(null);

  // Helper function for consistent date comparison
  const isToday = useCallback((date: string | Date) => {
    const taskDate = new Date(date);
    const today = new Date();
    
    return taskDate.getFullYear() === today.getFullYear() &&
           taskDate.getMonth() === today.getMonth() &&
           taskDate.getDate() === today.getDate();
  }, []);

  // Smart behavior analysis for suggestions
  const analyzeUserBehavior = useCallback(() => {
    if (!user?.id || !tasks.length) return;

    const now = new Date();
    const todaysTasks = tasks.filter(task => isToday(task.createdAt));
    const incompleteTasks = todaysTasks.filter(t => !t.completed);
    
    // Mood check-in suggestions based on behavior
    const lastMoodCheck = localStorage.getItem(`last_mood_check_${user.id}`);
    const lastMoodCheckTime = lastMoodCheck ? new Date(lastMoodCheck).getTime() : 0;
    const hoursSinceLastMoodCheck = (now.getTime() - lastMoodCheckTime) / (1000 * 60 * 60);
    
    // Suggest mood check if:
    // 1. Haven't checked mood in 4+ hours
    // 2. Have incomplete tasks
    // 3. It's been more than 2 hours since last task completion
    if (hoursSinceLastMoodCheck > 4 && incompleteTasks.length > 0) {
      const hasSeenMoodSuggestion = sessionStorage.getItem(`mood_suggestion_${user.id}_${now.toDateString()}`);
      if (!hasSeenMoodSuggestion) {
        setTimeout(() => setShowSmartMoodSuggestion(true), 5000);
      }
    }

    // AI Split suggestions based on task complexity
    const complexTasks = incompleteTasks.filter(task => 
      task.title.length > 40 || // Long task description
      /\b(and|&|,|\+)\b/gi.test(task.title) || // Contains multiple actions
      /\b(complex|difficult|hard|big|large|major)\b/gi.test(task.title) // Contains complexity words
    );

    if (complexTasks.length > 0) {
      const hasSeenSplitSuggestion = sessionStorage.getItem(`split_suggestion_${user.id}_${now.toDateString()}`);
      if (!hasSeenSplitSuggestion && !complexTasks[0].hasBeenSplit) {
        setTimeout(() => setShowSmartAISplitSuggestion(true), 8000);
      }
    }
  }, [user?.id, tasks, isToday]);

  // Fetch data functions (keeping the core logic from original)
  const fetchTasks = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      Promise.all([fetchTasks(), fetchProgress(), loadUserReflections()]).finally(() => {
        setIsLoading(false);
        
        // Analyze user behavior for smart suggestions (after data is loaded)
        setTimeout(() => analyzeUserBehavior(), 2000);
      });
      checkForDailyInsight();
      
      
      // Load saved daily task limit and commitment status
      const savedLimit = localStorage.getItem(`dailyTaskLimit_${user.id}`);
      const savedCommitment = localStorage.getItem(`hasCommittedToday_${user.id}`);
      const today = new Date().toDateString();
      
      if (savedLimit) {
        setDailyTaskLimit(parseInt(savedLimit, 10));
      }
      
      if (savedCommitment === today) {
        setHasCommittedToday(true);
      } else {
        // Clear old commitment if it's a new day
        setHasCommittedToday(false);
        localStorage.removeItem(`hasCommittedToday_${user.id}`);
      }
      
      // Check if user has seen onboarding
      const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.id}`);
      
      // Check if user just completed welcome page and should start dashboard tutorial
      const startDashboardTutorial = sessionStorage.getItem(`start_dashboard_tutorial_${user.id}`);
      
      // Start onboarding tour if user just completed welcome page
      if (startDashboardTutorial === 'true' && !hasSeenOnboarding) {
        console.log('🎯 Starting dashboard tutorial for new user');
        setOnboardingStep('add-task'); // Start with add-task since they already have one from welcome
        sessionStorage.removeItem(`start_dashboard_tutorial_${user.id}`);
      }
      
      // Check notification permission and show prompt if needed
      if ('Notification' in window) {
        const hasSeenNotificationPrompt = localStorage.getItem(`notification_prompt_${user.id}`);
        if (Notification.permission === 'default' && !hasSeenNotificationPrompt) {
          // Show notification prompt after a short delay
          setTimeout(() => {
            setShowNotificationPrompt(true);
          }, 2000);
        }
      }
    }
  }, [isLoaded, user]);

  // Listen for daily summary popup event
  useEffect(() => {
    const handleShowDailySummary = (event: CustomEvent) => {
      setDailySummaryData(event.detail);
      setShowDailySummary(true);
    };

    window.addEventListener('showDailySummary', handleShowDailySummary as EventListener);
    
    return () => {
      window.removeEventListener('showDailySummary', handleShowDailySummary as EventListener);
    };
  }, []);
  
  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const loadUserReflections = async () => {
    try {
      const stored = localStorage.getItem(`reflections_${user?.id}`);
      if (stored) {
        setUserReflections(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading reflections:', error);
    }
  };
  
  const saveReflection = (reason: string, context: any) => {
    const newReflection = {
      id: Date.now(),
      date: new Date().toISOString(),
      reason,
      incompleteTasks: todaysIncomplete,
      tasksToday: todaysTasks.length,
      context
    };
    
    const updated = [...userReflections, newReflection];
    setUserReflections(updated);
    localStorage.setItem(`reflections_${user?.id}`, JSON.stringify(updated));
  };
  
  const checkForDailyInsight = async () => {
    const lastInsight = localStorage.getItem(`lastInsight_${user?.id}`);
    const today = new Date().toDateString();
    
    if (lastInsight !== today && userReflections.length > 0) {
      // Generate AI insight based on reflection history
      setTimeout(() => {
        generateAIInsight();
      }, 3000);
    }
  };
  
  const generateAIInsight = async () => {
    try {
      const recentReflections = userReflections.slice(-7); // Last 7 reflections
      const commonReasons = recentReflections.reduce((acc: any, ref) => {
        acc[ref.reason] = (acc[ref.reason] || 0) + 1;
        return acc;
      }, {});
      
      const mostCommon = Object.entries(commonReasons).sort(([,a], [,b]) => (b as number) - (a as number))[0];
      
      const insights = {
        overwhelmed: `Mike noticed you've been feeling overwhelmed lately. Today, try breaking each task into just 3 small steps. You're stronger than you think! 🌵💪`,
        too_big: `Mike sees a pattern - your tasks might be too ambitious! Let's aim for tasks you can finish in 30 minutes or less today. Small wins build big momentum! 🎯🌵`,
        distracted: `Mike's been watching, and distractions are your biggest challenge. Today, try the 'One Thing Rule' - focus on just ONE task at a time. You've got this! 🎯🌵`,
        unmotivated: `Mike understands your motivation comes and goes. Today is a fresh start! What's ONE small thing that would make you proud? Start there. 🌱🌵`
      };
      
      if (mostCommon) {
        const [reason] = mostCommon;
        setAiInsight(insights[reason as keyof typeof insights] || "Mike believes in you! Today is a new opportunity to grow! 🌵✨");
        setShowAIInsightModal(true);
        localStorage.setItem(`lastInsight_${user?.id}`, new Date().toDateString());
      }
    } catch (error) {
      console.error('Error generating AI insight:', error);
    }
  };

  const handleAddTask = useCallback(async (title: string) => {
    if (!title.trim() || isAddingTask) return;
    
    // Store the pending task title for later addition
    const taskToAdd = title.trim();

    // Check if user is locked (already took action today)
    if (progress?.isLocked && progress?.dailyStartTime) {
      const now = new Date();
      const startTime = new Date(progress.dailyStartTime);
      const hoursRemaining = Math.ceil(24 - (now.getTime() - startTime.getTime()) / (1000 * 60 * 60));
      
      toast.error(`You're locked until your next reset! ${hoursRemaining} hours remaining.`, {
        duration: 5000,
        description: "You can only add tasks once per 24-hour period."
      });
      return;
    }
    
    // Check if user has committed to a daily limit
    if (!hasCommittedToday) {
      // Store the task they want to add and show commitment modal
      setPendingTaskTitle(taskToAdd);
      setShowCommitmentModal(true);
      toast.info('Set your daily task limit first! Choose how many tasks you want to complete today.', {
        duration: 5000
      });
      return;
    }
    
    // Check daily task limit
    const todaysTasks = tasks.filter(task => isToday(task.createdAt));
    
    if (todaysTasks.length >= dailyTaskLimit) {
      toast.error(`You've reached your daily limit of ${dailyTaskLimit} tasks. Focus on completing what you have!`, {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: 'white',
          border: 'none',
        }
      });
      return;
    }

    setIsAddingTask(true);
    const isFirstTask = tasks.length === 0;
    
    try {
      const token = await getToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: title.trim() })
      });

      if (response.ok) {
        const newTask = await response.json();
        const updatedTasks = [newTask, ...tasks];
        setTasks(updatedTasks);
        
        // Refresh progress after adding task
        await fetchProgress();
        
        // Show celebration popups
        if (isFirstTask) {
          setShowFirstTaskPopup(true);
          
          // Show notification prompt after first task is added (but with a delay)
          setTimeout(() => {
            if ('Notification' in window && Notification.permission === 'default') {
              const hasSeenNotificationPrompt = localStorage.getItem(`notification_prompt_${user?.id}`);
              if (!hasSeenNotificationPrompt) {
                setShowNotificationPrompt(true);
              }
            }
          }, 3000); // Show after first task popup
        } else if (updatedTasks.length === 10) {
          setShowTenTasksPopup(true);
        }
        
        // Show commitment modal after first task if not committed today
        if (isFirstTask && !hasCommittedToday) {
          setTimeout(() => setShowCommitmentModal(true), 2000);
        }
        
        // Show simple success animation without toast to improve performance
        setShowTaskSuccess(true);
        setTimeout(() => setShowTaskSuccess(false), 1500);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setIsAddingTask(false);
    }
  }, [tasks, dailyTaskLimit, getToken, fetchProgress, setShowFirstTaskPopup, setShowTenTasksPopup, setShowCommitmentModal, hasCommittedToday, isToday]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      handleAddTask(newTaskTitle);
      setNewTaskTitle('');
    }
  };

  // Memoize expensive computations
  const { filteredTasks, completedTasks, totalTasks, completionRate, todaysTasks, todaysCompleted, todaysIncomplete } = useMemo(() => {
    // Calculate today's tasks once
    const todaysTasksCalc = tasks.filter(task => isToday(task.createdAt));
    
    // Filter tasks once
    const filteredTasksCalc = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesFilter = 
        filter === 'all' || 
        (filter === 'pending' && !task.completed) || 
        (filter === 'completed' && task.completed);
      return matchesSearch && matchesFilter;
    });
    
    const completedTasksCalc = tasks.filter(t => t.completed).length;
    const totalTasksCalc = tasks.length;
    const completionRateCalc = totalTasksCalc > 0 ? Math.round((completedTasksCalc / totalTasksCalc) * 100) : 0;
    const todaysCompletedCalc = todaysTasksCalc.filter(t => t.completed).length;
    const todaysIncompleteCalc = todaysTasksCalc.filter(t => !t.completed).length;
    
    return {
      filteredTasks: filteredTasksCalc,
      completedTasks: completedTasksCalc,
      totalTasks: totalTasksCalc,
      completionRate: completionRateCalc,
      todaysTasks: todaysTasksCalc,
      todaysCompleted: todaysCompletedCalc,
      todaysIncomplete: todaysIncompleteCalc
    };
  }, [tasks, debouncedSearchQuery, filter, isToday]);

  const analyzeIncompleteTasks = useCallback(async () => {
    const incompleteTasks = todaysTasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) return "";
    
    // Simple AI-like analysis based on task patterns
    const avgTaskLength = incompleteTasks.reduce((acc, task) => acc + task.title.length, 0) / incompleteTasks.length;
    const hasActionWords = incompleteTasks.some(task => 
      /\b(call|email|write|create|finish|complete|review|send)\b/i.test(task.title)
    );
    const hasTimeWords = incompleteTasks.some(task => 
      /\b(today|tomorrow|urgent|deadline|asap)\b/i.test(task.title)
    );
    
    if (avgTaskLength > 50) {
      return "Some of these tasks look quite detailed - maybe break them down?";
    } else if (hasActionWords) {
      return "I see action-oriented tasks - you're on the right track!";
    } else if (hasTimeWords) {
      return "Time-sensitive tasks detected - prioritize these first!";
    } else {
      return "These tasks look manageable - you can do this!";
    }
  }, [todaysTasks]);

  const handleToggleComplete = useCallback(async (taskId: number, isCompleted: boolean) => {
    // Prevent multiple clicks on the same task
    if (togglingTaskId === taskId) {
      return;
    }

    // Validate task ID
    if (!taskId && taskId !== 0) {
      console.error('Invalid task ID:', taskId);
      toast.error('Invalid task. Please refresh the page.');
      return;
    }

    // Set loading state to prevent multiple clicks
    setTogglingTaskId(taskId);

    try {
      // Use functional state update to avoid dependency issues
      setTasks(prevTasks => {
        const taskToUpdate = prevTasks.find(t => t.id === taskId);
        if (!taskToUpdate) {
          console.error('Task not found:', taskId);
          toast.error('Task not found. Please refresh the page.');
          return prevTasks;
        }

        const isFirstCompletion = !isCompleted && prevTasks.filter(t => t.completed).length === 0;
        
        // Optimistic update
        const updatedTasks = prevTasks.map(task => 
          task.id === taskId ? { ...task, completed: !isCompleted } : task
        );
        
        // Handle API call after state update
        (async () => {
          try {
            const token = await getToken();
            if (!token) {
              toast.error('Authentication error. Please sign in again.');
              // Revert optimistic update
              setTasks(prev => prev.map(task => 
                task.id === taskId ? { ...task, completed: isCompleted } : task
              ));
              return;
            }

            const response = await fetch(`/api/tasks/${taskId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ completed: !isCompleted })
            });

            if (response.ok) {
              await fetchProgress();
              
              if (!isCompleted) {
                if (isFirstCompletion) {
                  setShowFirstCompletePopup(true);
                } else {
                  const completedCount = updatedTasks.filter(t => t.completed).length;
                  if (completedCount % 3 === 0) {
                    toast.success('Great progress! 🎉', { duration: 1500 });
                    
                    if (Notification.permission === 'granted') {
                      try {
                        // Create occasion-specific messages based on progress
                        let celebrationMessage = '';
                        let celebrationTitle = 'Teyra';
                        
                        if (completedCount === 3) {
                          celebrationTitle = 'Teyra';
                          celebrationMessage = `First milestone reached! You've completed 3 tasks today. Mike the Cactus is sprouting with pride! 🌱`;
                        } else if (completedCount === 6) {
                          celebrationTitle = 'Teyra';
                          celebrationMessage = `Halfway there! 6 tasks completed. Your productivity is blooming beautifully! 🌸`;
                        } else if (completedCount === 9) {
                          celebrationTitle = 'Teyra';
                          celebrationMessage = `Outstanding progress! 9 tasks done. Mike says you're growing into a productivity powerhouse! 🌳`;
                        } else if (completedCount >= 12) {
                          celebrationTitle = 'Teyra';
                          celebrationMessage = `Incredible dedication! ${completedCount} tasks completed. You've exceeded all expectations today! 🏆✨`;
                        } else {
                          celebrationTitle = 'Teyra';
                          celebrationMessage = `Amazing consistency! ${completedCount} tasks completed. Mike the Cactus believes in your growth! 🌵`;
                        }
                        
                        const notification = new Notification(celebrationTitle, {
                          body: celebrationMessage,
                          icon: '/teyra-logo-64kb.png',
                          badge: '/teyra-logo-64kb.png',
                          image: '/teyra-logo-64kb.png',
                          tag: 'teyra-celebration',
                          requireInteraction: true, // Stay longer
                          silent: false,
                          renotify: true,
                          vibrate: [200, 100, 200, 100, 200],
                          data: { 
                            url: '/dashboard', 
                            type: 'celebration',
                            completedCount: completedCount 
                          }
                        });
                        
                        notification.onclick = () => {
                          window.focus();
                          notification.close();
                        };
                        
                        // Don't auto-close celebration notifications - let user close them
                        console.log(`🎉 Celebration notification sent for ${completedCount} tasks`);
                        
                      } catch (error) {
                        console.log('Celebration notification failed:', error);
                      }
                    }
                  }
                }
              }
            } else {
              const errorText = await response.text();
              console.error('Task update failed:', response.status, errorText);
              // Revert optimistic update
              setTasks(prev => prev.map(task => 
                task.id === taskId ? { ...task, completed: isCompleted } : task
              ));
              toast.error('Failed to update task. Please try again.');
            }
          } catch (error) {
            console.error('Network error in handleToggleComplete:', error);
            // Revert optimistic update
            setTasks(prev => prev.map(task => 
              task.id === taskId ? { ...task, completed: isCompleted } : task
            ));
            toast.error('Network error. Please check your connection.');
          } finally {
            setTogglingTaskId(null);
          }
        })();
        
        return updatedTasks;
      });
    } catch (error) {
      console.error('Error in handleToggleComplete:', error);
      setTogglingTaskId(null);
    }
  }, [getToken, fetchProgress, setShowFirstCompletePopup]);

  const handleReplaceTask = useCallback(async (oldTaskId: number | string, newTitle: string) => {
    const numericId = typeof oldTaskId === 'string' ? parseInt(oldTaskId, 10) : oldTaskId;
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Authentication error. Please sign in again.');
        return;
      }

      // Delete the old task
      const deleteResponse = await fetch(`/api/tasks/${numericId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete old task');
      }

      // Add the new task
      const addResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle.trim() })
      });

      if (!addResponse.ok) {
        throw new Error('Failed to add new task');
      }

      const newTask = await addResponse.json();
      
      // Update the tasks list
      setTasks(prev => [
        newTask,
        ...prev.filter(task => task.id !== numericId)
      ]);
      
      await fetchProgress();
      toast.success(`Task replaced successfully!`);
    } catch (error) {
      console.error('Error replacing task:', error);
      toast.error('Failed to replace task. Please try again.');
    }
  }, [getToken, fetchProgress]);

  const handleSplitTask = useCallback(async (task: Task) => {
    const todaysTasks = tasks.filter(t => isToday(t.createdAt));
    
    // Check if splitting would exceed daily limit
    if (todaysTasks.length >= dailyTaskLimit) {
      toast.error(`You've reached your daily limit of ${dailyTaskLimit} tasks. Complete some tasks first or adjust your limit!`, {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: 'white',
          border: 'none',
        }
      });
      return;
    }
    
    setIsSplittingTask(task.id);
    
    try {
      const response = await fetch('/api/ai-task-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskTitle: task.title
        })
      });

      if (!response.ok) {
        throw new Error('Failed to split task');
      }

      const data = await response.json();
      const breakdown = data.breakdown || [];
      
      if (breakdown.length === 0) {
        throw new Error('No breakdown received');
      }
      
      // Check if adding breakdown would exceed limit
      if (todaysTasks.length + breakdown.length - 1 > dailyTaskLimit) {
        toast.error(`Splitting this task would create ${breakdown.length} tasks, exceeding your daily limit of ${dailyTaskLimit}. Try a smaller task or increase your limit!`, {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: 'white',
            border: 'none',
          }
        });
        return;
      }
      
      const token = await getToken();
      if (!token) {
        toast.error('Authentication error. Please sign in again.');
        return;
      }

      // Replace the original task with the first breakdown step
      const replaceResponse = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: breakdown[0],
          hasBeenSplit: true
        })
      });

      if (!replaceResponse.ok) {
        throw new Error('Failed to update original task');
      }

      // Add remaining breakdown steps as new tasks
      const newTasks = [];
      for (let i = 1; i < breakdown.length; i++) {
        const addResponse = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ 
            title: breakdown[i],
            hasBeenSplit: true
          })
        });

        if (addResponse.ok) {
          const newTask = await addResponse.json();
          newTasks.push(newTask);
        }
      }

      // Update the tasks list
      setTasks(prev => [
        ...newTasks,
        ...prev.map(t => t.id === task.id ? { ...t, title: breakdown[0], hasBeenSplit: true } : t)
      ]);
      
      await fetchProgress();
      
      toast.success(`Task split into ${breakdown.length} manageable steps! 🎯`, {
        duration: 4000,
        style: {
          background: '#10B981',
          color: 'white',
          border: 'none',
        }
      });
      
    } catch (error) {
      console.error('Error splitting task:', error);
      toast.error('Failed to split task. Please try again.');
    } finally {
      setIsSplittingTask(null);
    }
  }, [tasks, dailyTaskLimit, getToken, fetchProgress, isToday]);

  const handleDeleteTask = useCallback(async (taskId: number) => {
    // Validate task ID
    if (!taskId && taskId !== 0) {
      console.error('Invalid task ID for deletion:', taskId);
      toast.error('Invalid task. Please refresh the page.');
      return;
    }

    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) {
      console.error('Task not found for deletion:', taskId);
      toast.error('Task not found. Please refresh the page.');
      return;
    }

    // Optimistic update for better performance
    setTasks(prev => prev.filter(task => task.id !== taskId));

    try {
      const token = await getToken();
      if (!token) {
        toast.error('Authentication error. Please sign in again.');
        // Revert optimistic update
        setTasks(prev => [...prev, taskToDelete].sort((a, b) => b.id - a.id));
        return;
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchProgress();
        toast.success('Task deleted successfully');
      } else {
        const errorData = await response.text();
        console.error('Task deletion failed:', response.status, errorData);
        // Revert optimistic update
        setTasks(prev => [...prev, taskToDelete].sort((a, b) => b.id - a.id));
        toast.error('Failed to delete task. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Network error. Please check your connection.');
    }
  }, [getToken, fetchProgress, tasks]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full"
        />
      </div>
    );
  }

  // Prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Daily Reset Checker - invisible component */}
      <DailyResetChecker />
      {/* Apple-inspired Header - Fully Responsive */}
      <header className="bg-white/95 backdrop-blur-2xl border-b border-gray-100 sticky top-0 z-40 supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white text-sm font-medium">🌵</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight truncate">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                  <p className="text-sm text-gray-500 font-medium truncate">{user?.firstName || 'there'}</p>
                  {progress?.dailyStartTime && (
                    <ResetCountdown 
                      dailyStartTime={progress.dailyStartTime} 
                      className="hidden sm:block"
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {/* Apple-style Task Counter - Hidden on small screens if too crowded */}
              {hasCommittedToday && (
                <button
                  onClick={() => setShowCommitmentModal(true)}
                  className="hidden xs:flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-full text-xs sm:text-sm font-medium text-green-700 transition-all duration-200 hover:scale-105"
                  title="Change daily task limit"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{todaysTasks.length}/{dailyTaskLimit}</span>
                </button>
              )}
              
              {/* Notification Toggle */}
              <NotificationToggle size="md" className="ml-2" />
              {/* Original notification button (now replaced) */}
              {false && <button
                onClick={async () => {
                  console.log('🔔 Notification button clicked');
                  console.log('Current permission:', Notification.permission);
                  
                  // Log browser and OS info for debugging
                  console.log('🌐 Browser info:', {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    vendor: navigator.vendor,
                    language: navigator.language
                  });
                  
                  // Check if we're in a secure context (required for notifications)
                  console.log('🔒 Secure context:', window.isSecureContext);
                  
                  // Check document visibility and focus
                  console.log('👁️ Document visibility:', document.visibilityState);
                  console.log('🎯 Document has focus:', document.hasFocus());
                  console.log('🪟 Window focused:', document.hasFocus());
                  
                  // Add CSS animations for notification indicator
                  if (!document.getElementById('notification-styles')) {
                    const style = document.createElement('style');
                    style.id = 'notification-styles';
                    style.textContent = `
                      @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                      }
                      @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                      }
                    `;
                    document.head.appendChild(style);
                  }
                  
                  try {
                    if (Notification.permission === 'granted') {
                      console.log('✅ Permission already granted, showing notification');
                      
                      // First, test a simple notification
                      try {
                        console.log('🧪 Testing simple notification first...');
                        
                        // Check if the icon loads
                        const iconUrl = '/teyra-logo-64kb.png';
                        const iconCheck = new Image();
                        iconCheck.onload = () => {
                          console.log('✅ Icon loaded successfully');
                        };
                        iconCheck.onerror = () => {
                          console.log('⚠️ Icon failed to load, using default');
                        };
                        iconCheck.src = iconUrl;
                        
                        const simpleNotification = new Notification('Test', {
                          body: 'This is a simple test notification',
                          icon: iconUrl
                        });
                        
                        simpleNotification.onshow = () => {
                          console.log('✅ Simple notification shown successfully');
                          // Close the simple notification after 2 seconds
                          setTimeout(() => {
                            simpleNotification.close();
                          }, 2000);
                        };
                        
                        simpleNotification.onerror = (error) => {
                          console.error('❌ Simple notification error:', error);
                        };
                        
                      } catch (simpleError) {
                        console.error('❌ Simple notification failed:', simpleError);
                      }
                      
                      // Wait a moment, then show the full notification
                      setTimeout(async () => {
                        // Create macOS-style notification matching the screenshot
                        try {
                          console.log('🎯 Creating notification...');
                          
                          const notification = new Notification('Teyra', {
                            body: 'Test notification successful! Mike the Cactus says your notifications are working perfectly! 🌵✨',
                            icon: '/teyra-logo-64kb.png',
                            badge: '/teyra-logo-64kb.png',
                            image: '/teyra-logo-64kb.png',
                            tag: 'teyra-test',
                            requireInteraction: true,
                            silent: false,
                            renotify: true,
                            vibrate: [200, 100, 200],
                            data: { url: '/dashboard', type: 'test' }
                          });
                          
                          console.log('📱 Notification object created:', notification);
                          
                          // Add event listeners
                          notification.onclick = () => {
                            console.log('🖱️ Notification clicked');
                            window.focus();
                            notification.close();
                          };
                          
                          notification.onshow = () => {
                            console.log('👁️ Notification shown');
                            // Add a visual indicator on the page
                            const indicator = document.createElement('div');
                            indicator.style.cssText = `
                              position: fixed;
                              top: 20px;
                              right: 20px;
                              background: linear-gradient(135deg, #10b981, #059669);
                              color: white;
                              padding: 12px 20px;
                              border-radius: 12px;
                              box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                              z-index: 10000;
                              font-weight: 600;
                              animation: slideIn 0.3s ease-out;
                            `;
                            indicator.innerHTML = '🔔 Notification Sent!';
                            document.body.appendChild(indicator);
                            
                            // Remove after 3 seconds
                            setTimeout(() => {
                              indicator.style.animation = 'slideOut 0.3s ease-in';
                              setTimeout(() => {
                                if (indicator.parentNode) {
                                  indicator.parentNode.removeChild(indicator);
                                }
                              }, 300);
                            }, 3000);
                          };
                          
                          notification.onclose = () => {
                            console.log('❌ Notification closed');
                          };
                          
                          notification.onerror = (error) => {
                            console.error('💥 Notification error:', error);
                          };
                          
                          // Force the notification to show
                          setTimeout(() => {
                            console.log('⏰ Checking if notification is still valid...');
                            if (notification) {
                              console.log('✅ Notification is still valid');
                            }
                          }, 1000);
                          
                          toast.success('Beautiful Teyra notification sent! 🚀');
                          console.log('✅ Teyra-style notification created successfully');
                          
                          // Also test with service worker notification (works better when tab is focused)
                          setTimeout(async () => {
                            try {
                              console.log('🔧 Testing service worker notification...');
                              if ('serviceWorker' in navigator) {
                                const registration = await navigator.serviceWorker.ready;
                                await registration.showNotification('Teyra Service Worker Test 🌵', {
                                  body: 'This notification was sent via service worker - should work even when tab is focused!',
                                  icon: '/teyra-logo-64kb.png',
                                  badge: '/teyra-logo-64kb.png',
                                  tag: 'teyra-sw-test',
                                  requireInteraction: true,
                                  silent: false,
                                  vibrate: [200, 100, 200],
                                  data: { url: '/dashboard' }
                                });
                                console.log('✅ Service worker notification sent');
                              }
                            } catch (swError) {
                              console.error('❌ Service worker notification failed:', swError);
                            }
                          }, 2000);
                          
                        } catch (directError) {
                          console.log('❌ Direct notification failed, trying service worker:', directError);
                          
                          // Fallback to service worker with Teyra style
                          if ('serviceWorker' in navigator) {
                            const registration = await navigator.serviceWorker.ready;
                            await registration.showNotification('Teyra', {
                              body: 'Service worker test successful! Mike the Cactus says your productivity notifications are working! 🌵',
                              icon: '/teyra-logo-64kb.png',
                              badge: '/teyra-logo-64kb.png',
                              tag: 'teyra-sw-test',
                              requireInteraction: false,
                              silent: false,
                              data: { url: '/dashboard' }
                            });
                            toast.success('Teyra notification sent via service worker! 🚀');
                            console.log('✅ Teyra service worker notification sent');
                          }
                        }
                        
                      }, 1000);
                      
                    } else if (Notification.permission === 'default') {
                      console.log('🔄 Requesting permission...');
                      
                      // Show a helpful message before requesting permission
                      toast.info('Teyra would like to send you notifications to help you stay productive! 🔔', {
                        duration: 3000
                      });
                      
                      // Wait a moment for the toast to show
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
                      const permission = await Notification.requestPermission();
                      console.log('Permission result:', permission);
                      
                      if (permission === 'granted') {
                        console.log('✅ Permission granted! Showing welcome notification');
                        
                        // Create beautiful welcome notification with longer duration
                        try {
                          const currentHour = new Date().getHours();
                          let welcomeMessage = '';
                          
                          if (currentHour < 12) {
                            welcomeMessage = 'Good morning! Ready to make today productive? Mike the Cactus is excited to help you build amazing habits! 🌅🌵';
                          } else if (currentHour < 17) {
                            welcomeMessage = 'Good afternoon! Perfect time to tackle your goals. Mike believes in your potential to grow! ☀️🌵';
                          } else {
                            welcomeMessage = 'Good evening! Even late bloomers can flourish. Mike the Cactus is here to support your growth! 🌙🌵';
                          }
                          
                          const notification = new Notification('Teyra', {
                            body: welcomeMessage,
                            icon: '/teyra-logo-64kb.png',
                            badge: '/teyra-logo-64kb.png',
                            image: '/teyra-logo-64kb.png',
                            tag: 'teyra-welcome',
                            requireInteraction: true, // Stay until user interacts
                            silent: false,
                            renotify: false,
                            vibrate: [300, 100, 300],
                            data: {
                              url: '/dashboard',
                              type: 'welcome',
                              timeOfDay: currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening'
                            }
                          });
                          
                          notification.onclick = () => {
                            window.focus();
                            notification.close();
                          };
                          
                          toast.success('Notifications enabled! Welcome to Teyra! 🔔✨');
                          console.log('✅ Teyra welcome notification sent');
                        } catch (directError) {
                          console.log('❌ Direct welcome notification failed:', directError);
                          toast.success('Notifications enabled! Welcome to Teyra! 🔔✨');
                        }
                      } else {
                        console.log('❌ Permission denied');
                        toast.error('Notifications denied. You can enable them in your browser settings later.');
                      }
                    } else {
                      console.log('❌ Notifications blocked');
                      toast.error('Notifications are blocked. Please enable them in your browser settings to get the full Teyra experience!', {
                        duration: 5000,
                        action: {
                          label: 'Learn How',
                          onClick: () => {
                            // Open a help page or show instructions
                            window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank');
                          }
                        }
                      });
                    }
                  } catch (error) {
                    console.error('❌ Notification error:', error);
                    toast.error('Notification failed. Check console for details.');
                  }
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                title="Send test push notification"
              >
                <span className="text-gray-600 text-xs sm:text-sm">🔔</span>
              </button>
              
              /* Apple-style Menu Button - Responsive */}
              
              <div className="flex items-center space-x-1 bg-gray-100 rounded-full p-0.5 sm:p-1">
                <button
                  onClick={() => setOnboardingStep('mood')}
                  className="w-6 h-6 sm:w-7 sm:h-7 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
                  title="Help"
                >
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="w-6 h-6 sm:w-7 sm:h-7 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
                  title="Home"
                >
                  <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600" />
                </button>
              </div>
              
              <div className="flex items-center justify-center">
                <UserButton 
                  afterSignOutUrl="/" 
                  appearance={{
                    elements: {
                      avatarBox: "w-7 h-7 sm:w-8 sm:h-8",
                      userButtonAvatarBox: "w-7 h-7 sm:w-8 sm:h-8",
                      userButtonTrigger: "rounded-full shadow-sm hover:shadow-md transition-shadow"
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        {/* Apple-style Mood Section - Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-200/60 p-4 sm:p-6 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-500" data-onboarding="mood-section">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 tracking-tight">How are you feeling?</h2>
                <p className="text-gray-600 text-sm font-medium">Being honest about your mood helps build sustainable habits</p>
              </div>
              <button
                onClick={() => setShowMoodCheck(true)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-lime-600 hover:from-green-600 hover:to-lime-700 rounded-xl sm:rounded-2xl text-white font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95 self-start sm:self-auto"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Set Mood
              </button>
            </div>
            
            {/* Be Real Button - Prominent placement */}
            {todaysIncomplete > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="text-center mb-3">
                  <p className="text-blue-600 text-xs font-medium">
                    Honesty builds consistency • Reflection creates growth
                  </p>
                </div>
                <button
                  onClick={() => setShowHonestyModal(true)}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                >
                  <span className="text-lg">🧠</span>
                  <span>Be Real About Today</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hero Section with Task Creation - Responsive */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 xl:gap-12">
            {/* Apple-style Task Creation - Responsive */}
            <div className="order-2 xl:order-1">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-200/60 p-4 sm:p-6 lg:p-8 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-500">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
                    What's on your mind?
                  </h2>
                  <p className="text-gray-600 text-base sm:text-lg font-medium">
                    Add a task and let's make it happen
                  </p>
                </div>

                {/* Modern Task Input */}
                <form onSubmit={handleFormSubmit} className="relative" data-onboarding="task-input">
                  <div className="relative">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Start typing your task..."
                      className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg bg-gray-50/80 border-0 rounded-xl sm:rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 placeholder-gray-400 font-medium ${
                        isAddingTask ? 'bg-green-50 ring-2 ring-green-400' : ''
                      }`}
                      disabled={isAddingTask}
                    />
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim() || isAddingTask}
                      className={`absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-3 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${
                        isAddingTask 
                          ? 'bg-green-500 text-white shadow-lg scale-105' 
                          : newTaskTitle.trim() 
                            ? 'bg-gradient-to-r from-green-500 to-lime-600 hover:from-green-600 hover:to-lime-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        // Add subtle haptic feedback on mobile
                        if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
                          navigator.vibrate(50);
                        }
                      }}
                    >
                      {isAddingTask ? (
                        <>
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">Adding...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Add</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Simple visual feedback */}
                  {isAddingTask && (
                    <div className="mt-2 text-center">
                      <div className="inline-flex items-center space-x-2 text-sm text-green-600 font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Adding your task...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Simple success message */}
                  {showTaskSuccess && (
                    <div className="mt-2 text-center">
                      <div className="inline-flex items-center space-x-2 text-sm text-green-600 font-medium">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span>Task added successfully!</span>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Apple-style Filter Controls */}
              {tasks.length > 0 && (
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-semibold text-gray-900">Show:</span>
                    <div className="flex bg-gray-100/80 rounded-2xl p-1 backdrop-blur-sm">
                      {[
                        { key: 'all', label: 'All', count: tasks.length },
                        { key: 'pending', label: 'Pending', count: tasks.filter(t => !t.completed).length },
                        { key: 'completed', label: 'Done', count: tasks.filter(t => t.completed).length }
                      ].map(({ key, label, count }) => (
                        <button
                          key={key}
                          onClick={() => setFilter(key as 'all' | 'pending' | 'completed')}
                          className={`px-4 py-2 text-sm rounded-xl font-semibold transition-all duration-200 ${
                            filter === key
                              ? 'bg-white text-gray-900 shadow-lg shadow-black/10 scale-105'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                          }`}
                        >
                          {label} ({count})
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {completedTasks > 0 && (
                    <div className="text-sm font-medium text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full">
                      {completedTasks} completed
                    </div>
                  )}
                </div>
              )}

              {/* Tasks List - Right under the task input */}
              <div
                className="mt-4 space-y-3"
              >
                {filteredTasks.map((task, index) => (
                  <div key={task.id} data-onboarding={index === 0 ? "first-task" : undefined}>
                    <TaskItem
                      task={task}
                      index={index}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      onSplitTask={handleSplitTask}
                      isSplitting={isSplittingTask === task.id}
                      isToggling={togglingTaskId === task.id}
                    />
                  </div>
                ))}

                {/* Empty State */}
                {tasks.length === 0 && (
                  <div
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-lime-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ready to be productive?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add your first task above and start building momentum
                    </p>
                  </div>
                )}
                
                {/* Filtered Empty State */}
                {tasks.length > 0 && filteredTasks.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Filter className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">
                      No {filter} tasks
                    </h3>
                    <p className="text-sm text-gray-600">
                      {filter === 'completed' 
                        ? 'Complete some tasks to see them here!' 
                        : filter === 'pending'
                        ? 'All tasks are completed! Great job!'
                        : 'Try adjusting your filter.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cactus & Progress - Shows first on mobile, responsive */}
            <div className="order-1 xl:order-2">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-200/60 p-4 sm:p-6 lg:p-8 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-500 text-center flex flex-col justify-center min-h-[280px] sm:min-h-[350px] xl:h-full">
                {/* Emphasized Cactus */}
                {progress && (
                  <div
                    className="mb-4 sm:mb-6 lg:mb-8 flex flex-col items-center"
                  >
                    <div className="flex justify-center items-center transform scale-110 sm:scale-125 lg:scale-150 mb-8 sm:mb-10 transition-all duration-500 hover:scale-125 sm:hover:scale-150 lg:hover:scale-175">
                      <div className="transition-all duration-700 ease-out">
                        <Cactus 
                          mood={progress.mood as 'sad' | 'neutral' | 'happy'} 
                          todayCompletedTasks={tasks.filter(t => t.completed)}
                        />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
                      Meet Mike!
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-8 sm:mb-10 px-2 text-center leading-relaxed">
                      Your productivity companion who grows happier as you complete tasks
                    </p>
                  </div>
                )}

                {/* Progress Circle - The Mood Bar */}
                {progress && (
                  <div
                    className="mb-4 sm:mb-6"
                  >
                    <div className="scale-75 sm:scale-90 lg:scale-100">
                      <ProgressCircle 
                        completed={progress.allTimeCompleted || 0} 
                        total={progress.maxValue || 10}
                        maxValue={progress.maxValue || 10}
                        mood={progress.mood}
                      />
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 sm:pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{todaysCompleted}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Completed Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{todaysTasks.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Added Today</div>
                  </div>
                </div>
                
                
                {/* Daily Limit Info */}
                <div className="mt-4 text-center text-xs text-gray-500">
                  {todaysTasks.length}/{dailyTaskLimit} tasks today
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Stats Panel */}
      </main>

      {/* Celebration Popups */}
      {showFirstTaskPopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFirstTaskPopup(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-6xl mb-4"
            >
              🎉
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Awesome!</h3>
            <p className="text-gray-800 mb-4 text-lg font-semibold">
              You will <span className="font-bold text-red-600">complete</span> this task (and many more)
            </p>
            
            <div className="text-left mb-6">
              <p className="text-gray-700 font-medium mb-3">Why?</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>It's important to you - that's why you put it as a task</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Mike the Cactus will cheer you on and track your progress</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>AI can break down complex tasks into manageable steps</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Daily mood check-ins keep you emotionally honest</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Smart AI suggestions help you stay focused and motivated</span>
                </li>
              </ul>
            </div>
            
            <button
              onClick={() => setShowFirstTaskPopup(false)}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-medium transition-colors"
            >
              Let's do this! 🚀
            </button>
          </div>
        </div>
      )}

      {showFirstCompletePopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFirstCompletePopup(false)}
        >
          <div
            className="bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-green-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-6xl mb-4"
            >
              ✅
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">First one done!</h3>
            <p className="text-gray-600 mb-4">Amazing work! You've completed your first task. Mike is getting happier already! 🌵</p>
            <div className="bg-green-50 rounded-xl p-3 mb-4">
              <p className="text-green-800 text-sm font-medium text-center">
                ✨ Honest self-reflection after each task builds lasting habits
              </p>
            </div>
            <button
              onClick={() => setShowFirstCompletePopup(false)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors"
            >
              Keep going! 💪
            </button>
          </div>
        </div>
      )}

      {showCommitmentModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowCommitmentModal(false);
            setShowTaskLimitReminder(true); // Show reminder in navbar if dismissed
          }}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowCommitmentModal(false);
                setShowTaskLimitReminder(true); // Show reminder if manually closed
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div
              className="text-6xl mb-4"
            >
              🌵
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {hasCommittedToday ? 'Update your commitment' : 'Let\'s make a commitment!'}
            </h3>
            <p className="text-gray-600 mb-4">
              {hasCommittedToday 
                ? 'How many tasks do you want to commit to for today?' 
                : 'Mike believes in you! How many tasks do you realistically want to add today?'}
            </p>
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm font-medium text-center">
                💡 Being honest about your capacity leads to sustainable success
              </p>
            </div>
            
            <div className="flex justify-center space-x-3 mb-6">
              {[3, 5, 7, 10].map((limit) => (
                <button
                  key={limit}
                  onClick={() => setDailyTaskLimit(limit)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    dailyTaskLimit === limit
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {limit}
                </button>
              ))}
            </div>
            
            <button
              onClick={async () => {
                setHasCommittedToday(true);
                setShowCommitmentModal(false);
                setShowTaskLimitReminder(false); // Hide reminder once committed
                
                // Save the daily task limit to localStorage
                if (user?.id) {
                  localStorage.setItem(`dailyTaskLimit_${user.id}`, dailyTaskLimit.toString());
                  localStorage.setItem(`hasCommittedToday_${user.id}`, new Date().toDateString());
                }
                
                const message = hasCommittedToday 
                  ? `Perfect! Your daily limit is now ${dailyTaskLimit} tasks. Mike is proud of your self-awareness! 🌵`
                  : `Great! You've committed to ${dailyTaskLimit} tasks today. Mike is counting on you! 🌵`;
                toast.success(message);
                
                // If there's a pending task from when they tried to add before committing, add it now
                if (pendingTaskTitle.trim()) {
                  const taskToAdd = pendingTaskTitle;
                  setPendingTaskTitle(''); // Clear the pending task
                  await handleAddTask(taskToAdd);
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors"
            >
              {hasCommittedToday ? `Update to ${dailyTaskLimit} tasks! 🔄` : `I commit to ${dailyTaskLimit} tasks! 💪`}
            </button>
          </div>
        </div>
      )}

      {showAIInsightModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAIInsightModal(false)}
        >
          <div
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-center border border-blue-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-6xl mb-4"
            >
              🌵🧠
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Mike's Daily Insight</h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              {aiInsight}
            </p>
            <button
              onClick={() => setShowAIInsightModal(false)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-2xl font-medium transition-all"
            >
              Thanks Mike! Let's do this! 🚀
            </button>
          </div>
        </div>
      )}

      <BeRealModal
        isOpen={showHonestyModal}
        onClose={() => setShowHonestyModal(false)}
        incompleteTasks={todaysTasks.filter(t => !t.completed)}
        completedTasks={todaysCompleted}
        totalTasks={todaysTasks.length}
        onAddTask={handleAddTask}
        onReplaceTask={handleReplaceTask}
      />

      <DailySummaryPopup
        isOpen={showDailySummary}
        onClose={() => setShowDailySummary(false)}
        tasks={tasks}
        progress={progress || {
          completedTasks: 0,
          totalTasks: 0,
          allTimeCompleted: 0,
          mood: 'neutral'
        }}
        onTasksReset={async () => {
          try {
            const token = await getToken();
            await fetch('/api/daily-reset', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ userId: user?.id })
            });
            
            // Refresh tasks and progress after reset
            await fetchTasks();
            await fetchProgress();
            
            setShowDailySummary(false);
            toast.success('Tasks reset! Ready for a fresh start! 🌅');
          } catch (error) {
            console.error('Error resetting tasks:', error);
            toast.error('Failed to reset tasks');
          }
        }}
      />

      {showTenTasksPopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTenTasksPopup(false)}
        >
          <div
            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-purple-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-6xl mb-4"
            >
              ��
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">10 Tasks Strong!</h3>
            <p className="text-gray-600 mb-6">Incredible! You've reached 10 tasks. You're becoming a productivity master! Mike is so proud! 🌟</p>
            <button
              onClick={() => setShowTenTasksPopup(false)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl font-medium transition-all"
            >
              I'm unstoppable! 🔥
            </button>
          </div>
        </div>
      )}

      {showMoodCheck && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowMoodCheck(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <MoodCheckIn 
              onMoodSelect={async (mood) => {
                try {
                  const token = await getToken();
                  await fetch('/api/progress', {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ mood })
                  });
                  await fetchProgress();
                  setShowMoodCheck(false);
                } catch (error) {
                  console.error('Error updating mood:', error);
                }
              }} 
              onTaskSuggestion={async (task) => {
                try {
                  const token = await getToken();
                  const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ title: task })
                  });
                  if (response.ok) {
                    const newTask = await response.json();
                    setTasks(prev => [newTask, ...prev]);
                    await fetchProgress();
                    toast.success('Task suggestion added!');
                    setShowMoodCheck(false);
                  }
                } catch (error) {
                  console.error('Error adding suggested task:', error);
                }
              }}
              onDismiss={() => setShowMoodCheck(false)}
              existingTasks={tasks.map(task => task.title)}
            />
          </div>
        </div>
      )}

      {/* Onboarding Guide */}
      {onboardingStep && (
        <OnboardingGuide
          step={onboardingStep}
          onNext={() => {
            if (onboardingStep === 'mood') {
              setOnboardingStep('add-task');
            } else if (onboardingStep === 'add-task') {
              setOnboardingStep('complete-task');
            } else if (onboardingStep === 'complete-task') {
              setOnboardingStep('done');
            }
          }}
          onSkip={() => {
            setOnboardingStep('done');
          }}
          onComplete={() => {
            setOnboardingStep(null);
            setHasSeenOnboarding(true);
            // Save to localStorage
            if (user?.id) {
              localStorage.setItem(`onboarding_${user.id}`, 'true');
            }
          }}
        />
      )}

      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="text-center">
              {/* Cactus Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🌵</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Stay Productive with Teyra
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Get gentle reminders and celebrate your progress with Mike the Cactus! 
                Notifications help you build sustainable productivity habits.
              </p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={async () => {
                    try {
                      const permission = await Notification.requestPermission();
                      if (permission === 'granted') {
                        toast.success('Notifications enabled! Welcome to Teyra! 🔔✨');
                        
                        // Show welcome notification
                        const notification = new Notification('Welcome to Teyra! 🌵', {
                          body: 'Your productivity journey starts now! Mike the Cactus is here to help you build sustainable habits. 🌱✨',
                          icon: '/teyra-logo-64kb.png',
                          badge: '/teyra-logo-64kb.png',
                          image: '/teyra-logo-64kb.png',
                          tag: 'teyra-welcome',
                          requireInteraction: false,
                          silent: false,
                          renotify: false,
                          vibrate: [200, 100, 200],
                          data: { url: '/dashboard', type: 'teyra-welcome' }
                        });
                        
                        notification.onclick = () => {
                          window.focus();
                          notification.close();
                        };

                        // Send welcome email if this is their first time enabling notifications
                        const hasReceivedWelcomeEmail = localStorage.getItem(`welcome_email_sent_${user?.id}`);
                        if (!hasReceivedWelcomeEmail && user?.emailAddresses?.[0]?.emailAddress) {
                          try {
                            await fetch('/api/send-daily-email', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                email: user.emailAddresses[0].emailAddress,
                                name: user.firstName || 'there',
                                type: 'first_task_reminder'
                              }),
                            });
                            localStorage.setItem(`welcome_email_sent_${user.id}`, 'true');
                            console.log('📧 Welcome email sent successfully');
                          } catch (emailError) {
                            console.warn('⚠️ Could not send welcome email:', emailError);
                          }
                        }
                      } else {
                        toast.error('Notifications denied. You can enable them later in browser settings.');
                      }
                    } catch (error) {
                      console.error('Notification permission error:', error);
                      toast.error('Failed to enable notifications');
                    }
                    
                    // Mark as seen and close
                    localStorage.setItem(`notification_prompt_${user?.id}`, 'true');
                    setShowNotificationPrompt(false);
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Enable Notifications 🔔
                </button>
                
                <button
                  onClick={() => {
                    localStorage.setItem(`notification_prompt_${user?.id}`, 'true');
                    setShowNotificationPrompt(false);
                    toast.info('You can enable notifications anytime from the bell icon! 🔔');
                  }}
                  className="text-gray-500 hover:text-gray-700 font-medium py-2 px-4 rounded-xl transition-colors duration-200"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Smart Mood Suggestion Modal */}
      {showSmartMoodSuggestion && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🧠</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mike Notice Something...
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                You've been working hard but haven't checked in with your mood lately. 
                How are you feeling? This helps Mike understand how to better support you! 🌵
              </p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    if (user?.id) {
                      sessionStorage.setItem(`mood_suggestion_${user.id}_${new Date().toDateString()}`, 'true');
                      localStorage.setItem(`last_mood_check_${user.id}`, new Date().toISOString());
                    }
                    setShowSmartMoodSuggestion(false);
                    setShowMoodCheck(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Check My Mood 💙
                </button>
                
                <button
                  onClick={() => {
                    if (user?.id) {
                      sessionStorage.setItem(`mood_suggestion_${user.id}_${new Date().toDateString()}`, 'true');
                    }
                    setShowSmartMoodSuggestion(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 font-medium py-2 px-4 rounded-xl transition-colors duration-200"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart AI Split Suggestion Modal */}
      {showSmartAISplitSuggestion && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">⚡</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mike Has an Idea!
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Some of your tasks look pretty complex! Mike noticed they might be easier 
                if broken down into smaller steps. Want AI to help split them up? 🤖✨
              </p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    if (user?.id) {
                      sessionStorage.setItem(`split_suggestion_${user.id}_${new Date().toDateString()}`, 'true');
                    }
                    setShowSmartAISplitSuggestion(false);
                    // Find the first complex task and split it
                    const complexTask = tasks.find(task => 
                      !task.completed && 
                      (task.title.length > 40 || 
                       /\b(and|&|,|\+)\b/gi.test(task.title) || 
                       /\b(complex|difficult|hard|big|large|major)\b/gi.test(task.title)) &&
                      !task.hasBeenSplit
                    );
                    if (complexTask) {
                      handleSplitTask(complexTask);
                    }
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Split My Tasks ⚡
                </button>
                
                <button
                  onClick={() => {
                    if (user?.id) {
                      sessionStorage.setItem(`split_suggestion_${user.id}_${new Date().toDateString()}`, 'true');
                    }
                    setShowSmartAISplitSuggestion(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 font-medium py-2 px-4 rounded-xl transition-colors duration-200"
                >
                  Not Right Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email System Tester - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-40">
          <EmailSystemTester />
        </div>
      )}
      
    </div>
  );
}