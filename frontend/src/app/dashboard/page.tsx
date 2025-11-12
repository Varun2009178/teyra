'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Check, Trash2, Target, List, Settings, HelpCircle, User, Edit, Sparkles, Clock, FileText, Flag, ChevronDown, ChevronRight, Share2 } from 'lucide-react';
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
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingTour } from '@/components/OnboardingTour';
import { SmartNotificationSetup } from '@/components/SmartNotificationSetup';
import { NotificationSettings } from '@/components/NotificationSettings';
import ProBadgeDropdown from '@/components/ProBadgeDropdown';
import ProWelcomeModal from '@/components/ProWelcomeModal';
import { AITaskParser } from '@/components/AITaskParser';
import CommandMenu from '@/components/CommandMenu';
import { useCommandMenu } from '@/hooks/useCommandMenu';
import * as gtag from '@/lib/gtag';
import Sidebar from '@/components/Sidebar';
import { TaskEditModal } from '@/components/TaskEditModal';
import { BetaFocusMode } from '@/components/BetaFocusMode';
import { VisibleErrorBoundary } from '@/components/VisibleErrorBoundary';
import { DesktopNotification } from '@/components/DesktopNotification';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
  due_date?: string | null;
  subtasks?: Subtask[] | null;
  tags?: string[] | null;
}

// Liquid glass task card - no animations for smooth performance
const TaskCard = React.memo(({
  task,
  onToggle,
  onDelete,
  onEdit,
  onManualSchedule,
  onToggleSubtask,
  isSustainable = false,
  isDeleting = false,
  isPro = false,
}: {
  task: Task & { isNew?: boolean };
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit?: (id: number) => void;
  onManualSchedule?: (id: number) => void;
  onToggleSubtask?: (taskId: number, subtaskId: string) => void;
  isSustainable?: boolean;
  isDeleting?: boolean;
  isPro?: boolean;
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [subtasksExpanded, setSubtasksExpanded] = useState(false);
  const [isHoveringSubtasks, setIsHoveringSubtasks] = useState(false);

  const handleToggle = () => {
    onToggle(task.id);
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

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <>
      <div
        className="liquid-glass-task rounded-xl p-4 relative"
        onContextMenu={handleContextMenu}
      >
        <div className="flex items-center gap-4">
          {/* Checkbox with liquid glass effect */}
          <button
            onClick={handleToggle}
            className={`relative w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
              task.completed
                ? 'bg-white border-white shadow-lg'
                : 'border-white/40 hover:border-white/70 liquid-glass-subtle'
            }`}
          >
            {task.completed && (
              <Check className="w-4 h-4 text-black" strokeWidth={3} />
            )}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            {/* Task title and metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-base font-medium transition-colors task-title-text ${
                  task.completed
                    ? 'text-white/40 line-through'
                    : 'text-white/90'
                }`}
              >
                {task.title}
              </span>
              
              {/* Priority badge */}
              {task.priority && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                  task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {task.priority}
                </span>
              )}
              
              {/* Due date */}
              {task.due_date && (
                <span className={`text-xs ${
                  new Date(task.due_date) < new Date() && !task.completed
                    ? 'text-red-400'
                    : 'text-white/50'
                }`}>
                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: new Date(task.due_date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}
                </span>
              )}
            </div>
            
            {/* Subtasks - expandable */}
            {hasSubtasks && (
              <div className="mt-2 subtasks-section">
                <button
                  onClick={() => setSubtasksExpanded(!subtasksExpanded)}
                  className="flex items-center gap-2 text-xs text-white/50 hover:text-white/70 subtasks-toggle no-hover-bg"
                >
                  {subtasksExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  <span>
                    {completedSubtasks}/{totalSubtasks} subtasks
                  </span>
                </button>
                {subtasksExpanded && (
                  <div 
                    className="mt-2 ml-5 space-y-1.5 subtasks-container"
                  >
                    {task.subtasks?.map((subtask) => (
                      <button
                        key={subtask.id}
                        onClick={() => onToggleSubtask?.(task.id, subtask.id)}
                        className="flex items-center gap-2 w-full text-left cursor-pointer subtask-item no-hover-bg"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          subtask.completed
                            ? 'bg-white border-white'
                            : 'border-white/30'
                        }`}>
                          {subtask.completed && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm ${
                          subtask.completed
                            ? 'text-white/40 line-through'
                            : 'text-white/70'
                        }`}>
                          {subtask.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* XP indicator */}
          {isSustainable && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-green-400 font-mono font-semibold">
                +20
              </span>
              <div className="w-1 h-1 bg-green-400 rounded-full" />
            </div>
          )}

          {/* Edit button */}
          {onEdit && (
            <button
              onClick={() => onEdit(task.id)}
              className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-blue-400 liquid-glass-subtle rounded-lg opacity-70 hover:opacity-100"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={() => onDelete(task.id)}
            className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-red-400 liquid-glass-subtle rounded-lg disabled:opacity-40 disabled:cursor-not-allowed opacity-70 hover:opacity-100"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress indicator for new tasks */}
        {task.isNew && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-b-xl" />
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed z-50 bg-zinc-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
            minWidth: '200px'
          }}
        >
          <div className="py-1">
            {onEdit && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task.id);
                    setShowContextMenu(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 text-white/90 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>edit</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task.id);
                    setShowContextMenu(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 text-white/90 text-sm"
                >
                  <List className="w-4 h-4" />
                  <span>add subtask</span>
                </button>
              </>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
                setShowContextMenu(false);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 text-red-400 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>delete</span>
            </button>

            <div className="border-t border-white/10 my-1" />

            {onManualSchedule && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onManualSchedule(task.id);
                  setShowContextMenu(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10 text-sm"
              >
                <Clock className="w-4 h-4" />
                <span>schedule</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
});

TaskCard.displayName = 'TaskCard';

function MVPDashboard() {
  const { user } = useUser();
  // Note: Clerk uses cookie-based auth, no need for Bearer tokens

  // Initialize hooks normally (can't be conditional in React)
  // The hooks themselves should handle lazy initialization internally
  const {
    permission,
    sendTaskCompletionNotification,
    sendAchievementNotification,
    sendFirstTaskNotification,
    sendNotification
  } = useNotifications();
  const {
    trackTaskCreated,
    trackTaskCompleted,
    trackTaskDeleted,
    trackMoodSelected,
    trackSessionStart,
    trackMilestoneAchieved
  } = useBehaviorTracking();

  // Smart notifications - runs on its own schedule
  useSmartNotifications();

  // Onboarding - redirects new users to welcome page
  useOnboarding();

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
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountStep, setDeleteAccountStep] = useState<1 | 2>(1);
  const [showDesktopSuggestion, setShowDesktopSuggestion] = useState(false);
  const [deletingTaskIds, setDeletingTaskIds] = useState<Set<number>>(new Set());
  const [lastDeleteTime, setLastDeleteTime] = useState(0);
  const [lastCompletionTime, setLastCompletionTime] = useState(0);
  const [isAddLocked, setIsAddLocked] = useState(false);
  const { isOpen, closeMenu, openMenu } = useCommandMenu();
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalTitle, setCreateModalTitle] = useState('');
  const [showAIParser, setShowAIParser] = useState(false);
  const [deleteModalTask, setDeleteModalTask] = useState<Task | null>(null);
  const [scheduleModalTask, setScheduleModalTask] = useState<Task | null>(null);
  const [showMobileNotice, setShowMobileNotice] = useState(false);
  const [highlightMoodSelector, setHighlightMoodSelector] = useState(false);
  const [betaFocusModeActive, setBetaFocusModeActive] = useState(false);
  const [showFocusModeWhitelist, setShowFocusModeWhitelist] = useState(false);
  const [focusModeWhitelist, setFocusModeWhitelist] = useState<string[]>([]);
  const [newWhitelistSite, setNewWhitelistSite] = useState('');
  const [userCount, setUserCount] = useState(132);
  const [shareCopied, setShareCopied] = useState(false);

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
  
  // Memoize filtered tasks and group by individual tags
  const groupedTasksByTag = useMemo(() => {
    const filtered = tasks.filter(t => !t.title.includes('[COMPLETED]'));
    
    // Group tasks by their first tag (or "untagged" if no tags)
    const grouped: Record<string, Task[]> = {};
    
    filtered.forEach(task => {
      if (task.tags && task.tags.length > 0) {
        // Use the first tag as the grouping key
        const tag = task.tags[0];
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push(task);
      } else {
        // Tasks without tags go in "untagged" section
        if (!grouped['untagged']) {
          grouped['untagged'] = [];
        }
        grouped['untagged'].push(task);
      }
    });
    
    // Sort each group (incomplete first, then by creation date)
    Object.keys(grouped).forEach(tag => {
      grouped[tag].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1; // Incomplete first
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Older first
      });
    });
    
    // Sort tag sections alphabetically, but put "untagged" at the end
    const sortedTags = Object.keys(grouped).sort((a, b) => {
      if (a === 'untagged') return 1;
      if (b === 'untagged') return -1;
      return a.localeCompare(b);
    });
    
    return { grouped, sortedTags };
  }, [tasks]);
  
  // Keep visibleTasks for backward compatibility (flattened)
  const visibleTasks = useMemo(() => {
    const { grouped } = groupedTasksByTag;
    const result: Task[] = [];
    Object.keys(grouped).forEach(tag => {
      result.push(...grouped[tag]);
    });
    return result;
  }, [groupedTasksByTag]);
  
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
    }
    
    // Calculate current session points (regular = 10, sustainable = 20)
    // Exclude completed tasks from previous resets
    const currentCompletedTasks = tasks.filter(t => t?.completed && !t.title.includes('[COMPLETED]'));
    const regularCompleted = currentCompletedTasks.filter(t => !sustainableTasks.includes(t.title)).length;
    const sustainableCompleted = currentCompletedTasks.filter(t => sustainableTasks.includes(t.title)).length;
    const currentPoints = (regularCompleted * 10) + (sustainableCompleted * 20);
    
    // Total = stored + current (this updates in real-time as tasks are toggled)
    const totalPoints = storedPoints + currentPoints;

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

  // Check if confirmations have been dismissed - MOBILE SAFE
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      const dismissed = localStorage.getItem('task_confirmations_dismissed');
      if (dismissed === 'true') {
        setConfirmationsDismissed(true);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [isHydrated]);


  // Show mobile notice for iPhone users (once per session) - MOBILE SAFE
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    try {
      const hasSeenNotice = sessionStorage.getItem('mobile_notice_seen');
      const isIPhone = /iPhone/.test(navigator.userAgent);

      if (isIPhone && !hasSeenNotice) {
        setTimeout(() => {
          setShowMobileNotice(true);
          sessionStorage.setItem('mobile_notice_seen', 'true');
        }, 2000);
      }
    } catch (e) {
      // Ignore storage errors on mobile
    }
  }, [isHydrated]);

  // Fetch user data - OPTIMIZED with parallel requests and timeout
  const fetchUserData = useCallback(async () => {
    if (!user || !isHydrated) return;

    try {
      setIsLoading(true);

      // PARALLEL FETCH - fetch both tasks and subscription at the same time
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const [tasksRes, subRes] = await Promise.all([
        fetch('/api/tasks', {
          signal: controller.signal
        }).catch(err => {
          console.error('Tasks fetch failed:', err);
          return null;
        }),
        fetch('/api/subscription/status', {
          signal: controller.signal
        }).catch(err => {
          console.error('Subscription fetch failed:', err);
          return null;
        })
      ]);

      clearTimeout(timeoutId);

      // Process tasks
      let tasksList: Task[] = [];
      if (tasksRes && tasksRes.ok) {
        const tasksData = await tasksRes.json();
        tasksList = Array.isArray(tasksData) ? tasksData : tasksData.tasks || [];
        setTasks(tasksList);
      }

      // Process subscription
      if (subRes && subRes.ok) {
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
      }

      setIsLoading(false);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please check your connection.');
      } else {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      }
      setIsLoading(false);
    }
  }, [user, isHydrated]);

  // Hydration effect - ensures client-side hydration is complete
  useEffect(() => {
    // Small delay to ensure DOM is ready on all devices
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Load focus mode whitelist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('focusModeWhitelist');
      if (saved) {
        setFocusModeWhitelist(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load focus mode whitelist:', error);
    }
  }, []);

  // Fetch user count from API - refresh periodically to keep it updated
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch('/api/user/count');
        if (response.ok) {
          const data = await response.json();
          setUserCount(data.count || 146);
        }
      } catch (error) {
        console.error('Failed to fetch user count:', error);
      }
    };
    
    // Fetch immediately
    fetchUserCount();
    
    // Refresh every 5 minutes to keep count updated
    const interval = setInterval(fetchUserCount, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Share handler
  const handleShare = async () => {
    const url = window.location.origin;
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Teyra - AI Productivity Assistant',
          text: '🌱 Building consistency with Teyra. Check it out!',
          url: url,
        });
        return;
      } catch (err) {
        // User cancelled or error, fall back to copy
      }
    }
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  useEffect(() => {
    if (!user?.id || !isHydrated)
      return;

    // Check if user just upgraded to Pro (coming back from Stripe)
    const checkProUpgrade = async () => {
      if (typeof window === 'undefined') return false;
      const urlParams = new URLSearchParams(window.location.search);
      const justUpgraded = urlParams.get('pro_welcome');
      const sessionId = urlParams.get('session_id');
      const upgradeStatus = urlParams.get('upgrade');

      if (justUpgraded === 'true' && sessionId) {
        // User returned from Stripe checkout

        try {
          // Step 1: Verify the Stripe session and ensure user is marked as Pro
          console.log('🔍 Verifying Stripe session...');
          const verifyRes = await fetch('/api/stripe/verify-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId })
          });

          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            console.log('✅ Session verified:', verifyData);

            if (verifyData.isPro) {
              // Set Pro status immediately
              setIsPro(true);

              // Refresh all user data to get updated Pro status
              await fetchUserData();

              // Clean up URL params immediately to prevent re-triggering
              window.history.replaceState({}, '', '/dashboard');

              // Show welcome modal with confetti
              setTimeout(() => {
                setShowProWelcome(true);
                toast.success('🎉 Welcome to Teyra Pro!');
              }, 500);
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          }
        } catch (error) {
          console.error('❌ Error verifying upgrade:', error);
          toast.error('Could not verify payment. Please contact support if charged.');
        }

        return true; // Indicate upgrade flow was handled
      } else if (upgradeStatus === 'cancelled') {
        toast.info('Upgrade cancelled. You can upgrade anytime!');
        window.history.replaceState({}, '', '/dashboard');
      }
      return false;
    };

    // Run upgrade check first, then fetch data if not upgrading
    const initializeDashboard = async () => {
      const wasUpgrading = await checkProUpgrade();

      // If not in upgrade flow, fetch data normally
      if (!wasUpgrading) {
        fetchUserData();
      }

      // Track session start
      try {
        trackSessionStart();
      } catch (error) {
        console.warn('Session tracking failed:', error);
      }
    };

    initializeDashboard();

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
      if (typeof window === 'undefined') return;
      const userId = user.id;

      // Initializing user experience

      // Check if this is a first visit for onboarding tour
      const hasSeenTour = localStorage.getItem(`dashboard_tour_${userId}`) === 'true';

      // For existing users who have never seen the tour, show it
      if (!hasSeenTour) {
        setTimeout(() => {
          setShowOnboardingTour(true);
        }, 1000);
      }

      // Desktop suggestion for mobile users (random chance)
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobile) {
        const lastShown = localStorage.getItem('desktop_suggestion_last_shown');
        const now = Date.now();

        // Only show once per 24 hours, with 20% random chance
        if (!lastShown || (now - parseInt(lastShown)) > 24 * 60 * 60 * 1000) {
          const shouldShow = Math.random() < 0.2; // 20% chance
          if (shouldShow) {
            setTimeout(() => {
              setShowDesktopSuggestion(true);
              localStorage.setItem('desktop_suggestion_last_shown', now.toString());
            }, 3000); // Show after 3 seconds
          }
        }
      }
    };

    initializeUserExperience();
  }, [fetchUserData, trackSessionStart, user?.id, isHydrated]);

  // Check for tasks due today and send notifications
  useEffect(() => {
    if (!user?.id || !isHydrated || !permission.granted || tasks.length === 0) return;

    const checkDueTasks = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check ALL tasks with due dates, not just high/urgent
      const dueTasks = tasks.filter(task => {
        if (!task.due_date || task.completed) return false;
        
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        // Check if due date is today
        return dueDate.getTime() === today.getTime();
      });

      // Send notification for each due task (only once per day)
      dueTasks.forEach(task => {
        const notificationKey = `notified-${task.id}-${today.toDateString()}`;
        const alreadyNotified = localStorage.getItem(notificationKey);
        
        if (!alreadyNotified) {
          const priorityEmoji = task.priority === 'urgent' ? '🚨' : task.priority === 'high' ? '⚠️' : '📅';
          const priorityText = task.priority === 'urgent' ? 'URGENT' : task.priority === 'high' ? 'HIGH' : '';
          
          sendNotification(
            priorityText 
              ? `${priorityEmoji} ${priorityText} Priority Task Due Today`
              : `📅 Task Due Today`,
            {
              body: `"${task.title}" is due today. Don't forget to complete it!`,
              tag: `due-task-${task.id}`,
              requireInteraction: true,
              icon: '/teyra-logo-64kb.png',
              badge: '/teyra-logo-64kb.png',
            }
          );
          
          // Mark as notified for today
          localStorage.setItem(notificationKey, 'true');
        }
      });
    };

    // Check immediately and then every hour
    checkDueTasks();
    const interval = setInterval(checkDueTasks, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [tasks, user?.id, isHydrated, permission.granted, sendNotification]);

  // Force loading to complete if user is available but still loading
  useEffect(() => {
    if (user?.id && isLoading) {
      const timeout = setTimeout(() => {
        // Forcing loading completion
        setIsLoading(false);
      }, 3000); // Max 3 seconds loading
      
      return () => clearTimeout(timeout);
    }
  }, [user?.id, isLoading]);

  // Add task - Fast optimistic updates
  const handleCreateTask = async (taskData: Partial<Task>) => {
    if (!user || isAddLocked) return;

    // Check daily limit before adding
    if (dailyTasksCount >= 10) {
      setShowDailyLimitPopup(true);
      setCreateModalOpen(false);
      return;
    }

    const taskTitle = taskData.title?.trim() || '';

    if (!taskTitle) return;

    // Rate limiting: prevent spam clicking
    setIsAddLocked(true);

    // Clear input immediately for better UX
    setNewTask('');
    setCreateModalOpen(false);
    setCreateModalTitle('');

    // Create optimistic task for instant UI update
    const optimisticTask: Task = {
      id: Date.now(), // Temporary ID
      title: taskTitle,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      priority: taskData.priority || null,
      due_date: taskData.due_date || null,
      subtasks: taskData.subtasks || null,
      tags: taskData.tags || null,
    };

    // Add optimistic task immediately to prevent flicker
    setTasks(prev => [optimisticTask, ...prev]);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          priority: taskData.priority || null,
          due_date: taskData.due_date || null,
          subtasks: taskData.subtasks || null,
          tags: taskData.tags || null,
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic task with real one smoothly
        setTasks(prev => prev.map(t => t.id === optimisticTask.id ? data : t));

        // Track in background
        try {
          trackTaskCreated(taskTitle, data.id);
          gtag.trackTaskCreated(taskTitle);
        } catch {}
      } else {
        // Remove optimistic task on error
        setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
        setNewTask(taskTitle);
        toast.error('Failed to add task');
      }
    } catch (error) {
      // Remove optimistic task on error
      setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
      setNewTask(taskTitle);
      toast.error('Failed to add task');
    } finally {
      // Release lock after 300ms
      setTimeout(() => setIsAddLocked(false), 300);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim() || !user || isAddLocked) return;

    // Check daily limit before adding
    if (dailyTasksCount >= 10) {
      setShowDailyLimitPopup(true);
      return;
    }

    const taskTitle = newTask.trim();

    // Rate limiting: prevent spam clicking
    setIsAddLocked(true);

    // Clear input immediately for better UX
    setNewTask('');

    // Create optimistic task for instant UI update
    const optimisticTask: Task = {
      id: Date.now(), // Temporary ID
      title: taskTitle,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add optimistic task immediately to prevent flicker
    setTasks(prev => [optimisticTask, ...prev]);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle })
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic task with real one smoothly
        setTasks(prev => prev.map(t => t.id === optimisticTask.id ? data : t));

        // Track in background
        try {
          trackTaskCreated(taskTitle, data.id);
          gtag.trackTaskCreated(taskTitle);
        } catch {}
      } else {
        // Remove optimistic task on error
        setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
        setNewTask(taskTitle);
        toast.error('Failed to add task');
      }
    } catch (error) {
      // Remove optimistic task on error
      setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
      setNewTask(taskTitle);
      toast.error('Failed to add task');
    } finally {
      // Release lock after 300ms
      setTimeout(() => setIsAddLocked(false), 300);
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
    // Rate limiting: prevent spam completions (400ms between completions)
    const now = Date.now();
    if (newCompletedState && now - lastCompletionTime < 400) {
      console.log('⚠️ Completing too fast, please slow down');
      toast.error('Please slow down');
      return;
    }

    const task = tasks.find(t => t.id === taskId);

    // Extra safeguard for sustainable tasks (prevent spam-completing for points)
    if (newCompletedState && sustainableTasks.includes(task?.title || '')) {
      const recentSustainableCompletions = tasks.filter(t =>
        t.completed &&
        sustainableTasks.includes(t.title) &&
        new Date(t.updated_at).getTime() > Date.now() - 60000 // Last minute
      ).length;

      if (recentSustainableCompletions >= 3) {
        toast.error('Too many sustainable tasks completed too quickly. Take a break!');
        return;
      }
    }

    if (newCompletedState) {
      setLastCompletionTime(now);
    }

    const oldTotalPoints = rawTotalPoints;

    // Update UI immediately with boost effect
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, completed: newCompletedState } : t
      )
    );

    // Check for milestone achievement after state would update
    if (newCompletedState) {
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
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
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
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
    // Rate limiting: prevent spam deletions (300ms between deletions)
    const now = Date.now();
    if (now - lastDeleteTime < 300) {
      console.log('⚠️ Deleting too fast, please slow down');
      toast.error('Please slow down');
      return;
    }
    setLastDeleteTime(now);

    if (deletingTaskIds.has(taskId)) {
      console.log(`⚠️ Task ${taskId} already being deleted, ignoring duplicate click`);
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log(`⚠️ Task ${taskId} not found in state`);
      return;
    }

    console.log(`🗑️ Frontend: Deleting task ${taskId}: "${task.title}"`);

    // Mark as deleting
    setDeletingTaskIds(prev => new Set(prev).add(taskId));

    // Remove from UI immediately
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include' // Ensure cookies are sent
      });

      console.log(`📡 DELETE /api/tasks/${taskId} - Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`❌ Failed to delete task ${taskId}:`, errorData);

        // Restore task on failure
        setTasks(prev => [...prev, task].sort((a, b) => a.id - b.id));
        toast.error('Failed to delete task');
      } else {
        console.log(`✅ Task ${taskId} deleted successfully`);
        // Track deletion silently
        try {
          trackTaskDeleted(task.title, taskId);
        } catch (e) {
          console.warn('Failed to track deletion:', e);
        }
      }
    } catch (error) {
      console.error(`❌ Network error deleting task ${taskId}:`, error);
      // Restore task on error
      setTasks(prev => [...prev, task].sort((a, b) => a.id - b.id));
      toast.error('Network error - task not deleted');
    } finally {
      // Remove from deleting set
      setDeletingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  // Handler for account deletion
  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        setShowDeleteAccountModal(false);
        // Redirect to home page after deletion
        setTimeout(() => window.location.href = '/', 1500);
      } else {
        const error = await response.json().catch(() => ({}));
        if (error.code === 'VERIFICATION_REQUIRED') {
          toast.error('Account deletion requires additional verification. Please contact support if you need assistance.');
        } else {
          toast.error(error.error || 'Failed to delete account');
        }
        setShowDeleteAccountModal(false);
      }
    } catch (error) {
      toast.error(`Failed to delete account: ${error instanceof Error ? error.message : 'Network error'}`);
      setShowDeleteAccountModal(false);
    }
  };

  // Handler for editing a task - show modal
  const handleEditTask = async (taskId: number) => {
    // Always get the latest task from the tasks array to ensure we have the most up-to-date data
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    // Create a new object to ensure React detects the change
    setEditModalTask({ ...task });
  };

  // Update task with new data
  const updateTask = async (taskId: number | string, updates: Partial<Task>) => {
    // Store original task for rollback
    const originalTask = tasks.find(t => t.id === taskId);
    
    // Optimistically update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    ));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        // Restore original task on error
        if (originalTask) {
          setTasks(prev => prev.map(t => t.id === taskId ? originalTask : t));
        }
        toast.error('Failed to update task');
      } else {
        const updatedTask = await response.json();
        // Ensure tags are always included (even if empty array or null)
        const taskWithTags = {
          ...updatedTask,
          tags: updatedTask.tags || (updates.tags !== undefined ? updates.tags : originalTask?.tags || [])
        };
        setTasks(prev => prev.map(t => t.id === taskId ? taskWithTags : t));
        toast.success('Task updated');
      }
    } catch (error) {
      // Restore original task on error
      if (originalTask) {
        setTasks(prev => prev.map(t => t.id === taskId ? originalTask : t));
      }
      toast.error('Failed to update task');
    }
  };

  // Toggle subtask completion
  const handleToggleSubtask = async (taskId: number, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.map(subtask =>
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );

    await updateTask(taskId, { subtasks: updatedSubtasks });
  };

  // Handler for AI scheduling a single task
  // Handler for manually scheduling a single task
  const handleManualScheduleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setScheduleModalTask(task);
  };

  // TEST: Handle test notification (remove after testing)
  const handleTestNotification = async () => {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        toast.error('Notifications not supported on this device');
        return;
      }

      // Check and request notification permission
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        toast.error('Notification permission denied. Please enable in settings.');
        console.error('Notification permission:', permission);
        return;
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        toast.error('Service worker not supported');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      if (!registration.active) {
        toast.error('Service worker not active. Try refreshing the page.');
        console.error('Service worker state:', registration);
        return;
      }

      console.log('✅ Service worker active:', registration.active.state);
      console.log('✅ Notification permission:', permission);

      // Clear daily limit (for testing)
      try {
        const db = await new Promise((resolve: any, reject: any) => {
          const request = indexedDB.open('teyra-notifications', 1);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('notification-dates')) {
              db.createObjectStore('notification-dates', { keyPath: 'id' });
            }
          };
        });
        const tx = db.transaction(['notification-dates'], 'readwrite');
        tx.objectStore('notification-dates').delete('last-notification');
        console.log('✅ Cleared daily limit');
      } catch (e) {
        console.log('⚠️ Could not clear IndexedDB:', e);
      }
      
      localStorage.removeItem('teyra_last_notification_date');
      localStorage.removeItem('teyra_last_daily_check');
      
      // Try direct notification first (for testing)
      try {
        const testNotification = new Notification('bro can you lock in you have so much stuff to do', {
          body: '',
          icon: '/teyra-logo-64kb.png',
          badge: '/teyra-logo-64kb.png',
          tag: 'teyra-test',
          requireInteraction: false,
        });
        console.log('✅ Direct notification sent');
        toast.success('Test notification sent! Check your notifications.');
        setTimeout(() => testNotification.close(), 5000);
      } catch (directError) {
        console.log('Direct notification failed, trying service worker:', directError);
        
        // Fallback: Trigger via service worker
        registration.active.postMessage({
          type: 'TRIGGER_NOTIFICATION',
          message: 'bro can you lock in you have so much stuff to do'
        });
        
        console.log('✅ Message sent to service worker');
        toast.success('Test notification sent via service worker! Check your notifications.');
      }
    } catch (error) {
      console.error('❌ Error testing notification:', error);
      toast.error(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Actually schedule the task
  const saveScheduledTask = async (scheduledTime: string, durationMinutes: number) => {
    if (!scheduleModalTask) return;

    try {
      const response = await fetch(`/api/tasks/${scheduleModalTask.id}`, {
        method: 'PATCH',
        headers: {
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
        const tasksResponse = await fetch('/api/tasks');
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
        <Sidebar
          isPro={isPro}
          showSettings={true}
          showAccountButton={true}
          onCommandMenuClick={openMenu}
        />
        <div className="lg:ml-64 flex items-center justify-center w-full">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full mb-4 mx-auto animate-spin" />
            <p className="text-white/60 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-gradient-bg noise-texture text-white relative overflow-hidden" style={{ marginTop: 0, paddingTop: 0 }}>
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
      {/* Sidebar */}
      <Sidebar
        isPro={isPro}
        showSettings={true}
        showAccountButton={true}
        currentMood={currentMood}
        onAccountClick={() => setShowAccountModal(true)}
        onSettingsClick={() => setShowNotificationSettings(true)}
        onHelpClick={() => setShowOnboardingTour(true)}
        onCommandMenuClick={openMenu}
        onUpgradeClick={handleUpgrade}
        dailyTasksCount={dailyTasksCount}
        customDeleteHandler={() => {
          setDeleteAccountStep(1);
          setShowDeleteAccountModal(true);
        }}
      />

      <main className="lg:ml-64 max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-6 sm:pb-8">
        {/* Teyra Pro Banner - Show all Pro features for non-Pro users */}
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
                    { title: "unlimited AI text → task parsing", desc: "chrome extension (vs 5 per day free)", highlight: true },
                    { title: "3 AI mood tasks per day", desc: "what you like to do today feature (vs 1 free)", highlight: false },
                    { title: "pomodoro timer", desc: "chrome extension - built-in focus sessions", highlight: false },
                    { title: "focus mode customization", desc: "chrome extension - block any websites", highlight: false },
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
            <div
              data-mood-selector
              className={`transition-all duration-500 ${highlightMoodSelector ? 'ring-4 ring-white/40 ring-offset-4 ring-offset-black rounded-2xl' : ''}`}
            >
              <MoodTaskGenerator
                currentTasks={tasks}
                onTaskAdded={handleMoodTaskAdded}
                onMoodSelected={(mood) => {
                  setCurrentMood(mood);
                  setHighlightMoodSelector(false); // Remove highlight after selection
                  try {
                    trackMoodSelected(mood.label, mood);
                    gtag.trackMoodSelected(mood.label);
                  } catch (error) {
                    console.warn('Mood tracking failed:', error);
                  }
                }}
              />
            </div>

            {/* Beta Focus Mode */}
            <div className="liquid-glass glass-gradient-purple rounded-lg p-4 liquid-glass-hover">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <span className="text-base font-semibold text-white">Beta Focus Mode</span>
                    <p className="text-sm text-white/60">Lock in for 30 minutes - stay focused!</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFocusModeWhitelist(!showFocusModeWhitelist)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium transition-all"
                    title="Manage whitelist"
                  >
                    ⚙️
                  </button>
                  <button
                    onClick={() => setBetaFocusModeActive(true)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 rounded-lg text-sm font-medium"
                  >
                    Start
                  </button>
                </div>
              </div>
              
              {/* Whitelist Management */}
              <AnimatePresence>
                {showFocusModeWhitelist && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-white/10 space-y-3"
                  >
                    <div className="text-xs text-white/60 mb-2">whitelisted sites (won't trigger prompts)</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newWhitelistSite}
                        onChange={(e) => setNewWhitelistSite(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newWhitelistSite.trim()) {
                            const site = newWhitelistSite.trim().toLowerCase();
                            if (!focusModeWhitelist.includes(site)) {
                              const updated = [...focusModeWhitelist, site];
                              setFocusModeWhitelist(updated);
                              localStorage.setItem('focusModeWhitelist', JSON.stringify(updated));
                              setNewWhitelistSite('');
                              toast.success('Site added to whitelist');
                            }
                          }
                        }}
                        placeholder="e.g., docs.google.com"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/20"
                      />
                      <button
                        onClick={() => {
                          if (newWhitelistSite.trim()) {
                            const site = newWhitelistSite.trim().toLowerCase();
                            if (!focusModeWhitelist.includes(site)) {
                              const updated = [...focusModeWhitelist, site];
                              setFocusModeWhitelist(updated);
                              localStorage.setItem('focusModeWhitelist', JSON.stringify(updated));
                              setNewWhitelistSite('');
                              toast.success('Site added to whitelist');
                            } else {
                              toast.error('Site already in whitelist');
                            }
                          }
                        }}
                        className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-lg text-xs font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {focusModeWhitelist.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {focusModeWhitelist.map((site, index) => (
                          <div key={index} className="flex items-center justify-between px-2 py-1.5 bg-white/5 rounded text-xs text-white/80">
                            <span>{site}</span>
                            <button
                              onClick={() => {
                                const updated = focusModeWhitelist.filter((_, i) => i !== index);
                                setFocusModeWhitelist(updated);
                                localStorage.setItem('focusModeWhitelist', JSON.stringify(updated));
                                toast.success('Site removed from whitelist');
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* TEST: Notification Test Button - REMOVE AFTER TESTING */}
            <div className="liquid-glass rounded-lg p-4 border-2 border-red-500/50" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.15) 100%)' }}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">🧪</span>
                    <div>
                      <span className="text-base font-semibold text-white">Test Notification</span>
                      <p className="text-sm text-white/60">Request permission & test PWA notification</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        if (!('Notification' in window)) {
                          toast.error('Notifications not supported');
                          return;
                        }
                        
                        // Check if iOS
                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                        
                        if (isIOS) {
                          toast.info('iOS: Notifications only work when app is open. Requesting permission...');
                        }
                        
                        const permission = await Notification.requestPermission();
                        console.log('Permission result:', permission);
                        
                        if (permission === 'granted') {
                          toast.success('Permission granted! On iOS, notifications only work when app is open.');
                          
                          // Show iOS-specific instructions
                          if (isIOS) {
                            setTimeout(() => {
                              toast.info('iOS Note: Background notifications are limited. Check Settings → Notifications → Teyra', { duration: 5000 });
                            }, 2000);
                          }
                        } else if (permission === 'denied') {
                          toast.error('Permission denied. Go to Settings → Safari → Notifications → Teyra');
                        } else {
                          toast.error('Permission not granted');
                        }
                      } catch (error) {
                        console.error('Error requesting permission:', error);
                        toast.error('Failed to request permission');
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 hover:border-blue-500/70 rounded-lg text-sm font-medium transition-all"
                  >
                    Request Permission
                  </button>
                  <button
                    onClick={handleTestNotification}
                    className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 hover:border-red-500/70 rounded-lg text-sm font-medium transition-all"
                  >
                    Test Now
                  </button>
                </div>
                
                <div className="text-xs text-white/50 space-y-1">
                  <p>• Current permission: <span className="text-white/70">{typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unknown'}</span></p>
                  <p>• Service worker: <span className="text-white/70">{typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? 'supported' : 'not supported'}</span></p>
                  {/iPad|iPhone|iPod/.test(navigator.userAgent) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? (
                    <p className="text-yellow-400">⚠️ iOS: Background notifications are limited. They only work when the app is open.</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Sustainable Task Generator */}
            <div className="liquid-glass glass-gradient-green rounded-lg p-4 liquid-glass-hover">
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
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 rounded-lg text-sm font-medium"
                >
                  Add Task
                </button>
              </div>
            </div>

            {/* Task Input - simple and smooth */}
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewTask(value);
                      // Open create modal when user starts typing
                      if (value.trim() && !createModalOpen) {
                        setCreateModalTitle(value);
                        setCreateModalOpen(true);
                      } else if (createModalOpen) {
                        setCreateModalTitle(value);
                      }
                    }}
                    onFocus={() => {
                      // Open modal if there's already text
                      if (newTask.trim() && !createModalOpen) {
                        setCreateModalTitle(newTask);
                        setCreateModalOpen(true);
                      }
                    }}
                    placeholder="Add a task..."
                    className="flex-1 px-6 py-4 liquid-glass-input rounded-xl text-white placeholder:text-white/50 text-base focus:outline-none focus:ring-0"
                    onKeyDown={(e) => {
                      if (e.key === '/' && !newTask.trim()) {
                        e.preventDefault();
                        openMenu();
                      } else if (e.key === 'Enter' && !isAddLocked && !createModalOpen) {
                        e.preventDefault();
                        handleAddTask();
                      }
                    }}
                    disabled={isAddLocked}
                    style={{ display: createModalOpen ? 'none' : 'block' }}
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddTask();
                    }}
                    disabled={!newTask.trim() || isAddLocked}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl ${
                      newTask.trim() && !isAddLocked
                        ? 'bg-white hover:bg-white/90 text-black'
                        : 'bg-white/20 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Character count indicator */}
                {newTask.trim() && (
                  <div className="absolute -bottom-6 right-0 text-xs text-white/40">
                    {newTask.length}/100
                  </div>
                )}
              </div>

              {dailyTasksCount >= 8 && (
                <div className="text-center">
                  <span className={`text-sm px-3 py-1.5 rounded-lg ${
                    dailyTasksCount >= 10
                      ? 'bg-red-500/20 text-red-400 border border-red-400/30'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-400/30'
                  }`}>
                    {dailyTasksCount >= 10 ? 'Daily limit reached (10/10)' : `${dailyTasksCount}/10 tasks today`}
                  </span>
                </div>
              )}
            </div>

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
                {visibleTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Plus className="w-7 h-7 text-white/40" />
                    </div>
                    <p className="text-white/60 text-lg font-semibold">No tasks yet</p>
                    <p className="text-white/40 text-sm mt-2">Add your first task above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedTasksByTag.sortedTags.map((tag) => (
                      <div key={tag} className="space-y-3">
                        {/* Tag Section Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
                            {tag === 'untagged' ? 'untagged' : tag}
                          </h3>
                          <div className="flex-1 h-px bg-white/10"></div>
                          <span className="text-xs text-white/40 font-mono">
                            {groupedTasksByTag.grouped[tag].length}
                          </span>
                        </div>
                        
                        {/* Tasks in this tag section */}
                        <div className="space-y-3">
                          {groupedTasksByTag.grouped[tag].map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onToggle={handleToggleTask}
                              onDelete={handleDeleteTask}
                              onEdit={handleEditTask}
                              onManualSchedule={handleManualScheduleTask}
                              onToggleSubtask={handleToggleSubtask}
                              isSustainable={sustainableTasks.includes(task.title)}
                              isDeleting={deletingTaskIds.has(task.id as number)}
                              isPro={isPro}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Progress & Motivation */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="space-y-6">
              {/* Social Proof Section */}
              <div className="liquid-glass glass-gradient-green rounded-lg p-4 liquid-glass-hover">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌱</span>
                    <span className="text-white/90 font-medium text-sm">
                      {userCount} users are building productivity with teyra
                    </span>
                  </div>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white/70 hover:text-white rounded-lg text-xs font-medium transition-all flex-shrink-0"
                    title="Share Teyra"
                  >
                    <Share2 className={`w-3.5 h-3.5 ${shareCopied ? 'text-green-400' : ''}`} />
                    <span>{shareCopied ? 'copied!' : 'share'}</span>
                  </button>
                </div>
              </div>

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

              // NEW USER FLOW: After onboarding, prompt them to select their mood
              setTimeout(() => {
                if (typeof window === 'undefined') return; // Safety check

                setHighlightMoodSelector(true);
                // Scroll to mood selector smoothly
                try {
                  const moodSection = document.querySelector('[data-mood-selector]');
                  if (moodSection && moodSection.scrollIntoView) {
                    moodSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                } catch (error) {
                  console.warn('Scroll failed:', error);
                }
                // Auto-remove highlight after 10 seconds
                setTimeout(() => setHighlightMoodSelector(false), 10000);
              }, 500);
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
                // Push notifications enabled
              }
              toast.success('Smart notifications enabled! 🔔');
            }}
            onEnableEmails={() => {}}
          />
        )}
      </AnimatePresence>

      {/* Notification Settings */}
      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        isPro={isPro}
      />

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteAccountModal(false);
              setDeleteAccountStep(1);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-black/90 backdrop-blur-md border border-red-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {deleteAccountStep === 1 ? (
                <>
                  {/* Step 1: Initial Warning */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">⚠️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Delete Account?</h2>
                    <p className="text-white/60 text-sm">This action cannot be undone</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h3 className="text-red-400 font-semibold mb-2">This will permanently delete:</h3>
                      <ul className="space-y-1 text-white/70 text-sm">
                        <li>• All your tasks and progress</li>
                        <li>• Your Mike the Cactus</li>
                        <li>• All account data</li>
                      </ul>
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                      <h3 className="text-orange-400 font-semibold mb-2">Important:</h3>
                      <ul className="space-y-1 text-white/70 text-sm">
                        <li>• Active subscriptions will continue until the end of your billing period</li>
                        <li>• NO REFUNDS will be issued</li>
                        <li>• This action CANNOT be undone</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteAccountModal(false);
                        setDeleteAccountStep(1);
                      }}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setDeleteAccountStep(2)}
                      className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-semibold"
                    >
                      Continue
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2: Final Confirmation */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <span className="text-4xl">⚠️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Final Warning</h2>
                    <p className="text-white/80 text-base">This is your last chance to cancel.</p>
                  </div>

                  <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-6 mb-6">
                    <p className="text-white text-center font-medium">
                      Click "Delete Forever" to permanently delete your account, or "Go Back" to cancel.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteAccountStep(1)}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold"
                    >
                      Delete Forever
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Suggestion Modal for Mobile Users */}
      <AnimatePresence>
        {showDesktopSuggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDesktopSuggestion(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-md border border-blue-400/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">💻</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Better on Desktop!</h2>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                  While Teyra works great on mobile, you'll get the full experience with calendar integration,
                  notes, and more productivity features on desktop.
                </p>
                <button
                  onClick={() => setShowDesktopSuggestion(false)}
                  className="w-full px-4 py-3 bg-white hover:bg-white/90 text-black rounded-xl transition-all font-semibold"
                >
                  Got it!
                </button>
                <p className="text-white/50 text-xs mt-3">
                  You won't see this again for 24 hours
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    {isPro ? 'unlimited AI parsing, 3 mood tasks/day, chrome ext' : '5 AI parses, 1 mood task per day'}
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

              {!isPro && dailyTasksCount >= 10 && (
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
                    <span className="text-white/70">no more unlimited AI text → task parsing</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-400">✗</span>
                    <span className="text-white/70">back to 1 AI mood task per day (from 3)</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-400">✗</span>
                    <span className="text-white/70">no more pomodoro timer & focus mode (extension)</span>
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
                      const response = await fetch('/api/stripe/cancel-subscription', {
                        method: 'POST',
                        headers: {
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
      <TaskEditModal
        isOpen={!!editModalTask}
        onClose={() => setEditModalTask(null)}
        task={editModalTask}
        onUpdateTask={updateTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Create Task Modal */}
      <TaskEditModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setNewTask('');
          setCreateModalTitle('');
        }}
        task={null}
        onUpdateTask={updateTask}
        onDeleteTask={handleDeleteTask}
        onCreateTask={handleCreateTask}
        initialTitle={createModalTitle}
      />

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

      {/* Command Menu */}
      <CommandMenu 
        isOpen={isOpen} 
        onClose={closeMenu}
        onTaskAdded={() => {
          // Refresh tasks when a task is added via command menu
          fetchUserData();
        }}
      />

      {/* Beta Focus Mode Overlay */}
      <BetaFocusMode 
        isActive={betaFocusModeActive} 
        onEnd={() => setBetaFocusModeActive(false)}
        tasks={tasks}
        isPro={isPro}
        onAddTask={async (title: string) => {
          if (!title.trim() || !user || isAddLocked) return;

          // Check daily limit before adding
          if (dailyTasksCount >= 10) {
            setShowDailyLimitPopup(true);
            return;
          }

          const taskTitle = title.trim();
          setIsAddLocked(true);

          // Create optimistic task for instant UI update
          const optimisticTask: Task = {
            id: Date.now(),
            title: taskTitle,
            completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Add optimistic task immediately
          setTasks(prev => [optimisticTask, ...prev]);

          try {
            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: taskTitle })
            });

            if (response.ok) {
              const data = await response.json();
              // Replace optimistic task with real one
              setTasks(prev => prev.map(t => t.id === optimisticTask.id ? data : t));

              // Track in background
              try {
                trackTaskCreated(taskTitle, data.id);
                gtag.trackTaskCreated(taskTitle);
              } catch {}
            } else {
              // Remove optimistic task on failure
              setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
            }
          } catch (error) {
            // Remove optimistic task on failure
            setTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
          } finally {
            setTimeout(() => setIsAddLocked(false), 300);
          }
        }}
        onToggleTask={async (taskId: number) => {
          await handleToggleTask(taskId);
        }}
      />

      {/* Desktop Notification - Shows on mobile */}
      <DesktopNotification />

    </div>
  );
}

// Error fallback for ErrorBoundary
const DashboardError = () => (
  <div className="min-h-screen dark-gradient-bg noise-texture flex items-center justify-center p-4">
    <div className="text-center max-w-md glass-dark-modern border-precise rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-white mb-4">
        something went wrong
      </h2>
      <p className="text-white/60 mb-6">
        we encountered an error loading your dashboard. please refresh to try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 font-medium transition-all"
      >
        refresh dashboard
      </button>
    </div>
  </div>
);

// Wrap in visible error boundary so errors show ON SCREEN
export default function DashboardPage() {
  return (
    <VisibleErrorBoundary>
      <MVPDashboard />
    </VisibleErrorBoundary>
  );
}
