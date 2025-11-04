'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { Plus, Check, Trash2, Target, List, Calendar, Settings, HelpCircle, Sparkles, Brain, Zap } from 'lucide-react'
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Cactus } from '@/components/Cactus';
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";
import { motion, AnimatePresence } from 'framer-motion';
import DailyResetChecker from '@/components/DailyResetChecker';
import MoodTaskGenerator from '@/components/MoodTaskGenerator';
import { useNotifications } from '@/hooks/useNotifications';
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { OnboardingTour } from '@/components/OnboardingTour';
import { SmartNotificationSetup } from '@/components/SmartNotificationSetup';
import { NotificationSettings } from '@/components/NotificationSettings';
import * as gtag from '@/lib/gtag';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Zero-flicker task card - instant appearance
const TaskCard = React.memo(({ 
  task, 
  onToggle, 
  onDelete,
  isSustainable = false
}: { 
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  isSustainable?: boolean;
}) => {
  const [justCompleted, setJustCompleted] = useState(false);
  
  // Track when task is completed to prevent immediate hover state
  React.useEffect(() => {
    if (task.completed) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [task.completed]);
  
  return (
    <div className={`group relative backdrop-blur-sm border rounded-2xl p-4 hover:shadow-md transition-all duration-200 ${
      isSustainable 
        ? 'bg-green-500/10 border-green-400/30 hover:border-green-400/50 hover:bg-green-500/20' 
        : 'bg-white/5 border-white/20 hover:border-white/30 hover:bg-white/10'
    }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={() => onToggle(task.id)}
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${
              task.completed 
                ? `bg-green-500 border-green-500 text-white ${!justCompleted ? 'hover:bg-gray-500 hover:border-gray-500' : ''}` 
                : 'border-white/30 hover:border-green-400 bg-white/5 hover:bg-green-500/20'
            }`}
          >
            <motion.div
              initial={false}
              animate={{
                scale: task.completed ? 1 : 0,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut"
              }}
            >
              <Check className="w-2.5 h-2.5" />
            </motion.div>
          </button>
          
          <span 
            className={`flex-1 transition-all duration-200 font-medium ${
              task.completed 
                ? 'text-white/40 line-through' 
                : 'text-white'
            }`}
          >
            {task.title}
            {isSustainable && (
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 border border-green-400/30 px-2 py-0.5 rounded-full">
                20 pts
              </span>
            )}
          </span>
        </div>
        
        <button
          onClick={() => onDelete(task.id)}
          className="flex items-center justify-center w-8 h-8 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
          title="Delete Task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default function MVPDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { 
    permission, 
    sendTaskCompletionNotification, 
    sendAchievementNotification,
    sendFirstTaskNotification 
  } = useNotifications();
  const {
    trackTaskCreated,
    trackTaskCompleted,
    trackTaskDeleted,
    trackMoodSelected,
    trackSessionStart,
    trackMilestoneAchieved
  } = useBehaviorTracking();
  
  // Initialize smart notifications
  useSmartNotifications();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [userProgress, setUserProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [currentMood, setCurrentMood] = useState<{id: string, emoji: string, label: string, color: string} | null>(null);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);
  const [confirmationsDismissed, setConfirmationsDismissed] = useState(false);
  const [showMilestonePopup, setShowMilestonePopup] = useState(false);
  const [milestoneMessage, setMilestoneMessage] = useState('');
  const [showDailyLimitPopup, setShowDailyLimitPopup] = useState(false);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [showSmartNotificationSetup, setShowSmartNotificationSetup] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [hasCompletedFirstTask, setHasCompletedFirstTask] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Sustainable tasks state - very easy to complete
  const sustainableTasks = [
    "🌱 Use a reusable water bottle",
    "♻️ Put one item in recycling",
    "🚶 Take stairs instead of elevator",
    "💡 Turn off one light you're not using",
    "🌿 Save food scraps for composting",
    "📱 Choose digital receipt at store",
    "🚿 Reduce shower time by 1 minute",
    "🌍 Buy one local product if shopping",
    "🔌 Unplug one device when done",
    "🥬 Add vegetables to one meal"
  ];

  // Memoized values for performance
  const completedTasksCount = useMemo(() => tasks.filter(t => t?.completed).length, [tasks]);
  const totalTasksCount = useMemo(() => tasks.length, [tasks]);
  const completedSustainableTasksCount = useMemo(() => 
    tasks.filter(t => t?.completed && sustainableTasks.includes(t.title)).length, 
    [tasks]
  );
  
  // Optimized progress calculation - only recalculate when tasks actually change
  const rawTotalPoints = useMemo(() => {
    if (tasks.length === 0) return 0;
    
    // Calculate stored points by parsing archived tasks from ALL tasks (more accurate)
    const archivedTasks = tasks.filter(task => task.title.includes('[ARCHIVED'));
    let storedPoints = 0;
    
    if (archivedTasks.length > 0) {
      const archivedRegularTasks = archivedTasks.filter(task => 
        !sustainableTasks.some(sustainableTask => 
          task.title.includes(sustainableTask.replace(/^🌱|♻️|🚶|💡|🌿\s*/g, ''))
        )
      );
      const archivedSustainableTasks = archivedTasks.filter(task => 
        sustainableTasks.some(sustainableTask => 
          task.title.includes(sustainableTask.replace(/^🌱|♻️|🚶|💡|🌿\s*/g, ''))
        )
      );
      storedPoints = (archivedRegularTasks.length * 10) + (archivedSustainableTasks.length * 20);
      
      console.log('📊 Archived tasks analysis:', {
        totalArchived: archivedTasks.length,
        archivedRegular: archivedRegularTasks.length,
        archivedSustainable: archivedSustainableTasks.length,
        storedPoints
      });
    }
    
    // Calculate current session points (regular = 10, sustainable = 20)
    // Exclude archived tasks from current session calculations
    const currentCompletedTasks = tasks.filter(t => t?.completed && !t.title.includes('[ARCHIVED'));
    const regularCompleted = currentCompletedTasks.filter(t => !sustainableTasks.includes(t.title)).length;
    const sustainableCompleted = currentCompletedTasks.filter(t => sustainableTasks.includes(t.title)).length;
    const currentPoints = (regularCompleted * 10) + (sustainableCompleted * 20);
    
    // Total = stored + current (this updates in real-time as tasks are toggled)
    const totalPoints = storedPoints + currentPoints;
    
    console.log('🔍 Real-time points calculation:', {
      archivedTasksCount: archivedTasks.length,
      storedPoints,
      regularCompleted,
      sustainableCompleted,
      currentPoints,
      totalPoints,
      tasksLength: tasks.length
    });
    
    return totalPoints;
  }, [tasks]);

  // Calculate current milestone and progress within that milestone
  const milestoneData = useMemo(() => {
    let currentMilestone = 0;
    let displayPoints = rawTotalPoints;
    let cactusState = 'sad';
    let maxPoints = 100;

    // Determine which milestone we're in
    if (rawTotalPoints >= 250) { // 100 + 150 = 250 total to reach happy
      currentMilestone = 2;
      displayPoints = rawTotalPoints - 250; // Start from 0 for final stage  
      if (displayPoints > 200) displayPoints = 200; // Cap at 200
      cactusState = 'happy';
      maxPoints = 200;
    } else if (rawTotalPoints >= 100) {
      currentMilestone = 1;
      displayPoints = rawTotalPoints - 100; // Start from 0 for this stage
      cactusState = 'neutral';
      maxPoints = 150;
    }

    console.log('🎯 Milestone calculation:', {
      rawTotalPoints,
      currentMilestone,
      displayPoints,
      maxPoints,
      cactusState
    });

    return {
      milestone: currentMilestone,
      currentPoints: displayPoints,
      maxPoints: maxPoints,
      cactusState: cactusState,
      totalPointsEarned: rawTotalPoints
    };
  }, [rawTotalPoints]);
  
  // Calculate daily task count for limit tracking
  const dailyTasksCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    }).length;
  }, [tasks]);

  // Check if confirmations have been dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('task_confirmations_dismissed');
    if (dismissed === 'true') {
      setConfirmationsDismissed(true);
    }
  }, []);

  // Fetch user data - optimized for faster loading
  const fetchUserData = useCallback(async () => {
    if (!user || !isHydrated) return;
    
    try {
      setIsLoading(true);
      const token = await getToken();
      
      // Fetch tasks first (most important for UI)
      const tasksRes = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const tasksData = await tasksRes.json();
      const tasksList = Array.isArray(tasksData) ? tasksData : tasksData.tasks || [];
      setTasks(tasksList);
      
      // Immediately show UI with tasks, load progress in background
      setIsLoading(false);
      
      // Load progress data in background (less critical for immediate UI)
      try {
        const progressRes = await fetch('/api/progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setUserProgress(progressData);
        } else if (progressRes.status === 404) {
          // User progress doesn't exist, create it
          console.log('Creating user progress for new user');
          const createRes = await fetch('/api/progress', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (createRes.ok) {
            const newProgressData = await createRes.json();
            setUserProgress(newProgressData);
          }
        }
      } catch (progressError) {
        console.error('Error fetching/creating progress:', progressError);
        // Don't show error for background progress load
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      setIsLoading(false);
    }
  }, [user, getToken, isHydrated]);

  // Hydration effect - ensures client-side hydration is complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!user?.id || !isHydrated) return;
    
    fetchUserData();
    // Track session start
    try {
      trackSessionStart();
    } catch (error) {
      console.warn('Session tracking failed:', error);
    }

    // Check if user should see onboarding tour
    const hasSeenTour = localStorage.getItem(`dashboard_tour_${user.id}`) === 'true';
    if (!hasSeenTour) {
      // Show tour after a short delay to let dashboard load
      setTimeout(() => {
        setShowOnboardingTour(true);
      }, 1000);
    }
  }, [fetchUserData, trackSessionStart, user?.id, isHydrated]);

  // Force loading to complete if user is available but still loading
  useEffect(() => {
    if (user?.id && isLoading) {
      const timeout = setTimeout(() => {
        console.log('Forcing loading completion for user:', user.id);
        setIsLoading(false);
      }, 3000); // Max 3 seconds loading
      
      return () => clearTimeout(timeout);
    }
  }, [user?.id, isLoading]);

  // Add task - Optimistic updates for instant responsiveness
  const handleAddTask = async () => {
    if (!newTask.trim() || !user) return;

    // Check daily limit before adding
    if (dailyTasksCount >= 10) {
      setShowDailyLimitPopup(true);
      return;
    }

    const taskTitle = newTask.trim();
    setNewTask(''); // Clear input immediately
    
    // Create optimistic task immediately
    const optimisticTask: Task = {
      id: Date.now(), // Temporary ID
      title: taskTitle,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to UI instantly
    setTasks(prev => [optimisticTask, ...prev]);
    toast.success('Task added!');
    
    // Send notification for first task
    if (tasks.length === 0 && permission.granted) {
      sendFirstTaskNotification(taskTitle);
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: taskTitle })
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic task with real data
        setTasks(prev => prev.map(task => 
          task.id === optimisticTask.id ? data : task
        ));
        
        // Track successful task creation (non-blocking)
        try {
          trackTaskCreated(taskTitle, data.id);
          gtag.trackTaskCreated(taskTitle);
        } catch (error) {
          console.warn('Behavior tracking failed:', error);
        }
      } else {
        // Remove optimistic task on failure
        setTasks(prev => prev.filter(task => task.id !== optimisticTask.id));
        const error = await response.json();
        toast.error(error.error || 'Failed to add task');
      }
    } catch (error) {
      // Remove optimistic task on failure
      setTasks(prev => prev.filter(task => task.id !== optimisticTask.id));
      toast.error('Failed to add task');
    }
  };

  // Toggle task completion - with confirmation popup
  const handleToggleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedState = !task.completed;

    // If marking as complete and confirmations not dismissed, show popup
    if (newCompletedState && !confirmationsDismissed) {
      setPendingTaskId(taskId);
      setShowConfirmationPopup(true);
      return;
    }

    // Otherwise proceed with normal completion logic
    await completeTask(taskId, newCompletedState);
  };

  // Check for milestone achievement
  const checkMilestoneAchievement = useCallback((oldPoints: number, newPoints: number) => {
    if (newPoints <= oldPoints) return; // Only check when points increase
    
    // Check if we crossed the 100 point threshold (sad -> neutral)
    if (oldPoints < 100 && newPoints >= 100) {
      const message = "Mike is not sad anymore, but he can be happier! 🌱";
      setMilestoneMessage(message);
      setShowMilestonePopup(true);
      
      // Send achievement notification
      if (permission.granted) {
        sendAchievementNotification(message);
      }
      trackMilestoneAchieved('Milestone 1: Neutral Cactus', newPoints);
      gtag.trackMilestoneReached('Neutral Cactus', newPoints);
    }
    // Check if we crossed the 250 point threshold (neutral -> happy)  
    else if (oldPoints < 250 && newPoints >= 250) {
      const message = "Mike is happy now! You're doing amazing! 🌟";
      setMilestoneMessage(message);
      setShowMilestonePopup(true);
      
      // Send achievement notification
      if (permission.granted) {
        sendAchievementNotification(message);
      }
      trackMilestoneAchieved('Milestone 2: Happy Cactus', newPoints);
      gtag.trackMilestoneReached('Happy Cactus', newPoints);
    }
  }, [permission.granted, sendAchievementNotification, trackMilestoneAchieved]);

  // Actual task completion logic
  const completeTask = async (taskId: number, newCompletedState: boolean) => {
    const oldTotalPoints = rawTotalPoints;
    
    // Update UI immediately with boost effect
    setTasks(prev => 
      prev.map(t => 
        t.id === taskId ? { ...t, completed: newCompletedState } : t
      )
    );
    
    // Check for milestone achievement after state would update
    if (newCompletedState) {
      const task = tasks.find(t => t.id === taskId);
      const pointsToAdd = sustainableTasks.includes(task?.title || '') ? 20 : 10;
      checkMilestoneAchievement(oldTotalPoints, oldTotalPoints + pointsToAdd);
    }
    
    // Immediate feedback
    toast.success(newCompletedState ? 'Great job! 🎉' : 'Task unmarked');
    
    // Show smart notification setup only after first task completion (one-time)
    if (newCompletedState && !hasCompletedFirstTask && user?.id) {
      const hasSeenSetup = localStorage.getItem(`smart_setup_${user.id}`) === 'true';
      const hasShownSetup = sessionStorage.getItem(`shown_setup_${user.id}`) === 'true';
      
      if (!hasSeenSetup && !hasShownSetup) {
        setHasCompletedFirstTask(true);
        sessionStorage.setItem(`shown_setup_${user.id}`, 'true'); // Prevent multiple shows in same session
        
        // Show setup after a short delay
        setTimeout(() => {
          setShowSmartNotificationSetup(true);
        }, 2000);
      }
    }
    
    // Send task completion notification and track behavior
    if (newCompletedState && permission.granted) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        sendTaskCompletionNotification(task.title);
        try {
          trackTaskCompleted(task.title, taskId);
          gtag.trackTaskCompleted(task.title);
        } catch (error) {
          console.warn('Task completion tracking failed:', error);
        }
      }
    }

    // Background API call
    try {
      const token = await getToken();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: newCompletedState })
      });

      if (!response.ok) {
        // Revert if failed
        setTasks(prev => 
          prev.map(t => 
            t.id === taskId ? { ...t, completed: !newCompletedState } : t
          )
        );
        toast.error('Failed to update task');
      }
      // Note: We no longer update userProgress since we calculate milestones client-side
    } catch (error) {
      // Revert if failed
      setTasks(prev => 
        prev.map(t => 
          t.id === taskId ? { ...t, completed: !newCompletedState } : t
        )
      );
      toast.error('Failed to update task');
    }
  };

  // Handle confirmation popup responses
  const handleConfirmCompletion = async (confirmed: boolean) => {
    if (confirmed && pendingTaskId) {
      await completeTask(pendingTaskId, true);
    }
    setShowConfirmationPopup(false);
    setPendingTaskId(null);
  };

  const handleDismissConfirmations = () => {
    localStorage.setItem('task_confirmations_dismissed', 'true');
    setConfirmationsDismissed(true);
    setShowConfirmationPopup(false);
    
    // Complete the pending task
    if (pendingTaskId) {
      completeTask(pendingTaskId, true);
    }
    setPendingTaskId(null);
  };

  // Handle adding a sustainable task
  const handleAddSustainableTask = async () => {
    // Check daily limit before adding
    if (dailyTasksCount >= 10) {
      setShowDailyLimitPopup(true);
      return;
    }

    const randomTask = sustainableTasks[Math.floor(Math.random() * sustainableTasks.length)];
    const optimisticTask: Task = {
      id: Date.now() + Math.random(),
      title: randomTask,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setTasks(prev => [optimisticTask, ...prev]);
    toast.success('Sustainable task added! Complete it for 20 points! 🌱');

    try {
      const token = await getToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: randomTask })
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === optimisticTask.id ? data : task
        ));
      } else {
        setTasks(prev => prev.filter(task => task.id !== optimisticTask.id));
        toast.error('Failed to add sustainable task');
      }
    } catch (error) {
      setTasks(prev => prev.filter(task => task.id !== optimisticTask.id));
      toast.error('Failed to add sustainable task');
    }
  };

  // Handle adding a single mood-generated task
  const handleMoodTaskAdded = async (taskTitle: string) => {
    // Check daily limit before adding
    if (dailyTasksCount >= 10) {
      setShowDailyLimitPopup(true);
      return;
    }

    const optimisticTask: Task = {
      id: Date.now() + Math.random(), // Ensure unique IDs
      title: taskTitle,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to UI
    setTasks(prev => [optimisticTask, ...prev]);
    
    try {
      const token = await getToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: taskTitle })
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic task with real data
        setTasks(prev => prev.map(task => 
          task.id === optimisticTask.id ? data : task
        ));
      } else {
        // Remove optimistic task on failure
        setTasks(prev => prev.filter(task => task.id !== optimisticTask.id));
        toast.error('Failed to add task');
      }
    } catch (error) {
      // Remove optimistic task on failure
      setTasks(prev => prev.filter(task => task.id !== optimisticTask.id));
      toast.error('Failed to add task');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Remove from UI immediately
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const token = await getToken();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Restore task if failed
        setTasks(prev => [task, ...prev]);
        toast.error('Failed to delete task');
      } else {
        toast.success('Task deleted');
        // Track successful task deletion
        try {
          trackTaskDeleted(task.title, taskId);
        } catch (error) {
          console.warn('Task deletion tracking failed:', error);
        }
      }
    } catch (error) {
      // Restore task if failed
      setTasks(prev => [task, ...prev]);
      toast.error('Failed to delete task');
    }
  };

  // Show loading while hydrating, user loading, or data loading - prevent white flash
  if (!isHydrated || isLoading || !user) {
    return (
      <div className="min-h-screen dark-gradient-bg noise-texture flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full mb-4 mx-auto animate-spin" />
          <p className="text-white/60 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-gradient-bg noise-texture text-white relative">
      {/* Subtle tech grid background */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />
      {/* Clean Header with dark theme */}
      <header className="glass-dark-modern border-b border-precise px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <h1 className="text-2xl font-black text-white tracking-tight">teyra</h1>
          </div>
          <div className="flex items-center space-x-4">
            {currentMood && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 rounded-lg">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${currentMood.color} flex items-center justify-center text-white text-xs`}>
                  {currentMood.emoji}
                </div>
                <span className="text-xs font-medium text-white/80">{currentMood.label}</span>
              </div>
            )}
            <button 
              onClick={() => setShowAllTasks(true)}
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="View all tasks"
            >
              <List className="w-4 h-4" />
              <span>All Tasks ({tasks.filter(t => t?.completed).length})</span>
            </button>
            <div className="text-xs text-white/60 font-mono hidden sm:block">
              {new Date().toLocaleTimeString([], { hour12: false })}
            </div>
            <button
              onClick={() => setShowNotificationSettings(true)}
              className="flex items-center justify-center w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
              title="Notification Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full",
                  userButtonPopover: "glass-dark-modern border-precise shadow-xl rounded-xl",
                  userButtonTrigger: "rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                }
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Task Management */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            {/* Mood-based Task Generator */}
            <MoodTaskGenerator 
              currentTasks={tasks}
              onTaskAdded={handleMoodTaskAdded}
              onMoodSelected={(mood) => {
                setCurrentMood(mood);
                try {
                  trackMoodSelected(mood.label, mood);
                  gtag.trackMoodSelected(mood.label);
                } catch (error) {
                  console.warn('Mood tracking failed:', error);
                }
              }}
            />

            {/* Sustainable Task Generator */}
            <div className="glass-dark-modern border-precise rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                    <span className="text-white text-sm">🌱</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">Sustainable Action</span>
                    <p className="text-xs text-white/60">Complete eco-friendly tasks for 20 points</p>
                  </div>
                </div>
                <button
                  onClick={handleAddSustainableTask}
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs font-medium"
                >
                  Add Task
                </button>
              </div>
            </div>
            
            {/* Task Input */}
            <div className="glass-dark-modern border-precise rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs to be done?"
                  className="flex-1 px-4 py-3 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/40 bg-white/5 text-white placeholder:text-white/40 text-lg transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTask.trim()}
                  className="px-6 py-3 bg-white hover:bg-white/90 text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {dailyTasksCount >= 8 && (
                <div className="mt-3 text-center">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    dailyTasksCount >= 10 
                      ? 'bg-red-500/20 text-red-400 border border-red-400/30'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-400/30'
                  }`}>
                    {dailyTasksCount >= 10 ? 'Daily limit reached (10/10)' : `${dailyTasksCount}/10 tasks today`}
                  </span>
                </div>
              )}
            </div>

            {/* Task List - Directly under input */}
            <div className="glass-dark-modern border-precise rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-white">Today's Tasks</h2>
                  <div className="text-xs text-white/60 font-mono bg-white/10 px-3 py-1 rounded-full">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm text-white/60 font-mono bg-white/5 px-3 py-1 rounded-full">
                  {completedTasksCount}/{totalTasksCount}
                </div>
              </div>
              
              <div className="min-h-[200px]">
                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <motion.div 
                      className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Plus className="w-8 h-8 text-white/40" />
                    </motion.div>
                    <p className="text-white/60 text-lg font-medium">No tasks yet</p>
                    <p className="text-white/40 text-sm mt-1">Add your first task above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                        isSustainable={sustainableTasks.includes(task.title)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Progress & Motivation */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="glass-dark-modern border-precise rounded-2xl p-4 lg:p-6 lg:sticky lg:top-24">
              <div className="text-center mb-4 lg:mb-6">
                <h2 className="text-lg font-bold text-white mb-3 lg:mb-4">Progress</h2>
                
                {/* Mobile: Horizontal layout for smaller screens */}
                <div className="flex lg:block">
                  {/* Mike the Cactus */}
                  <div className="flex justify-center mb-4 lg:mb-6 flex-shrink-0">
                    <div className="bg-white/10 rounded-full p-4 lg:p-6">
                      <Cactus mood={milestoneData.cactusState} />
                    </div>
                  </div>
                  
                  {/* Progress Circle and Stats */}
                  <div className="flex-1 lg:block ml-4 lg:ml-0">
                    {/* Progress Circle */}
                    <div className="flex justify-center mb-4 lg:mb-6">
                      <AnimatedCircularProgressBar
                        max={milestoneData.maxPoints}
                        value={milestoneData.currentPoints}
                        gaugePrimaryColor="#22c55e"
                        gaugeSecondaryColor="rgba(255,255,255,0.2)"
                        className="size-20 lg:size-24"
                      />
                    </div>
                    
                    {/* Stats */}
                    <div className="bg-white/5 rounded-2xl p-3 lg:p-4 border border-white/20">
                      <div className="text-xl lg:text-2xl font-bold text-white font-mono">
                        {milestoneData.currentPoints.toString().padStart(2, '0')}
                      </div>
                      <div className="text-white/60 text-xs font-mono uppercase tracking-wide">
                        progress / {milestoneData.maxPoints}
                      </div>
                      <div className="text-xs text-green-400 font-medium mt-1">
                        Total earned: {milestoneData.totalPointsEarned}
                      </div>
                      {completedSustainableTasksCount > 0 && (
                        <div className="text-xs text-green-400 font-medium">
                          +{completedSustainableTasksCount * 10} bonus from eco tasks (20pts each)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>

      {/* Daily Reset Checker */}
      <DailyResetChecker 
        onResetCompleted={() => {
          fetchUserData();
        }}
      />

      {/* All Tasks Modal */}
      <AnimatePresence>
        {showAllTasks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllTasks(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-dark-modern border-precise rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <List className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">All Tasks Summary</h2>
                  <span className="text-sm text-white/60 bg-white/10 px-3 py-1 rounded-full">
                    {tasks.filter(t => t?.completed).length} completed all-time
                  </span>
                </div>
                <button
                  onClick={() => setShowAllTasks(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45 text-white/60" />
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[60vh] space-y-4">
                {/* Progress Overview */}
                <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 border border-blue-400/30 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">🎯 Your Progress</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {tasks.filter(t => t?.completed).length}
                      </div>
                      <div className="text-sm text-white/60">Total Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {rawTotalPoints}
                      </div>
                      <div className="text-sm text-white/60">Progress Points</div>
                    </div>
                  </div>
                </div>

                {/* Cactus Progress */}
                <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">🌵 Cactus Growth</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Current Mood:</span>
                      <span className="font-medium text-white capitalize">{milestoneData.cactusState}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Milestone:</span>
                      <span className="font-medium text-white">{milestoneData.milestone + 1} / 3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Progress:</span>
                      <span className="font-medium text-white">{milestoneData.currentPoints} / {milestoneData.maxPoints}</span>
                    </div>
                  </div>
                </div>

                {/* Current Session */}
                <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">📋 Current Session</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Active Tasks:</span>
                      <span className="font-medium text-white">{tasks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Completed Today:</span>
                      <span className="font-medium text-green-400">{tasks.filter(t => t?.completed).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Remaining:</span>
                      <span className="font-medium text-orange-400">{tasks.filter(t => !t?.completed).length}</span>
                    </div>
                  </div>
                </div>

                {/* Daily Tasks (if any) */}
                {tasks.length > 0 && (
                  <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-3">📝 Today's Tasks</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-2 text-sm">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            task.completed ? 'bg-green-500 border-green-500' : 'border-white/30'
                          }`}>
                            {task.completed && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className={task.completed ? 'line-through text-white/40' : 'text-white'}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Completion Confirmation Popup */}
      <AnimatePresence>
        {showConfirmationPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
            onClick={() => handleConfirmCompletion(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-dark-modern border-precise rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    Task Completion
                  </h3>
                  <div className="relative">
                    <HelpCircle
                      className="w-4 h-4 text-white/60 hover:text-white cursor-help transition-colors"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    />
                    {showTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded shadow-lg border border-white/20 whitespace-nowrap z-60">
                        Be honest with yourself about your effort
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-black/90 rotate-45 border-r border-b border-white/20"></div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-white/70">
                  Are you 100% sure you did this to the best of your ability?
                </p>
              </div>

              <div className="flex space-x-3 mb-4">
                <button
                  onClick={() => handleConfirmCompletion(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  No
                </button>
                <button
                  onClick={() => handleConfirmCompletion(true)}
                  className="flex-1 px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-colors"
                >
                  Yes
                </button>
              </div>

              <button
                onClick={handleDismissConfirmations}
                className="w-full text-xs text-white/60 hover:text-white transition-colors"
              >
                Don't ask me again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestone Achievement Popup */}
      <AnimatePresence>
        {showMilestonePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMilestonePopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-dark-modern border-precise rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🎉</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Milestone Achieved!
                </h3>
                <p className="text-white/70 mb-6">
                  {milestoneMessage}
                </p>
                <button
                  onClick={() => setShowMilestonePopup(false)}
                  className="w-full px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-colors font-medium"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Limit Popup */}
      <AnimatePresence>
        {showDailyLimitPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDailyLimitPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-dark-modern border-precise rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500/20 border border-orange-400/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Daily Task Limit Reached
                </h3>
                <p className="text-white/70 mb-4">
                  You have passed the limit for tasks you can add today (10/10).
                </p>
                
                <div className="text-left bg-white/5 border border-white/20 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-white mb-2">Here's why adding more than 10 tasks can be counterproductive:</h4>
                  <ul className="text-sm text-white/70 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span><strong>Lower motivation:</strong> Too many tasks can feel overwhelming and reduce your drive to complete them</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span><strong>Reduced focus:</strong> Spreading attention across many tasks decreases the quality of your work</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span><strong>Decision fatigue:</strong> Having too many options makes it harder to decide what to work on next</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowDailyLimitPopup(false)}
                  className="w-full px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-colors font-medium"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Tour */}
      <AnimatePresence>
        {showOnboardingTour && (
          <OnboardingTour onComplete={() => {
            setShowOnboardingTour(false);
            if (user?.id) {
              localStorage.setItem(`dashboard_tour_${user.id}`, 'true');
            }
          }} />
        )}
      </AnimatePresence>

      {/* Smart Notification Setup */}
      <AnimatePresence>
        {showSmartNotificationSetup && (
          <SmartNotificationSetup 
            onComplete={() => {
              setShowSmartNotificationSetup(false);
              if (user?.id) {
                localStorage.setItem(`smart_setup_${user.id}`, 'true');
              }
            }}
            onEnableNotifications={() => {
              // Request notification permission
              if ('Notification' in window) {
                Notification.requestPermission();
              }
              if (user?.id) {
                localStorage.setItem(`push_notifications_${user.id}`, 'true');
              }
              toast.success('Smart notifications enabled! 🔔');
            }}
            onEnableEmails={() => {
              // Enable emails via API call
              fetch('/api/user/email-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enableDailyEmails: true })
              }).catch(console.error);
              if (user?.id) {
                localStorage.setItem(`email_notifications_${user.id}`, 'true');
              }
              toast.success('Daily emails enabled! 📧');
            }}
          />
        )}
      </AnimatePresence>

      {/* Notification Settings */}
      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />

      {/* Test Reset Button - Development Only */}
      {process.env.NODE_ENV === 'development' && <TestResetButton />}
    </div>
  );
}

// Test Reset Button Component
function TestResetButton() {
  const { getToken } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

  const handleTestReset = async () => {
    if (!confirm('🧪 This will delete ALL tasks from today and add completed ones to your cactus progress. Continue?')) return;

    setIsResetting(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/test-reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      if (response.ok) {
        // Create detailed task summary
        const completedList = result.taskSummary.completed.length > 0 
          ? '\n✅ Completed:\n' + result.taskSummary.completed.map(t => `• ${t}`).join('\n')
          : '';
        
        const incompleteList = result.taskSummary.incomplete.length > 0
          ? '\n⏸️ Incomplete:\n' + result.taskSummary.incomplete.map(t => `• ${t}`).join('\n')
          : '';
        
        alert(`🔄 Daily Reset Complete!\n\n📊 Tasks Deleted:\n- Total: ${result.taskSummary.total}\n- Completed: ${result.taskSummary.completed_count}\n- Incomplete: ${result.taskSummary.incomplete_count}${completedList}${incompleteList}\n\n🌵 Cactus progress updated!\n📧 Email sent!\n\n🔄 Refreshing page...`);
        
        setTimeout(() => window.location.reload(), 3000);
      } else {
        alert(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test reset error:', error);
      alert('❌ Error - check console');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <button 
      onClick={handleTestReset}
      disabled={isResetting}
      className="fixed bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg shadow-lg transition-colors text-sm font-medium"
    >
      {isResetting ? '🔄 Testing Reset...' : '🧪 Test 24hr Reset'}
    </button>
  );
}