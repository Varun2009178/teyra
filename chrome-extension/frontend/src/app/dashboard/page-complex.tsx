"use client";
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Plus, Check, Sparkles, Zap, Brain, Target, Heart, Trash2, Menu, X, Download } from 'lucide-react'
import { Button } from "@/components/ui/button";
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Cactus } from '@/components/Cactus';
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar";
import { BeRealModal } from '@/components/BeRealModal';
import { AISplitsModal } from '@/components/AISplitsModal';
import { MoodTaskSuggestions } from '@/components/MoodTaskSuggestions';
import { MoodPopup } from '@/components/MoodPopup';
import ResetCountdown from '@/components/ResetCountdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { NotificationSetupGuide } from '@/components/NotificationSetupGuide';
import DailyResetChecker from '@/components/DailyResetChecker';
import { OnboardingTour } from '@/components/OnboardingTour';
import { CelebrationPopup } from '@/components/CelebrationPopup';


// Floating particles component for high-tech feel
const FloatingParticles = () => {
  const particles = [
    { delay: 0, x: '15%', y: '25%', size: 'w-2 h-2' },
    { delay: 2, x: '85%', y: '20%', size: 'w-1.5 h-1.5' },
    { delay: 4, x: '20%', y: '75%', size: 'w-2 h-2' },
    { delay: 6, x: '75%', y: '80%', size: 'w-1.5 h-1.5' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className={`absolute bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-sm ${particle.size}`}
          style={{ left: particle.x, top: particle.y }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Gradient background similar to hero page
const GradientBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white/90 to-gray-100/80" />
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/10 to-purple-300/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, 50, -25, 0], 
          y: [0, -30, 20, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-200/10 to-blue-200/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, -40, 30, 0], 
          y: [0, 25, -15, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
        backgroundSize: '30px 30px'
      }} />
    </div>
  );
};

// High-tech task card with glass morphism
const HighTechTaskCard = React.memo(({ 
  task, 
  onToggle, 
  onAISplit,
  onDelete,
  isLocked,
  index,
  aiSplitsUsed 
}: { 
  task: any;
  onToggle: (id: number) => void;
  onAISplit: (task: any) => void;
  onDelete: (id: number) => void;
  isLocked: boolean;
  index: number;
  aiSplitsUsed: number;
}) => {
  return (
    <div className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-100 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/10 to-purple-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={() => onToggle(task.id)}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-75 ${
              task.completed 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-500/25' 
                : 'border-gray-300 hover:border-green-400 hover:shadow-md bg-white/50'
            }`}
          >
            {task.completed && <Check className="w-4 h-4" />}
          </button>
          <span className={`flex-1 font-medium transition-all duration-75 ${
            task.completed 
              ? 'text-gray-500 line-through' 
              : 'text-gray-900 group-hover:text-gray-700'
          }`}>
            {task.title}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {!task.hasBeenSplit && !task.completed && !task.fromMood && task.title.length >= 50 && aiSplitsUsed < 2 && (
            <button
              onClick={() => onAISplit(task)}
              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-lg transition-all duration-75 backdrop-blur-sm"
              title="Smart Split Task"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-all duration-75 backdrop-blur-sm opacity-0 group-hover:opacity-100"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Subtle shine effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)'
        }}
      />
    </div>
  );
});

HighTechTaskCard.displayName = 'HighTechTaskCard';

export default function SimplifiedDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [userProgress, setUserProgress] = useState<any>(null);
  const [showBeReal, setShowBeReal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSplitting, setIsSplitting] = useState(false);
  const [showAISplitsModal, setShowAISplitsModal] = useState(false);
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [selectedMoodForSection, setSelectedMoodForSection] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const moodSectionRef = useRef<HTMLDivElement>(null);
  
  // Onboarding tour state
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  
  // Celebration popup states
  const [showFirstTaskCelebration, setShowFirstTaskCelebration] = useState(false);
  const [showMoodSetCelebration, setShowMoodSetCelebration] = useState(false);

  // Notification system
  const {
    isSupported,
    permission,
    platform,
    requestPermission,
    sendTaskCompletionNotification,
    sendAchievementNotification,
    sendFirstTaskNotification,
    sendMoodSelectionNotification
  } = useNotifications();

  // Notification setup guide state
  const [showNotificationGuide, setShowNotificationGuide] = useState(false);
  
  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Daily limits state
  const [aiSplitsUsed, setAiSplitsUsed] = useState(0);
  const [moodSelectionsToday, setMoodSelectionsToday] = useState(0);


  // Memoized values for performance
  const completedTasksCount = useMemo(() => tasks.filter(t => t?.completed).length, [tasks]);
  const totalTasksCount = useMemo(() => tasks.length, [tasks]);
  const isLocked = useMemo(() => userProgress?.isLocked, [userProgress?.isLocked]);
  
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

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await getToken();
      const [tasksRes, progressRes] = await Promise.all([
        fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [tasksData, progressData] = await Promise.all([
        tasksRes.json(),
        progressRes.json()
      ]);

      setTasks(Array.isArray(tasksData) ? tasksData : tasksData.tasks || []);
      setUserProgress(progressData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Add task from input field - Optimized for instant feedback
  const handleAddTask = async () => {
    if (!newTask.trim() || !user) return;

    const taskTitle = newTask.trim();
    setNewTask(''); // Clear input immediately for instant feedback

    return await addTaskWithTitle(taskTitle);
  };

  // Add task with specific title (for mood suggestions)
  const addTaskWithTitle = async (taskTitle: string, fromMood: boolean = false) => {
    if (!taskTitle.trim() || !user) return;

    const title = taskTitle.trim();

    // Create optimistic task
    const optimisticTask = {
      id: Date.now(), // Temporary ID
      title: title,
      completed: false,
      hasBeenSplit: false,
      fromMood: fromMood,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to UI immediately
    setTasks(prev => [optimisticTask, ...prev]);

    try {
      const token = await getToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: title })
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic task with real one
        setTasks(prev => prev.map(t => t.id === optimisticTask.id ? data : t));
        toast.success('Task added!');
        
        // Send first task notification if this is their first task
        if (isSupported && permission.granted && totalTasksCount === 0) {
          setTimeout(() => {
            sendFirstTaskNotification(taskTitle);
          }, 500);
        }
        
        // Check if this is the user's first task ever
        const hasCompletedFirstTask = localStorage.getItem(`first_task_completed_${user?.id}`);
        if (!hasCompletedFirstTask && totalTasksCount === 0) {
          localStorage.setItem(`first_task_completed_${user?.id}`, 'true');
        }
      } else {
        // Remove optimistic task if failed
        setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
        const error = await response.json();
        toast.error(error.error || 'Failed to add task');
        throw new Error(error.error || 'Failed to add task');
      }
    } catch (error) {
      // Remove optimistic task if failed
      setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
      toast.error('Failed to add task');
      throw error;
    }
  };

  // Toggle task completion - Optimized for instant feedback
  const handleToggleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedState = !task.completed;

    // Update UI immediately
    setTasks(prev => 
      prev.map(t => 
        t.id === taskId ? { ...t, completed: newCompletedState } : t
      )
    );

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
      } else {
        toast.success(newCompletedState ? 'Great job! 🎉' : 'Task unmarked');
        
        // Check if this is the user's first task completion ever
        if (newCompletedState) {
          const hasSeenFirstTaskCelebration = localStorage.getItem(`first_task_celebration_seen_${user?.id}`);
          if (!hasSeenFirstTaskCelebration && completedTasksCount === 0) {
            localStorage.setItem(`first_task_celebration_seen_${user?.id}`, 'true');
            setTimeout(() => setShowFirstTaskCelebration(true), 500);
          }
        }
        
        // Send notification for task completion
        if (newCompletedState && isSupported && permission.granted) {
          // Wait a bit for the service worker to be ready
          setTimeout(async () => {
            try {
              await sendTaskCompletionNotification(task.title);
              
              // Check for achievements
              const newCompletedCount = completedTasksCount + 1;
              if (newCompletedCount === 5) {
                sendAchievementNotification('First 5 tasks completed! You\'re building momentum! 🚀');
              } else if (newCompletedCount === 10) {
                sendAchievementNotification('10 tasks done! You\'re on fire today! 🔥');
              } else if (newCompletedCount === 15) {
                sendAchievementNotification('15 tasks completed! You\'re unstoppable! 💪');
              } else if (newCompletedCount === 20) {
                sendAchievementNotification('20 tasks! You\'re a productivity legend! 👑');
              }
            } catch (error) {
              console.error('Error sending notification:', error);
            }
          }, 100);
        }
      }
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

  // Update mood
  const handleMoodUpdate = async (mood: string) => {
    if (!user || isLocked) return;

    try {
      const token = await getToken();
      const response = await fetch('/api/mood', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mood })
      });

      if (response.ok) {
        toast.success(`Mood updated to ${mood}!`);
        fetchUserData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update mood');
      }
    } catch (error) {
      toast.error('Failed to update mood');
    }
  };

  // AI Split Task - Optimized for instant feedback
  const handleAISplit = async (task: any) => {
    // Check daily limit
    if (aiSplitsUsed >= 2) {
      toast.error('Daily AI split limit reached (2/2). Try again tomorrow!');
      return;
    }

    // Mark as splitting immediately
    setTasks(prev => 
      prev.map(t => 
        t.id === task.id ? { ...t, hasBeenSplit: true } : t
      )
    );

    try {
      const token = await getToken();
      const response = await fetch('/api/ai-task-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskTitle: task.title, originalTaskId: task.id })
      });

      if (response.ok) {
        // Increment daily usage counter
        const newCount = aiSplitsUsed + 1;
        setAiSplitsUsed(newCount);
        if (user?.id) {
          localStorage.setItem(`ai_splits_used_${user.id}`, newCount.toString());
        }
        
        toast.success(`Task broken down by AI! (${newCount}/2 splits used today)`);
        fetchUserData(); // Refresh to get new split tasks
      } else {
        // Revert if failed
        setTasks(prev => 
          prev.map(t => 
            t.id === task.id ? { ...t, hasBeenSplit: false } : t
          )
        );
        const error = await response.json();
        toast.error(error.error || 'Failed to split task');
      }
    } catch (error) {
      // Revert if failed
      setTasks(prev => 
        prev.map(t => 
          t.id === task.id ? { ...t, hasBeenSplit: false } : t
        )
      );
      toast.error('Failed to split task');
    }
  };

  // Handle "Try It Yourself" from Smart Splits modal
  const handleTryAISplits = () => {
    // Just close the modal - the user can now use the existing split functionality on their tasks
    setShowAISplitsModal(false);
    
    // Optional: scroll to the task input or show a hint
    toast.success('Now try the ✨ icon on any of your tasks to split them!');
  };

  // Delete task
  const handleDeleteTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.warn(`Task ${taskId} not found in local state`);
      return;
    }

    console.log(`🗑️ Starting deletion of task ${taskId}: "${task.title}"`);

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
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Delete request failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Restore task if failed
        setTasks(prev => [task, ...prev]);
        toast.error(`Failed to delete task: ${errorData.error || 'Unknown error'}`);
      } else {
        const result = await response.json().catch(() => ({}));
        console.log(`✅ Task ${taskId} deleted successfully:`, result);
        toast.success('Task deleted');
      }
    } catch (error) {
      console.error(`❌ Error during task deletion:`, error);
      // Restore task if failed
      setTasks(prev => [task, ...prev]);
      toast.error(`Failed to delete task: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  // Handle mood selection from navbar popup
  const handleMoodSelect = async (mood: string) => {
    // Check daily limit
    if (moodSelectionsToday >= 1) {
      toast.error('You can only select your mood once per day. Current mood: ' + currentMood);
      setShowMoodPopup(false);
      return;
    }

    setSelectedMoodForSection(mood);
    setCurrentMood(mood);
    setShowMoodPopup(false);
    
    // Increment mood selection counter
    const newCount = moodSelectionsToday + 1;
    setMoodSelectionsToday(newCount);
    
    // Save mood to localStorage and API
    try {
      // Save to localStorage for immediate access
      localStorage.setItem(`current_mood_${user?.id}`, JSON.stringify({
        mood,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString()
      }));
      
      // Save mood selection count
      if (user?.id) {
        localStorage.setItem(`mood_selections_${user.id}`, newCount.toString());
      }
      
      // Save to API (optional - we'll focus on localStorage for now)
      const token = await getToken();
      await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mood, timestamp: new Date().toISOString() })
      }).catch(() => {}); // Ignore API errors for now
      
      toast.success(`Mood set to ${mood}! You can change it again tomorrow. 💫`);
      
      // Check if this is the user's first mood setting
      const hasSeenMoodCelebration = localStorage.getItem(`first_mood_celebration_seen_${user?.id}`);
      if (!hasSeenMoodCelebration) {
        localStorage.setItem(`first_mood_celebration_seen_${user?.id}`, 'true');
        setTimeout(() => setShowMoodSetCelebration(true), 500);
      }
      
      // Send mood selection notification
      if (isSupported && permission.granted) {
        setTimeout(() => {
          sendMoodSelectionNotification(mood);
        }, 500);
      }
    } catch (error) {
      console.error('Error saving mood:', error);
    }
    
    // Scroll to mood section
    if (moodSectionRef.current) {
      moodSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Load saved mood and daily limits on component mount
  useEffect(() => {
    if (user?.id) {
      try {
        const today = new Date().toDateString();
        
        // Check if user has seen the onboarding tour
        const hasSeenTour = localStorage.getItem(`onboarding_tour_completed_${user.id}`);
        if (!hasSeenTour && !isLoading) {
          // Delay showing tour to ensure dashboard is fully loaded
          setTimeout(() => setShowOnboardingTour(true), 1000);
        }
        
        // Load saved mood
        const savedMood = localStorage.getItem(`current_mood_${user.id}`);
        if (savedMood) {
          const moodData = JSON.parse(savedMood);
          const savedDate = new Date(moodData.timestamp).toDateString();
          
          // Only use saved mood if it's from today
          if (savedDate === today) {
            setCurrentMood(moodData.mood);
            setSelectedMoodForSection(moodData.mood); // Sync with mood section
          } else {
            // Clear old mood
            localStorage.removeItem(`current_mood_${user.id}`);
          }
        }
        
        // Load daily limits
        const savedSplits = localStorage.getItem(`ai_splits_used_${user.id}`);
        const savedMoodCount = localStorage.getItem(`mood_selections_${user.id}`);
        const savedDate = localStorage.getItem(`daily_limits_date_${user.id}`);
        
        if (savedDate === today) {
          // Same day, load saved counts
          setAiSplitsUsed(savedSplits ? parseInt(savedSplits) : 0);
          setMoodSelectionsToday(savedMoodCount ? parseInt(savedMoodCount) : 0);
        } else {
          // New day, reset counts
          setAiSplitsUsed(0);
          setMoodSelectionsToday(0);
          localStorage.setItem(`daily_limits_date_${user.id}`, today);
          localStorage.removeItem(`ai_splits_used_${user.id}`);
          localStorage.removeItem(`mood_selections_${user.id}`);
        }
        
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, [user?.id, isLoading]);

  // PWA install functionality
  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Check if already installed
    if (!checkIfInstalled()) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast.error('Install not available on this device/browser');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('App installed successfully!');
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
      toast.error('Installation failed');
    }
  };

  // Tour handler
  const handleTourComplete = () => {
    setShowOnboardingTour(false);
    if (user?.id) {
      localStorage.setItem(`onboarding_tour_completed_${user.id}`, 'true');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white/90 to-gray-100/80 flex items-center justify-center relative overflow-hidden">
        <GradientBackground />
        <div className="relative z-10 text-center">
          <motion.div 
            className="w-12 h-12 border-4 border-t-blue-500 border-r-purple-500 border-b-emerald-500 border-l-gray-200 rounded-full mb-4 mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-gray-600 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            initializing teyra...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white/90 to-gray-100/80 relative overflow-hidden">
      <GradientBackground />
      <FloatingParticles />
      
      {/* High-tech Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-2 sm:px-4 py-2 sm:py-3 shadow-lg"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 min-h-[3rem]">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              teyra
            </h1>
            <div className="hidden lg:flex items-center space-x-4 ml-2 sm:ml-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600 font-medium">system active</span>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation - Better responsive breakpoints */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Notification Settings Button */}
            {isSupported && (
              <motion.button
                onClick={() => setShowNotificationGuide(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-150 flex items-center space-x-2 ${
                  permission.granted 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                }`}
                title={permission.granted ? "Notification Settings" : "Enable Notifications"}
              >
                <span>{permission.granted ? '🔔' : '🔕'}</span>
                <span>{permission.granted ? 'settings' : 'enable'}</span>
              </motion.button>
            )}

            {/* PWA Install Button */}
            {!isInstalled && deferredPrompt && (
              <motion.button
                onClick={handleInstallPWA}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-150 flex items-center space-x-2"
                title="Install App"
              >
                <Download className="w-4 h-4" />
                <span>install</span>
              </motion.button>
            )}
            
            <motion.button
              onClick={() => setShowMoodPopup(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-3 py-2 ${
                currentMood 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-600'
              } text-white rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-150 flex items-center space-x-2`}
              title={currentMood ? `Current mood: ${currentMood}` : "Mood Tasks"}
            >
              {currentMood ? (
                <>
                  <span>
                    {(() => {
                      const moods = [
                        { id: 'energized', emoji: '⚡' },
                        { id: 'focused', emoji: '🎯' },
                        { id: 'creative', emoji: '🎨' },
                        { id: 'calm', emoji: '🧘' },
                        { id: 'motivated', emoji: '🚀' },
                        { id: 'tired', emoji: '😴' },
                        { id: 'overwhelmed', emoji: '😵‍💫' },
                        { id: 'procrastinating', emoji: '🐌' }
                      ];
                      return moods.find(m => m.id === currentMood)?.emoji || '💫';
                    })()}
                  </span>
                  <span className="capitalize">{currentMood}</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  <span>mood tasks</span>
                </>
              )}
            </motion.button>
            
            <motion.button
              onClick={() => setShowAISplitsModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-150 flex items-center space-x-2"
              title="Smart Splits"
            >
              <Sparkles className="w-4 h-4" />
              <span>smart splits</span>
            </motion.button>
            
            <motion.button
              onClick={() => setShowBeReal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-150 flex items-center space-x-2"
              title="Be Real Check-in"
            >
              <Brain className="w-4 h-4" />
              <span>be real</span>
            </motion.button>
            
            {isLocked && userProgress?.dailyStartTime && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-orange-100/80 backdrop-blur-sm border border-orange-200/50 rounded-lg px-3 py-2 shadow-sm"
              >
                <ResetCountdown 
                  dailyStartTime={userProgress.dailyStartTime}
                  className="text-sm font-medium text-orange-700"
                />
              </motion.div>
            )}
            
            {/* User Profile Button */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 shadow-lg hover:shadow-xl transition-all duration-150",
                  userButtonPopover: "bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-xl rounded-xl",
                  userButtonTrigger: "rounded-full shadow-sm hover:shadow-md transition-shadow"
                }
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Action 
                  label="Delete Account"
                  labelIcon={<Trash2 className="w-4 h-4" />}
                  onClick={async () => {
                    const confirmed = window.confirm(
                      "Are you sure you want to delete your account? This will permanently delete all your tasks, progress, and account data. This action cannot be undone."
                    );
                    
                    if (confirmed) {
                      console.log('🗑️ User confirmed account deletion');
                      
                      try {
                        const token = await getToken();
                        console.log('🔑 Got auth token, making delete request...');
                        
                        const response = await fetch('/api/user/delete', {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        
                        console.log('📡 Delete response:', {
                          status: response.status,
                          statusText: response.statusText,
                          ok: response.ok
                        });
                        
                        if (response.ok) {
                          const result = await response.json();
                          console.log('✅ Account deleted successfully:', result);
                          toast.success('Account deleted successfully');
                          // User will be redirected by Clerk after deletion
                        } else {
                          const error = await response.json().catch(() => ({}));
                          console.error('❌ Account deletion failed:', error);
                          toast.error(error.error || 'Failed to delete account');
                        }
                      } catch (error) {
                        console.error('❌ Error during account deletion:', error);
                        toast.error(`Failed to delete account: ${error instanceof Error ? error.message : 'Network error'}`);
                      }
                    }
                  }}
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>

          {/* Mobile/Tablet Navigation */}
          <div className="lg:hidden flex items-center justify-end space-x-2 sm:space-x-3 md:space-x-4">
            {/* Reset Countdown - Always visible on mobile when locked */}
            {isLocked && userProgress?.dailyStartTime && (
              <div className="bg-orange-100/80 backdrop-blur-sm border border-orange-200/50 rounded-lg px-2 py-1">
                <ResetCountdown 
                  dailyStartTime={userProgress.dailyStartTime}
                  className="text-xs font-medium text-orange-700"
                />
              </div>
            )}


            {/* PWA Install Button - Hide on very small screens */}
            {!isInstalled && deferredPrompt && (
              <button
                onClick={handleInstallPWA}
                className="hidden sm:flex items-center justify-center p-2 bg-indigo-500 text-white rounded-md shadow-sm"
                title="Install App"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* User Profile */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7 sm:w-8 sm:h-8 shadow-sm",
                  userButtonPopover: "bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-xl rounded-xl",
                  userButtonTrigger: "rounded-full shadow-sm hover:shadow-md transition-shadow"
                }
              }}
            />

            {/* Mobile Menu Button - Always visible */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="relative p-2 sm:p-2.5 bg-white/90 border border-gray-200 rounded-lg shadow-sm"
              title="Open menu for more features"
            >
              {showMobileMenu ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
              {!showMobileMenu && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-xl space-y-3"
            >


              {/* PWA Install - Show on small screens where it's hidden from header */}
              {!isInstalled && deferredPrompt && (
                <div className="sm:hidden">
                  <button
                    onClick={() => {
                      handleInstallPWA();
                      setShowMobileMenu(false);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg text-sm font-medium shadow-lg transition-all duration-150 flex items-center justify-start space-x-3"
                  >
                    <Download className="w-4 h-4" />
                    <span className="flex-1 text-left">Install App</span>
                  </button>
                </div>
              )}

              {/* Notification Settings */}
              {isSupported && (
                <button
                  onClick={() => {
                    setShowNotificationGuide(true);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all duration-150 flex items-center justify-start space-x-3 ${
                    permission.granted 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  }`}
                >
                  <div className="flex items-center justify-center w-5 h-5">
                    <span className="text-base">{permission.granted ? '🔔' : '🔕'}</span>
                  </div>
                  <span className="flex-1 text-left">{permission.granted ? 'Notification Settings' : 'Enable Notifications'}</span>
                </button>
              )}
              
              {/* Mood Tasks */}
              <button
                onClick={() => {
                  setShowMoodPopup(true);
                  setShowMobileMenu(false);
                }}
                className={`w-full px-4 py-3 ${
                  currentMood 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
                    : 'bg-gradient-to-r from-pink-500 to-purple-600'
                } text-white rounded-lg text-sm font-medium shadow-lg transition-all duration-150 flex items-center justify-start space-x-3`}
              >
                <div className="flex items-center justify-center w-5 h-5">
                  {currentMood ? (
                    <span className="text-base">
                      {(() => {
                        const moods = [
                          { id: 'energized', emoji: '⚡' },
                          { id: 'focused', emoji: '🎯' },
                          { id: 'creative', emoji: '🎨' },
                          { id: 'calm', emoji: '🧘' },
                          { id: 'motivated', emoji: '🚀' },
                          { id: 'tired', emoji: '😴' },
                          { id: 'overwhelmed', emoji: '😵‍💫' },
                          { id: 'procrastinating', emoji: '🐌' }
                        ];
                        return moods.find(m => m.id === currentMood)?.emoji || '💫';
                      })()}
                    </span>
                  ) : (
                    <Heart className="w-4 h-4" />
                  )}
                </div>
                <span className="flex-1 text-left capitalize">
                  {currentMood ? `Current Mood: ${currentMood}` : 'Mood Tasks'}
                </span>
              </button>
              
              {/* Smart Splits */}
              <button
                onClick={() => {
                  setShowAISplitsModal(true);
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-medium shadow-lg transition-all duration-150 flex items-center justify-start space-x-3"
              >
                <div className="flex items-center justify-center w-5 h-5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left">Smart Splits ({aiSplitsUsed}/2)</span>
              </button>
              
              {/* Be Real */}
              <button
                onClick={() => {
                  setShowBeReal(true);
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg text-sm font-medium shadow-lg transition-all duration-150 flex items-center justify-start space-x-3"
              >
                <div className="flex items-center justify-center w-5 h-5">
                  <Brain className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left">Be Real Check-in</span>
              </button>
              
              {/* Reset Countdown (if locked) */}
              {isLocked && userProgress?.dailyStartTime && (
                <div className="bg-orange-100/80 backdrop-blur-sm border border-orange-200/50 rounded-lg p-3">
                  <ResetCountdown 
                    dailyStartTime={userProgress.dailyStartTime}
                    className="text-sm font-medium text-orange-700"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="relative z-10 max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Tasks Section - High-tech design */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 sm:p-8 shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center space-x-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg"
                >
                  <Check className="w-5 h-5 text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  task interface
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-gray-100 to-gray-200 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 shadow-lg"
                >
                  <span className="text-sm font-bold text-gray-800">
                    {completedTasksCount}
                  </span>
                  <span className="text-sm text-gray-600 mx-1">/</span>
                  <span className="text-sm text-gray-600">
                    {totalTasksCount}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">complete</span>
                </motion.div>
                
                {/* Daily Task Limit Indicator */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
                    dailyTasksCount >= 10 
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : dailyTasksCount >= 8 
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  {dailyTasksCount}/10 today
                </motion.div>
              </div>
            </div>

            {/* High-tech Add Task Input */}
            <AnimatePresence>
              {(
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8"
                >
                  {dailyTasksCount >= 10 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="relative group"
                    >
                      <div className="bg-gradient-to-r from-orange-100 to-red-100 backdrop-blur-sm border border-orange-200/50 rounded-xl p-6 shadow-lg overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-red-50/50" />
                        <div className="relative z-10 flex items-center space-x-3">
                          <motion.div 
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="text-2xl"
                          >
                            🚫
                          </motion.div>
                          <div>
                            <p className="text-orange-800 font-semibold text-lg">
                              daily task limit reached
                            </p>
                            <p className="text-orange-600 text-sm">
                              you've created 10 tasks today. come back tomorrow to add more!
                            </p>
                            {/* Simple countdown display */}
                            <div className="mt-2 text-center">
                              <div className="inline-flex items-center space-x-2 px-3 py-2 bg-orange-100 border border-orange-300 rounded-lg">
                                <span className="text-orange-700 text-sm font-mono">
                                  Reset in ~24h
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="relative group">
                      <motion.div 
                        whileHover={{ scale: 1.01 }}
                        className="relative bg-white/60 backdrop-blur-sm border border-gray-300/50 rounded-xl p-1 shadow-lg hover:shadow-xl transition-all duration-150"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="what needs to be accomplished?"
                            className="flex-1 px-4 py-4 bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-500 text-lg font-medium"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                          />
                          <motion.button 
                            onClick={handleAddTask}
                            disabled={!newTask.trim()}
                            whileHover={newTask.trim() ? { scale: 1.05 } : {}}
                            whileTap={newTask.trim() ? { scale: 0.95 } : {}}
                            className={`p-3 mr-2 rounded-lg transition-all duration-150 ${
                              newTask.trim() 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl shadow-blue-500/25'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Plus className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </motion.div>
                      
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-250 -z-10" />
                    </div>
                  )}
                  
                  {/* Daily Reset Countdown - Show when approaching limit */}
                  {dailyTasksCount >= 8 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 text-center"
                    >
                      <div className="inline-flex items-center space-x-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <span className="text-orange-600 text-sm font-medium">
                          {dailyTasksCount === 10 ? 'Daily limit reached' : `${10 - dailyTasksCount} tasks remaining`}
                        </span>
                        {dailyTasksCount === 10 && (
                          <span className="text-orange-500 text-xs">
                            Reset in ~24h
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>


            {/* High-tech Task List */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">no active tasks detected</p>
                  <p className="text-gray-400 text-sm mt-1">initialize your productivity sequence above</p>
                </div>
              ) : (
                tasks.map((task, index) => (
                  <HighTechTaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onAISplit={handleAISplit}
                    onDelete={handleDeleteTask}
                    isLocked={isLocked}
                    index={index}
                    aiSplitsUsed={aiSplitsUsed}
                  />
                ))
              )}
            </div>

            {/* High-tech AI Splitting Status */}
            <AnimatePresence>
              {isSplitting && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="mt-8 relative group"
                >
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 backdrop-blur-sm border border-purple-200/50 rounded-xl p-6 shadow-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-blue-50/50" />
                    <div className="relative z-10 flex items-center space-x-4">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg"
                      >
                        <Sparkles className="w-5 h-5 text-white" />
                      </motion.div>
                      <div>
                        <p className="text-purple-800 font-semibold text-lg">
                          ai task analyzer active
                        </p>
                        <p className="text-purple-600 text-sm">
                          deconstructing task into optimal sub-components...
                        </p>
                      </div>
                      
                      {/* Animated progress dots */}
                      <div className="flex space-x-1 ml-auto">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.2
                            }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Mood-Based Task Suggestions */}
        <div ref={moodSectionRef}>
          <MoodTaskSuggestions 
            onAddTask={(title) => addTaskWithTitle(title, true)}
            isLocked={dailyTasksCount >= 10}
            selectedMood={selectedMoodForSection}
            onMoodChange={(mood) => {
              if (mood && moodSelectionsToday < 1) {
                // Use the same save logic as navbar mood selection
                handleMoodSelect(mood);
              } else {
                // Just update local state for UI
                setSelectedMoodForSection(mood);
              }
            }}
            isDailyMoodLocked={moodSelectionsToday >= 1}
          />
        </div>

        {/* Progress Analytics Section - High-tech design */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 sm:p-8 shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-blue-50/20" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <div className="flex items-center space-x-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg"
                >
                  <Target className="w-5 h-5 text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  progress analytics
                </h2>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
              {(() => {
                // Use server-side progress data for cactus mood (persists across resets)
                const progressMax = userProgress?.maxValue || 10;
                const currentValue = userProgress?.displayCompleted || 0;
                const progressMood = userProgress?.mood || 'sad';
                
                console.log('Cactus progress:', { progressMax, currentValue, progressMood, userProgress });
                
                return (
                  <>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="flex-shrink-0 relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-200/20 to-emerald-300/20 rounded-full blur-xl" />
                      <div className="relative bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-full p-4 sm:p-6 shadow-xl">
                        <Cactus mood={progressMood} />
                      </div>
                    </motion.div>
                    
                    <div className="relative">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/60 backdrop-blur-sm rounded-full p-3 sm:p-4 shadow-xl"
                      >
                        <AnimatedCircularProgressBar
                          max={progressMax === 10 ? 10 : progressMax === 15 ? 5 : 5}
                          value={currentValue}
                          gaugePrimaryColor="#10b981"
                          gaugeSecondaryColor="#e5e7eb"
                          className="size-28 sm:size-36"
                        />
                      </motion.div>
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div className="text-center mt-6 sm:mt-8">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg"
              >
                <span className="text-base sm:text-lg font-bold text-gray-800">
                  {(tasks || []).filter(t => t?.completed).length}
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  tasks completed today
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Mood Popup */}
      <MoodPopup
        isOpen={showMoodPopup}
        onClose={() => setShowMoodPopup(false)}
        onAddTask={(title) => addTaskWithTitle(title, true)}
        onMoodSelect={handleMoodSelect}
      />

      {/* Smart Splits Modal */}
      {showAISplitsModal && (
        <AISplitsModal
          isOpen={showAISplitsModal}
          onClose={() => setShowAISplitsModal(false)}
          onTryItYourself={handleTryAISplits}
        />
      )}

      {/* Be Real Modal */}
      {showBeReal && (
        <BeRealModal
          isOpen={showBeReal}
          onClose={() => setShowBeReal(false)}
          incompleteTasks={tasks.filter(task => !task.completed)}
          completedTasks={completedTasksCount}
          totalTasks={totalTasksCount}
          onAddTask={addTaskWithTitle}
          onReplaceTask={async (oldTaskId: number, newTitle: string) => {
            // Delete old task and add new one
            await handleDeleteTask(oldTaskId);
            await addTaskWithTitle(newTitle);
          }}
        />
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Notification Setup Guide */}
      <NotificationSetupGuide
        isOpen={showNotificationGuide}
        onClose={() => setShowNotificationGuide(false)}
        platform={platform}
        onRequestPermission={requestPermission}
      />

      {/* Daily Reset Checker */}
      <DailyResetChecker 
        onResetCompleted={() => {
          // Refresh data after reset
          fetchUserData();
        }}
      />

      {/* Onboarding Tour */}
      {showOnboardingTour && (
        <OnboardingTour
          onComplete={handleTourComplete}
        />
      )}

      {/* Celebration Popups */}
      <CelebrationPopup
        isOpen={showFirstTaskCelebration}
        onClose={() => setShowFirstTaskCelebration(false)}
        type="first-task"
      />
      
      <CelebrationPopup
        isOpen={showMoodSetCelebration}
        onClose={() => setShowMoodSetCelebration(false)}
        type="mood-set"
      />
    </div>
  );
}