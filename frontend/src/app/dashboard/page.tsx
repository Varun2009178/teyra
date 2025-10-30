'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Check, Trash2, Target, List, Calendar, Settings, HelpCircle, User, Edit, Sparkles, Clock, FileText } from 'lucide-react';
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
import DailyNotificationPrompt from '@/components/DailyNotificationPrompt';
import ProBadgeDropdown from '@/components/ProBadgeDropdown';
import ProWelcomeModal from '@/components/ProWelcomeModal';
import { AITaskParser } from '@/components/AITaskParser';
import * as gtag from '@/lib/gtag';
import Navbar from '@/components/Navbar';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Sophisticated liquid glass task card with smooth animations
const TaskCard = React.memo(({
  task,
  onToggle,
  onDelete,
  onEdit,
  onAISchedule,
  onManualSchedule,
  isSustainable = false,
  isDeleting = false,
  isPro = false,
  aiScheduleUsageCount = 0
}: {
  task: Task & { isNew?: boolean };
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit?: (id: number) => void;
  onAISchedule?: (id: number) => void;
  onManualSchedule?: (id: number) => void;
  isSustainable?: boolean;
  isDeleting?: boolean;
  isPro?: boolean;
  aiScheduleUsageCount?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleToggle = async () => {
    if (task.completed) return; // Don't allow uncompleting for now

    setIsCompleting(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Smooth completion animation
    onToggle(task.id);
    setIsCompleting(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  return (
    <>
      <motion.div
        className={`liquid-glass-task liquid-glass-task-hover rounded-xl p-4 mb-3 ${
          task.isNew ? 'new-task' : ''
        } ${isCompleting ? 'opacity-50' : ''}`}
        whileHover={{ scale: 1.02 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onContextMenu={handleContextMenu}
      >
      <div className="flex items-center gap-4">
        {/* Enhanced checkbox with liquid glass effect */}
        <motion.button
          onClick={handleToggle}
          disabled={task.completed || isCompleting}
          className={`relative w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            task.completed
              ? 'bg-white border-white shadow-lg'
              : 'border-white/40 hover:border-white/70 liquid-glass-subtle'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {task.completed && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                delay: 0.1
              }}
            >
              <Check className="w-4 h-4 text-black" strokeWidth={3} />
            </motion.div>
          )}
          
          {/* Subtle glow effect when hovering */}
          {isHovered && !task.completed && (
            <motion.div
              className="absolute inset-0 rounded-lg bg-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </motion.button>

        {/* Task title with smooth text transitions */}
        <motion.span
          className={`flex-1 text-base font-medium transition-all duration-300 ${
            task.completed
              ? 'text-white/40 line-through'
              : 'text-white/90'
          }`}
          animate={{
            opacity: task.completed ? 0.6 : 1,
            x: task.completed ? 5 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          {task.title}
        </motion.span>

        {/* XP indicator with smooth animation */}
        {isSustainable && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1"
          >
            <motion.span 
              className="text-xs text-green-400 font-mono font-semibold"
              animate={{ 
                color: isHovered ? '#4ade80' : '#22c55e'
              }}
            >
              +20
            </motion.span>
            <motion.div
              className="w-1 h-1 bg-green-400 rounded-full"
              animate={{ 
                scale: isHovered ? 1.2 : 1,
                opacity: isHovered ? 0.8 : 0.6
              }}
            />
          </motion.div>
        )}

        {/* Delete button with smooth reveal */}
        <motion.button
          onClick={() => onDelete(task.id)}
          className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-red-400 transition-all duration-300 liquid-glass-subtle rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: isHovered ? 1 : 0.3,
            scale: isHovered ? 1 : 0.9
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Subtle progress indicator for new tasks */}
      {task.isNew && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-b-xl"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      )}
    </motion.div>

    {/* Context Menu */}
    <AnimatePresence>
      {showContextMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className="fixed z-50 bg-zinc-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
            minWidth: '200px'
          }}
        >
          <div className="py-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task.id);
                  setShowContextMenu(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-white/90 text-sm"
              >
                <Edit className="w-4 h-4" />
                <span>edit</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
                setShowContextMenu(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors text-red-400 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>delete</span>
            </button>

            <div className="border-t border-white/10 my-1" />

            {onAISchedule && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAISchedule(task.id);
                  setShowContextMenu(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>ai schedule</span>
                {!isPro && aiScheduleUsageCount >= 3 && (
                  <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold rounded uppercase tracking-wide">
                    pro
                  </span>
                )}
              </button>
            )}

            {onManualSchedule && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onManualSchedule(task.id);
                  setShowContextMenu(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm"
              >
                <Clock className="w-4 h-4" />
                <span>schedule</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
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
  // Remove userProgress - not used since milestone calculation moved to client-side
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
  const [deletingTaskIds, setDeletingTaskIds] = useState<Set<number>>(new Set());
  const [isAddLocked, setIsAddLocked] = useState(false);
  const [hasCompletedFirstTask, setHasCompletedFirstTask] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showProWelcome, setShowProWelcome] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editModalTask, setEditModalTask] = useState<Task | null>(null);
  const [editModalTitle, setEditModalTitle] = useState('');
  const [showAIParser, setShowAIParser] = useState(false);
  const [deleteModalTask, setDeleteModalTask] = useState<Task | null>(null);
  const [scheduleModalTask, setScheduleModalTask] = useState<Task | null>(null);
  const [aiScheduleUsageCount, setAiScheduleUsageCount] = useState(0);
  const [showMobileNotice, setShowMobileNotice] = useState(false);

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

  // Memoized values for performance - count current session tasks (including completed ones from today)
  const completedTasksCount = useMemo(() => tasks.filter(t => t?.completed && !t.title.includes('[COMPLETED]')).length, [tasks]);
  const totalTasksCount = useMemo(() => tasks.filter(t => !t.title.includes('[COMPLETED]')).length, [tasks]);
  const completedSustainableTasksCount = useMemo(() => 
    tasks.filter(t => t?.completed && sustainableTasks.includes(t.title) && !t.title.includes('[COMPLETED]')).length, 
    [tasks]
  );
  
  // Optimized progress calculation - only recalculate when tasks actually change
  const rawTotalPoints = useMemo(() => {
    if (tasks.length === 0) return 0;
    
    // Calculate stored points from completed tasks (from previous resets)
    const completedTasks = tasks.filter(task => task.title.includes('[COMPLETED]'));
    let storedPoints = 0;
    
    if (completedTasks.length > 0) {
      const completedRegularTasks = completedTasks.filter(task => {
        const cleanTitle = task.title.replace(/^\[COMPLETED\]\s*/, '');
        return !sustainableTasks.some(sustainableTask => 
          cleanTitle === sustainableTask || sustainableTask.includes(cleanTitle.replace(/^🌱|♻️|🚶|💡|🌿\s*/g, ''))
        );
      });
      const completedSustainableTasks = completedTasks.filter(task => {
        const cleanTitle = task.title.replace(/^\[COMPLETED\]\s*/, '');
        return sustainableTasks.some(sustainableTask => 
          cleanTitle === sustainableTask || sustainableTask.includes(cleanTitle.replace(/^🌱|♻️|🚶|💡|🌿\s*/g, ''))
        );
      });
      storedPoints = (completedRegularTasks.length * 10) + (completedSustainableTasks.length * 20);
      
      console.log('📊 Completed tasks analysis:', {
        totalCompleted: completedTasks.length,
        completedRegular: completedRegularTasks.length,
        completedSustainable: completedSustainableTasks.length,
        storedPoints
      });
    }
    
    // Calculate current session points (regular = 10, sustainable = 20)
    // Exclude completed tasks from previous resets
    const currentCompletedTasks = tasks.filter(t => t?.completed && !t.title.includes('[COMPLETED]'));
    const regularCompleted = currentCompletedTasks.filter(t => !sustainableTasks.includes(t.title)).length;
    const sustainableCompleted = currentCompletedTasks.filter(t => sustainableTasks.includes(t.title)).length;
    const currentPoints = (regularCompleted * 10) + (sustainableCompleted * 20);
    
    // Total = stored + current (this updates in real-time as tasks are toggled)
    const totalPoints = storedPoints + currentPoints;
    
    console.log('🔍 Real-time points calculation:', {
      completedTasksCount: completedTasks.length,
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

  // Load AI schedule usage count from localStorage
  useEffect(() => {
    const storedCount = localStorage.getItem('ai_schedule_usage_count');
    if (storedCount) {
      setAiScheduleUsageCount(parseInt(storedCount, 10));
    }
  }, []);

  // Show mobile notice for iPhone users (once per session)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasSeenNotice = sessionStorage.getItem('mobile_notice_seen');
    const isIPhone = /iPhone/.test(navigator.userAgent);

    if (isIPhone && !hasSeenNotice) {
      setTimeout(() => {
        setShowMobileNotice(true);
        sessionStorage.setItem('mobile_notice_seen', 'true');
      }, 2000); // Show after 2 seconds
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

      // Fetch subscription status
      try {
        const subRes = await fetch('/api/subscription/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (subRes.ok) {
          const subData = await subRes.json();
          const isProStatus = subData.isPro || false;
          setIsPro(isProStatus);
          setCancelAtPeriodEnd(subData.cancelAtPeriodEnd || false);
          setSubscriptionEndDate(subData.periodEnd);

          // Send Pro status to Chrome extension
          window.postMessage({
            type: 'TEYRA_USER_SIGNIN',
            source: 'teyra-webapp',
            user: {
              id: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              isPro: isProStatus
            },
            tasks: tasksList
          }, '*');
          console.log('📤 Sent user data to extension:', { isPro: isProStatus });
        }
      } catch (error) {
        console.warn('Could not fetch subscription status:', error);
      }

      // Immediately show UI with tasks, load progress in background
      setIsLoading(false);

      // Note: User progress is now calculated client-side from tasks
      // No need to fetch/create separate progress data

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
    if (!user?.id || !isHydrated) 
      return;

    fetchUserData();
    // Track session start
    try {
      trackSessionStart();
    } catch (error) {
      console.warn('Session tracking failed:', error);
    }

    // Check if user just upgraded to Pro (coming back from Stripe)
    const checkProUpgrade = async () => {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const justUpgraded = urlParams.get('pro_welcome');
      const sessionId = urlParams.get('session_id');
      const upgradeStatus = urlParams.get('upgrade');

      if (justUpgraded === 'true' && sessionId) {
        console.log('🎉 User returned from Stripe checkout!');

        try {
          const token = await getToken();

          // Step 1: Verify the Stripe session and ensure user is marked as Pro
          console.log('🔍 Verifying Stripe session...');
          const verifyRes = await fetch('/api/stripe/verify-session', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId })
          });

          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            console.log('✅ Session verified:', verifyData);

            if (verifyData.isPro) {
              // Step 2: Refresh subscription status
              const subRes = await fetch('/api/subscription/status', {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (subRes.ok) {
                const subData = await subRes.json();
                setIsPro(true);

                // Show welcome modal with confetti
                setTimeout(() => {
                  setShowProWelcome(true);
                  toast.success('🎉 Welcome to Teyra Pro!');
                }, 800);
              }
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          }
        } catch (error) {
          console.error('❌ Error verifying upgrade:', error);
          toast.error('Could not verify payment. Please contact support if charged.');
        }

        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
      } else if (upgradeStatus === 'cancelled') {
        toast.info('Upgrade cancelled. You can upgrade anytime!');
        window.history.replaceState({}, '', '/dashboard');
      }
    };

    checkProUpgrade();

    // Handle checkout action from extension
    const handleCheckoutAction = async () => {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');

      if (action === 'checkout') {
        console.log('🚀 Checkout action detected from extension, initiating upgrade...');
        // Clean up URL first
        window.history.replaceState({}, '', '/dashboard');

        // Small delay to ensure page is loaded
        setTimeout(async () => {
          await handleUpgrade();
        }, 500);
      }
    };

    handleCheckoutAction();

    // Scroll to upgrade section if hash is present
    if (typeof window !== 'undefined' && window.location.hash === '#upgrade') {
      setTimeout(() => {
        const upgradeSection = document.getElementById('upgrade');
        if (upgradeSection) {
          upgradeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }

    // For existing users, ensure they get appropriate onboarding experiences
    const initializeUserExperience = () => {
      const userId = user.id;
      
      // Check if this is a first visit for onboarding tour
      const hasSeenTour = localStorage.getItem(`dashboard_tour_${userId}`) === 'true';
      
      // For existing users who have never seen the tour, show it
      if (!hasSeenTour) {
        console.log('👋 New user detected - showing onboarding tour');
        setTimeout(() => {
          setShowOnboardingTour(true);
        }, 1000);
      }
      
      // Set up first task completion trigger for smart notifications
      // This doesn't show immediately but prepares for when they complete their first task
      const hasSeenSmartSetup = localStorage.getItem(`smart_setup_${userId}`) === 'true';
      if (!hasSeenSmartSetup) {
        console.log('📱 User hasn\'t seen smart notification setup - will show after first task');
      }
    };

    initializeUserExperience();
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

  // Add task - Sophisticated optimistic updates with smooth animations
  const [isInputSubmitting, setIsInputSubmitting] = useState(false);
  const [recentlyAddedTask, setRecentlyAddedTask] = useState<number | null>(null);

  const handleAddTask = async () => {
    if (!newTask.trim() || !user || isInputSubmitting || isAddLocked) return;

    // Check daily limit before adding
    if (dailyTasksCount >= 10) {
      setShowDailyLimitPopup(true);
      return;
    }

    const taskTitle = newTask.trim();
    setIsInputSubmitting(true);
    setIsAddLocked(true);

    // Create optimistic task with new flag for special animation
    const optimisticTask: Task & { isNew?: boolean } = {
      id: Date.now(), // Temporary ID
      title: taskTitle,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isNew: true // Flag for special new task animation
    };

    // Add to UI instantly with smooth animation
    setTasks(prev => [optimisticTask, ...prev]);
    setRecentlyAddedTask(optimisticTask.id);
    
    // Clear input with smooth animation
    setNewTask('');

    // Send notification for first task
    if (tasks.length === 0 && permission.granted) {
      sendFirstTaskNotification(taskTitle);
    }

    // Remove the "new" flag after animation completes
    setTimeout(() => {
      setTasks(prev => prev.map(t => 
        t.id === optimisticTask.id ? { ...t, isNew: false } : t
      ));
      setRecentlyAddedTask(null);
    }, 2000);

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
    } finally {
      setIsInputSubmitting(false);
      // brief lock to prevent spam add
      setTimeout(() => setIsAddLocked(false), 350);
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
    const optimisticTask: Task & { isNew?: boolean } = {
      id: Date.now() + Math.random(),
      title: randomTask,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isNew: true
    };
    
    setTasks(prev => [optimisticTask, ...prev]);

    // Remove isNew flag after glow completes
    setTimeout(() => {
      setTasks(prev => prev.map(t => t.id === optimisticTask.id ? { ...t, isNew: false } : t));
    }, 2000);
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

  // Handle Pro upgrade
  const handleUpgrade = async (e?: React.MouseEvent) => {
    // Prevent event bubbling and multiple triggers
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevent multiple simultaneous upgrade attempts
    if (isUpgrading) {
      console.log('⚠️ Upgrade already in progress, ignoring duplicate click');
      return;
    }

    console.log('🚀 Starting upgrade process...');
    setIsUpgrading(true);

    try {
      const token = await getToken();

      // Get referral code from sessionStorage if present
      const referralCode = typeof window !== 'undefined' ? sessionStorage.getItem('teyra_referral') : null;

      if (referralCode) {
        console.log('🎯 Sending referral code to checkout:', referralCode);
      } else {
        console.log('ℹ️ No referral code found in sessionStorage');
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          referralCode: referralCode || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      console.log('✅ Checkout session created, redirecting to:', url);

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('❌ Error upgrading:', error);
      toast.error('Failed to start upgrade process');
      setIsUpgrading(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: number) => {
    if (deletingTaskIds.has(taskId)) return; // ignore rapid double clicks
    setDeletingTaskIds(prev => new Set(prev).add(taskId));
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Soft-remove with smoother experience: optimistic remove, but keep delete lock
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
    finally {
      // small delay to avoid fast delete spam on adjacent items
      setTimeout(() => {
        setDeletingTaskIds(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }, 250);
    }
  };

  // Handler for editing a task - show modal
  const handleEditTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setEditModalTask(task);
    setEditModalTitle(task.title);
  };

  // Actually save the edited task
  const saveEditedTask = async () => {
    if (!editModalTask) return;

    const newTitle = editModalTitle.trim();
    if (!newTitle || newTitle === editModalTask.title) {
      setEditModalTask(null);
      return;
    }

    // Optimistically update
    setTasks(prev => prev.map(t => t.id === editModalTask.id ? { ...t, title: newTitle } : t));
    setEditModalTask(null);

    try {
      const token = await getToken();
      const response = await fetch(`/api/tasks/${editModalTask.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        // Restore original title
        setTasks(prev => prev.map(t => t.id === editModalTask.id ? { ...t, title: editModalTask.title } : t));
        toast.error('failed to edit task');
      } else {
        toast.success('task updated');
      }
    } catch (error) {
      // Restore original title
      setTasks(prev => prev.map(t => t.id === editModalTask.id ? { ...t, title: editModalTask.title } : t));
      toast.error('failed to edit task');
    }
  };

  // Handler for AI scheduling a single task
  const handleAIScheduleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if user has exceeded free uses and is not Pro
    if (!isPro && aiScheduleUsageCount >= 3) {
      toast.error('upgrade to pro for unlimited ai scheduling');
      setShowAccountModal(true);
      return;
    }

    // Increment usage count
    const newCount = aiScheduleUsageCount + 1;
    setAiScheduleUsageCount(newCount);
    localStorage.setItem('ai_schedule_usage_count', newCount.toString());

    // Show remaining uses toast
    if (!isPro && newCount < 3) {
      toast.success(`ai scheduling... ${3 - newCount} free uses left`);
    } else if (!isPro && newCount === 3) {
      toast.success('redirecting to calendar... last free use!');
    } else {
      toast.success('redirecting to calendar for ai scheduling...');
    }

    window.location.href = '/dashboard/calendar?autoSchedule=true';
  };

  // Handler for manually scheduling a single task
  const handleManualScheduleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setScheduleModalTask(task);
  };

  // Actually schedule the task
  const saveScheduledTask = async (scheduledTime: string, durationMinutes: number) => {
    if (!scheduleModalTask) return;

    try {
      const token = await getToken();
      const response = await fetch(`/api/tasks/${scheduleModalTask.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduled_time: scheduledTime,
          duration_minutes: durationMinutes
        })
      });

      if (response.ok) {
        toast.success('task scheduled! view in calendar');
        setScheduleModalTask(null);
        // Refresh tasks to update the list
        const tasksResponse = await fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (tasksResponse.ok) {
          const updatedTasks = await tasksResponse.json();
          setTasks(updatedTasks);
        }
      } else {
        toast.error('failed to schedule task');
      }
    } catch (error) {
      toast.error('failed to schedule task');
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
    <div className="min-h-screen dark-gradient-bg noise-texture text-white relative overflow-hidden">
      {/* Vibrant gradient orbs behind glass panels - Apple liquid glass effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-72 h-72 bg-pink-500 rounded-full filter blur-[110px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-green-500 rounded-full filter blur-[90px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
      {/* Subtle tech grid background */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />
      {/* Unified Navbar */}
      <Navbar
        isPro={isPro}
        showSettings={true}
        showAccountButton={true}
        currentMood={currentMood}
        onAccountClick={() => setShowAccountModal(true)}
        onSettingsClick={() => setShowNotificationSettings(true)}
        onHelpClick={() => setShowOnboardingTour(true)}
        customDeleteHandler={async () => {
          const confirmed = window.confirm(
            "Are you sure you want to delete your account? This will permanently delete all your tasks, progress, and account data. This action cannot be undone."
          );

          if (confirmed) {
            console.log('🗑️ User confirmed account deletion');

            try {
              const response = await fetch('/api/user/delete', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json'
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
              } else {
                const error = await response.json().catch(() => ({}));
                console.error('❌ Account deletion failed:', error);

                if (error.code === 'VERIFICATION_REQUIRED') {
                  toast.error('Account deletion requires additional verification. Please contact support if you need assistance.');
                } else {
                  toast.error(error.error || 'Failed to delete account');
                }
              }
            } catch (error) {
              console.error('❌ Error during account deletion:', error);
              toast.error(`Failed to delete account: ${error instanceof Error ? error.message : 'Network error'}`);
            }
          }
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Teyra Pro Banner - Only show if not Pro */}
        {!isPro && (
          <motion.div
            id="upgrade"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 sm:mb-8 relative overflow-hidden group"
          >
            <div className="relative liquid-glass-strong liquid-glass-hover glass-gradient-purple rounded-xl p-4 sm:p-6 liquid-glass-depth">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                    className="px-2 sm:px-3 py-1 bg-white text-black rounded font-bold text-xs"
                  >
                    PRO
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-xl sm:text-2xl font-bold text-white"
                  >
                    teyra pro
                  </motion.h2>
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/70 text-sm sm:text-base mb-4 sm:mb-5"
                >
                  unlock premium features to maximize your productivity
                </motion.p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {[
                    { title: "unlimited AI text → task", desc: "limited time only! (vs 5 per day free)", highlight: true },
                    { title: "ai calendar scheduling", desc: "schedule tasks automatically with ai", highlight: false },
                    { title: "focus mode customization", desc: "block any websites you choose", highlight: false },
                    { title: "pomodoro timer", desc: "built-in focus sessions", highlight: false },
                    { title: "priority support", desc: "faster response times", highlight: false }
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                      whileHover={{ y: -2 }}
                      className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg liquid-glass-subtle liquid-glass-hover transition-all duration-200"
                    >
                      <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-black" strokeWidth={3} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold text-xs sm:text-sm truncate">{feature.title}</p>
                          {feature.highlight && (
                            <motion.span
                              initial={{ opacity: 0.6 }}
                              animate={{ opacity: [0.6, 1, 0.6] }}
                              transition={{ duration: 1.6, repeat: Infinity }}
                              className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 text-[9px] sm:text-[10px] font-bold tracking-wide whitespace-nowrap"
                            >
                              limited time
                            </motion.span>
                          )}
                        </div>
                        <p className="text-white/60 text-xs line-clamp-1">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center gap-3 w-full sm:w-auto lg:min-w-[180px]"
              >
                <motion.button
                  onClick={(e) => handleUpgrade(e)}
                  disabled={isUpgrading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 sm:px-8 py-3 bg-white hover:bg-white/90 text-black font-semibold rounded-lg text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpgrading ? 'loading...' : 'upgrade to pro — $10/month'}
                </motion.button>
              </motion.div>
            </div>
            </div>
          </motion.div>
        )}

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
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="liquid-glass glass-gradient-green rounded-lg p-4 liquid-glass-hover transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <span className="text-base font-semibold text-white">Sustainable Action</span>
                    <p className="text-sm text-white/60">Complete eco-friendly tasks for 20 points</p>
                  </div>
                </div>
                <button
                  onClick={handleAddSustainableTask}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                >
                  Add Task
                </button>
              </div>
            </motion.div>

            {/* Enhanced Task Input with sophisticated animations */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <motion.div 
                  className="flex items-center gap-3"
                  animate={{
                    scale: isInputSubmitting ? 0.98 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative flex-1">
                    <motion.input
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="What needs to be accomplished today?"
                      className="w-full px-6 py-4 liquid-glass-input rounded-xl text-white placeholder:text-white/50 text-base focus:outline-none transition-all duration-300"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                      disabled={isInputSubmitting}
                      animate={{
                        borderColor: newTask.trim() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.12)',
                      }}
                    />
                    
                    {/* Subtle typing indicator */}
                    {newTask.trim() && (
                      <motion.div
                        className="absolute right-4 top-1/2 transform -translate-y-1/2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <motion.div
                          className="w-2 h-2 bg-green-400 rounded-full"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.6, 1, 0.6]
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Enhanced add button with sophisticated animations */}
                  <motion.button
                    whileHover={{
                      scale: newTask.trim() ? 1.05 : 1,
                      rotate: newTask.trim() ? 5 : 0
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddTask}
                    disabled={!newTask.trim() || isInputSubmitting}
                    className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${
                      newTask.trim() && !isInputSubmitting
                        ? 'bg-white hover:bg-white/90 text-black shadow-lg hover:shadow-xl'
                        : 'bg-white/20 text-white/40 cursor-not-allowed'
                    }`}
                    animate={{
                      backgroundColor: newTask.trim() && !isInputSubmitting
                        ? 'rgba(255, 255, 255, 1)'
                        : 'rgba(255, 255, 255, 0.2)',
                      color: newTask.trim() && !isInputSubmitting
                        ? 'rgba(0, 0, 0, 1)'
                        : 'rgba(255, 255, 255, 0.4)'
                    }}
                  >
                    {isInputSubmitting ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <motion.div
                        animate={{
                          scale: newTask.trim() ? 1.1 : 1,
                          rotate: newTask.trim() ? 0 : 0
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <Plus className="w-5 h-5" />
                      </motion.div>
                    )}

                    {/* Subtle glow effect when ready to add */}
                    {newTask.trim() && !isInputSubmitting && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-white/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.button>

                  {/* AI Parser Button - REMOVED: Use Notes > Action Mode instead */}
                  {/* <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAIParser(true)}
                    className="relative w-12 h-12 flex items-center justify-center rounded-xl liquid-glass-subtle transition-all duration-300 group"
                    title="Import tasks from text"
                  >
                    <Sparkles className="w-5 h-5 text-white/80 group-hover:text-white" />

                    <motion.div
                      className="absolute inset-0 rounded-xl bg-white/10"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />

                    <motion.div
                      className="absolute inset-0 rounded-xl bg-white/5"
                      animate={{
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.button> */}
                </motion.div>

                {/* Character count indicator */}
                {newTask.trim() && (
                  <motion.div
                    className="absolute -bottom-6 right-0 text-xs text-white/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {newTask.length}/100
                  </motion.div>
                )}
              </div>

              {dailyTasksCount >= 8 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <span className={`text-sm px-3 py-1.5 rounded-lg ${
                    dailyTasksCount >= 10
                      ? 'bg-red-500/20 text-red-400 border border-red-400/30'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-400/30'
                  }`}>
                    {dailyTasksCount >= 10 ? 'Daily limit reached (10/10)' : `${dailyTasksCount}/10 tasks today`}
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Task List - render statically (no initial load animation) */}
            <div
              className="liquid-glass-strong rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">Today's Tasks</h2>
                  <div className="text-sm text-white/50 font-mono">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
                <div className="text-base text-white/60 font-mono font-semibold bg-white/5 px-3 py-1.5 rounded-lg">
                  {completedTasksCount}/{totalTasksCount}
                </div>
              </div>

              <div className="min-h-[240px]">
                {tasks.filter(t => !t.title.includes('[COMPLETED]')).length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Plus className="w-7 h-7 text-white/40" />
                    </div>
                    <p className="text-white/60 text-lg font-semibold">No tasks yet</p>
                    <p className="text-white/40 text-sm mt-2">Add your first task above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {tasks.filter(t => !t.title.includes('[COMPLETED]')).map((task) => (
                        <div key={task.id}>
                          <TaskCard
                            task={task}
                            onToggle={handleToggleTask}
                            onDelete={handleDeleteTask}
                            onEdit={handleEditTask}
                            onAISchedule={handleAIScheduleTask}
                            onManualSchedule={handleManualScheduleTask}
                            isSustainable={sustainableTasks.includes(task.title)}
                            isDeleting={deletingTaskIds.has(task.id as number)}
                            isPro={isPro}
                            aiScheduleUsageCount={aiScheduleUsageCount}
                          />
                        </div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Progress & Motivation */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="liquid-glass-strong glass-gradient-blue rounded-lg p-6 lg:sticky lg:top-24 liquid-glass-depth">
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Progress</h2>

                {/* Mike the Cactus */}
                <motion.div
                  className="flex justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="liquid-glass-subtle rounded-xl p-8">
                    <Cactus mood={milestoneData.cactusState as 'sad' | 'happy' | 'neutral' | 'overwhelmed' | 'tired' | 'stressed' | 'focused' | 'excited' | 'energized'} size="xl" />
                  </div>
                </motion.div>

                {/* Progress Circle */}
                <div className="flex justify-center">
                  <AnimatedCircularProgressBar
                    max={milestoneData.maxPoints}
                    value={milestoneData.currentPoints}
                    gaugePrimaryColor="#22c55e"
                    gaugeSecondaryColor="rgba(255,255,255,0.2)"
                    className="size-28"
                  />
                </div>

                {/* Stats */}
                <div className="liquid-glass-subtle rounded-lg p-4 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-white font-mono">
                      {milestoneData.currentPoints.toString().padStart(2, '0')}
                    </div>
                    <div className="text-sm text-white/60 font-mono">
                      / {milestoneData.maxPoints}
                    </div>
                  </div>
                  <div className="text-sm text-white/60 font-medium">
                    Total earned: {milestoneData.totalPointsEarned}
                  </div>
                  {completedSustainableTasksCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-sm text-green-400 font-semibold"
                    >
                      +{completedSustainableTasksCount * 10} bonus from eco tasks
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>

      {/* Daily Reset Checker - Temporarily disabled to fix 404 spam */}
      {/* <DailyResetChecker 
        onResetCompleted={() => {
          fetchUserData();
        }}
      /> */}

      {/* All Tasks Modal */}
      <AnimatePresence>
        {showAllTasks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 liquid-glass-overlay z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllTasks(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="liquid-glass-strong liquid-glass-depth rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3 flex-1">
                  <List className="w-6 h-6 text-white flex-shrink-0" />
                  <h2 className="text-2xl font-bold text-white">All Tasks Summary</h2>
                  <span className="text-sm text-white/60 bg-white/10 px-3 py-1 rounded-full">
                    {tasks.filter(t => t?.completed || t.title.includes('[COMPLETED]')).length} completed all-time
                  </span>
                </div>
                <button
                  onClick={() => setShowAllTasks(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                >
                  <Plus className="w-5 h-5 rotate-45 text-white/60" />
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[60vh] space-y-4">
                {/* Progress Overview */}
                <div className="liquid-glass glass-gradient-blue rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">🎯 Your Progress</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {tasks.filter(t => t?.completed || t.title.includes('[COMPLETED]')).length}
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
                <div className="liquid-glass glass-gradient-green rounded-xl p-4">
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
                <div className="liquid-glass-subtle rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">📋 Current Session</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Active Tasks:</span>
                      <span className="font-medium text-white">{tasks.filter(t => !t.title.includes('[COMPLETED]')).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Completed Today:</span>
                      <span className="font-medium text-green-400">{tasks.filter(t => t?.completed && !t.title.includes('[COMPLETED]')).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Remaining:</span>
                      <span className="font-medium text-orange-400">{tasks.filter(t => !t?.completed && !t.title.includes('[COMPLETED]')).length}</span>
                    </div>
                  </div>
                </div>

                {/* All-Time Completed Tasks */}
                {tasks.filter(t => t.title.includes('[COMPLETED]')).length > 0 && (
                  <div className="liquid-glass glass-gradient-green rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-3">🏆 All-Time Completed Tasks</h3>
                    <p className="text-xs text-white/60 mb-3">These tasks stay here permanently and contribute to your cactus's mood</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tasks.filter(t => t.title.includes('[COMPLETED]')).map((task) => (
                        <div key={task.id} className="flex items-center space-x-2 text-sm">
                          <div className="w-4 h-4 rounded border bg-green-500 border-green-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="text-green-400">
                            {task.title.replace(/^\[COMPLETED\]\s*/, '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Today's Tasks (if any) */}
                {tasks.filter(t => !t.title.includes('[COMPLETED]')).length > 0 && (
                  <div className="liquid-glass-subtle rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-3">📝 Today's Tasks</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tasks.filter(t => !t.title.includes('[COMPLETED]')).map((task) => (
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
            className="fixed inset-0 liquid-glass-overlay z-50 flex items-center justify-center p-4"
            onClick={() => handleConfirmCompletion(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="liquid-glass-strong liquid-glass-depth rounded-2xl p-6 max-w-md w-full"
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
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded shadow-lg border border-white/20 whitespace-nowrap z-60 pointer-events-none">
                        Be honest with yourself about your effort
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-black/90 rotate-45 border-r border-b border-white/20 -mt-px"></div>
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
            className="fixed inset-0 liquid-glass-overlay z-50 flex items-center justify-center p-4"
            onClick={() => setShowMilestonePopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="liquid-glass-strong liquid-glass-depth rounded-2xl p-6 max-w-md w-full"
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
            className="fixed inset-0 liquid-glass-overlay z-50 flex items-center justify-center p-4"
            onClick={() => setShowDailyLimitPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="liquid-glass-strong liquid-glass-depth rounded-2xl p-6 max-w-md w-full"
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
                console.log('✅ Push notifications enabled for user:', user.id);
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
                console.log('✅ Email notifications enabled for user:', user.id);
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

      {/* Daily Notification Prompt */}
      <DailyNotificationPrompt />

      {/* Account Status Modal */}
      <AnimatePresence>
        {showAccountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 liquid-glass-overlay z-50 flex items-center justify-center p-4"
            onClick={() => setShowAccountModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="liquid-glass-strong liquid-glass-depth rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">account status</h3>
                <p className="text-white/60 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>

              <div className="space-y-3 mb-6">
                {/* Pro Status */}
                <div className="liquid-glass-subtle glass-gradient-purple rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm font-medium">subscription</span>
                    {isPro ? (
                      <span className="px-2 py-1 bg-white text-black rounded text-xs font-bold">PRO</span>
                    ) : (
                      <span className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs font-medium">FREE</span>
                    )}
                  </div>
                  <p className="text-white font-semibold">
                    {isPro ? 'teyra pro' : 'teyra free'}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    {isPro ? 'unlimited AI text → task, pomodoro timer, and more' : '5 AI text → task per day'}
                  </p>
                </div>

                {/* Progress Stats */}
                <div className="liquid-glass-subtle glass-gradient-blue rounded-lg p-4">
                  <span className="text-white/60 text-sm font-medium block mb-2">progress</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-2xl font-bold text-white">{milestoneData.totalPointsEarned}</div>
                      <div className="text-white/50 text-xs">total points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white capitalize">{milestoneData.cactusState}</div>
                      <div className="text-white/50 text-xs">mike's mood</div>
                    </div>
                  </div>
                </div>

                {/* Tasks Summary */}
                <div className="liquid-glass-subtle glass-gradient-green rounded-lg p-4">
                  <span className="text-white/60 text-sm font-medium block mb-2">tasks</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {tasks.filter(t => t?.completed || t.title.includes('[COMPLETED]')).length}
                      </div>
                      <div className="text-white/50 text-xs">completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-400">
                        {tasks.filter(t => !t?.completed && !t.title.includes('[COMPLETED]')).length}
                      </div>
                      <div className="text-white/50 text-xs">remaining</div>
                    </div>
                  </div>
                </div>
              </div>

              {!isPro && (
                <button
                  onClick={() => {
                    setShowAccountModal(false);
                    setTimeout(() => {
                      const upgradeSection = document.getElementById('upgrade');
                      if (upgradeSection) {
                        upgradeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 300);
                  }}
                  className="w-full px-4 py-3 bg-white hover:bg-white/90 text-black rounded-lg transition-colors font-semibold mb-3"
                >
                  upgrade to pro — $10/month
                </button>
              )}

              {isPro && !cancelAtPeriodEnd && (
                <button
                  onClick={() => {
                    setShowAccountModal(false);
                    setShowCancelModal(true);
                  }}
                  className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors font-medium mb-3"
                >
                  cancel subscription
                </button>
              )}

              {isPro && cancelAtPeriodEnd && subscriptionEndDate && (
                <div className="w-full px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-3">
                  <div className="text-yellow-400 font-medium text-sm mb-1">Subscription Ending</div>
                  <div className="text-yellow-400/70 text-xs">
                    Pro access until {new Date(subscriptionEndDate).toLocaleDateString()}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowAccountModal(false)}
                className="w-full text-sm text-white/60 hover:text-white transition-colors"
              >
                close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pro Welcome Modal */}
      <ProWelcomeModal
        isOpen={showProWelcome}
        onClose={() => setShowProWelcome(false)}
      />

      {/* Cancel Subscription Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-white mb-2">cancel pro subscription?</h2>
                <p className="text-white/60 text-sm">
                  you'll keep pro access until{' '}
                  {subscriptionEndDate && (
                    <span className="text-white font-medium">
                      {new Date(subscriptionEndDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-400">✗</span>
                    <span className="text-white/70">no more unlimited ai scheduling</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-400">✗</span>
                    <span className="text-white/70">no more custom blocked websites</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-green-400">✓</span>
                    <span className="text-white/70">keeps working until period ends</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                >
                  nevermind
                </button>
                <button
                  onClick={async () => {
                    try {
                      const token = await getToken();
                      const response = await fetch('/api/stripe/cancel-subscription', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      });

                      if (response.ok) {
                        const data = await response.json();
                        setCancelAtPeriodEnd(true);
                        toast.success(`subscription cancelled. pro access until ${data.accessUntil}`);
                        setShowCancelModal(false);
                      } else {
                        const error = await response.json();
                        toast.error(error.error || 'failed to cancel subscription');
                      }
                    } catch (error) {
                      console.error('Error canceling subscription:', error);
                      toast.error('failed to cancel subscription');
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-semibold"
                >
                  yes, cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editModalTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditModalTask(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/20 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">edit task</h3>
              <input
                type="text"
                value={editModalTitle}
                onChange={(e) => setEditModalTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEditedTask()}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 mb-4"
                placeholder="Task title..."
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setEditModalTask(null)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  cancel
                </button>
                <button
                  onClick={saveEditedTask}
                  className="flex-1 px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-colors font-semibold"
                >
                  save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Task Modal */}
      <AnimatePresence>
        {scheduleModalTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setScheduleModalTask(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/20 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-1">schedule task</h3>
              <p className="text-white/60 text-sm mb-4">{scheduleModalTask.title}</p>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm text-white/80 mb-2">date & time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    onChange={(e) => {
                      const scheduledTime = new Date(e.target.value).toISOString();
                      saveScheduledTask(scheduledTime, 60);
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => setScheduleModalTask(null)}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Task Parser Modal */}
      <AITaskParser
        isOpen={showAIParser}
        onClose={() => setShowAIParser(false)}
        onTasksCreated={() => {
          // Refresh tasks after AI parser adds them
          fetchTasks();
        }}
      />

      {/* Mobile Notice for iPhone */}
      <AnimatePresence>
        {showMobileNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50"
            onClick={() => setShowMobileNotice(false)}
            style={{ zIndex: 9999 }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full bg-gradient-to-br from-black/95 to-zinc-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-md mx-auto">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-2xl">💻</div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">best on desktop</h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                      teyra works great on mobile, but the desktop experience is 10x better with more features and a bigger screen
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileNotice(false)}
                  className="w-full mt-4 px-4 py-3 bg-white hover:bg-white/90 text-black font-medium rounded-xl transition-colors text-sm"
                  style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                >
                  got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

