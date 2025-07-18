"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser, useAuth } from '@clerk/nextjs'
import { SignOutButton } from '@clerk/nextjs'
import { UserProfile } from '@clerk/nextjs'
import { LogOut, RotateCcw, Check, ArrowLeft, Crown, Sparkles, Zap, Smile, Home } from 'lucide-react'
import { toast } from 'sonner'
import { getTasks, createTask, updateTask, deleteTask as deleteTaskFromDB, deleteTaskByTitle, updateTaskByTitle, getUserStats, createUserStats, updateUserStats, canPerformMoodCheckIn, incrementMoodCheckIn, canPerformAISplit, incrementAISplit, deleteAllTasks, fixCompletedTasksCount } from "@/lib/database"
import { Task, UserStats } from '@/lib/types'
import TaskCard from '@/components/TaskCard'
import TaskInput from '@/components/TaskInput'
import { Cactus } from '@/components/Cactus'
import { AnimatedCircularProgressBar } from '@/components/magicui/animated-circular-progress-bar'
import { OnboardingModal } from '@/components/OnboardingModal'
import { MikeIntroModal } from '@/components/MikeIntroModal'
import { MoodCheckIn } from '@/components/MoodCheckIn'
import { FirstTaskCelebration } from '@/components/FirstTaskCelebration'
import { TaskProgressPopup } from '@/components/TaskProgressPopup'
import { DailyCountdownTimer } from '@/components/DailyCountdownTimer'
import { DailyResetNotification } from '@/components/DailyResetNotification'
import { DailyResetPopup } from '@/components/DailyResetPopup'
import { prioritizeTasks, getMotivationalMessage, suggestQuickWin, suggestMoodBasedTasks } from "@/lib/groq";
import { createClient } from '@/lib/supabase-client'
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false)
  const [mikeIntroModalOpen, setMikeIntroModalOpen] = useState(false)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [userProfileOpen, setUserProfileOpen] = useState(false)
  const [firstTaskCelebrationOpen, setFirstTaskCelebrationOpen] = useState(false)
  const [submittedTask, setSubmittedTask] = useState<string | null>(null)

  
  // Global undo system
  const [undoStack, setUndoStack] = useState<Array<{ action: 'create' | 'delete' | 'complete', task: Task, timestamp: number }>>([])
  const [showGlobalUndo, setShowGlobalUndo] = useState(false)
  const [lastDeletedTask, setLastDeletedTask] = useState<Task | null>(null)
  
  // Completed tasks tracking
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  
  // Animation tracking
  const [animatingTasks, setAnimatingTasks] = useState<Set<string>>(new Set())
  const taskInputRef = useRef<HTMLDivElement>(null)
  const tasksListRef = useRef<HTMLDivElement>(null)
  
  // Cleanup old undo stack entries (older than 1 hour)
  useEffect(() => {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    setUndoStack(prev => prev.filter(entry => now - entry.timestamp < oneHour))
  }, [])
  

  
  const [motivationalMessage, setMotivationalMessage] = useState('')
  const [quickWinSuggestion, setQuickWinSuggestion] = useState('')
  const [progress, setProgress] = useState(0)
  const [maxProgress, setMaxProgress] = useState(10)
  const [cactusMood, setCactusMood] = useState<'happy' | 'neutral' | 'sad'>('sad')
  
  // Mood system
  const [currentMood, setCurrentMood] = useState<'energized' | 'focused' | 'neutral' | 'tired' | 'stressed'>('neutral')
  const [moodCheckInOpen, setMoodCheckInOpen] = useState(false)
  const [moodBasedSuggestions, setMoodBasedSuggestions] = useState<{ suggestions: string[]; message: string } | null>(null)
  const [lastMoodCheckIn, setLastMoodCheckIn] = useState<string | null>(null)
  const [isMoodCheckedToday, setIsMoodCheckedToday] = useState(false)
  
  // Daily reset popup state
  const [taskSummaryPopupOpen, setTaskSummaryPopupOpen] = useState(false)
  const [taskSummary, setTaskSummary] = useState<{
    completed: string[];
    not_completed: string[];
    total: number;
    completed_count: number;
    not_completed_count: number;
  } | null>(null)
  
  // Track if daily reset has been processed this session
  const [dailyResetProcessed, setDailyResetProcessed] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const { getToken } = useAuth();
  const supabase = useMemo(() => {
    if (isLoaded) {
      return createClient(getToken);
    }
    return null;
  }, [isLoaded, getToken]);

  // Update user's last activity time, timezone, and email
  const updateUserActivity = useCallback(async () => {
    if (!user || !supabase) return
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const userEmail = user.primaryEmailAddress?.emailAddress
      
      // First check if user stats exist
      const existingStats = await getUserStats(supabase, user.id)
      
      if (!existingStats) {
        console.log('📝 No user stats found, will create new ones in loadData')
        return // Don't try to update if stats don't exist yet
      }
      
      const updates: Record<string, unknown> = {
        last_activity_at: new Date().toISOString(),
        timezone: timezone
      }
      
      // Add email if we have it and it's not already set
      if (userEmail && !existingStats.email) {
        updates.email = userEmail
      }
      
      await updateUserStats(supabase, user.id, updates)
      console.log('🕐 Updated user activity timestamp, timezone, and email:', { timezone, email: userEmail })
    } catch (error) {
      console.error('Error updating user activity:', error)
    }
  }, [user, supabase])

  const loadData = useCallback(async () => {
    console.log('🔄 loadData called with:', { 
      hasUser: !!user, 
      userId: user?.id, 
      hasSupabase: !!supabase,
      isLoaded 
    })
    
    if (user && supabase && !isLoadingData) {
      setIsLoadingData(true)
      try {
        console.log('🔄 Fetching data for user:', user.id)
        
        // Get tasks first
        const fetchedTasks = await getTasks(supabase, user.id)
        
        // Get user stats, create if they don't exist
        let fetchedUserStats = await getUserStats(supabase, user.id)
        if (!fetchedUserStats) {
          console.log('📝 Creating new user stats for new user')
          setIsNewUser(true)
          const userEmail = user.primaryEmailAddress?.emailAddress
          fetchedUserStats = await createUserStats(supabase, user.id, userEmail)
        }
        
        // Update user activity AFTER user stats are created
        await updateUserActivity()
        
        console.log('📊 Fetched data:', {
          tasksCount: fetchedTasks.length,
          hasUserStats: !!fetchedUserStats,
          userStatsDetails: fetchedUserStats ? {
            userId: fetchedUserStats.userId,
            lastCompletedDate: fetchedUserStats.last_completed_date,
            allTimeCompleted: fetchedUserStats.all_time_completed,
            subscriptionLevel: fetchedUserStats.subscription_level
          } : null
        })
        
        console.log('📊 Loaded tasks from database:', fetchedTasks.length)
        console.log('📊 Tasks:', fetchedTasks.filter((t: Task | null) => t).map((t: Task) => ({ id: t.id, title: t.title, completed: t.completed })))
        
        // Filter out null tasks and tasks with null IDs
        const validTasks = fetchedTasks.filter((task: Task) => task && task.id && task.id !== 'null')
        console.log('📊 Valid tasks (including null IDs):', validTasks.length)
        
        // Separate active and completed tasks
        const activeTasks = validTasks.filter((task: Task) => !task.completed)
        const completedTasks = validTasks.filter((task: Task) => task.completed)
        
        console.log('📊 Active tasks:', activeTasks.length)
        console.log('📊 Completed tasks:', completedTasks.length)
        
        setTasks(activeTasks)
        setCompletedTasks(completedTasks)
        setUserStats(fetchedUserStats)
        
        // Check for task summary from daily reset (if column exists)
        if (fetchedUserStats?.last_task_summary) {
          try {
            const summary = JSON.parse(fetchedUserStats.last_task_summary)
            if (summary && (summary.completed_count > 0 || summary.missed_count > 0)) {
              console.log('📊 Found task summary from daily reset:', summary)
              setTaskSummary(summary)
              setTaskSummaryPopupOpen(true)
            }
          } catch (error) {
            console.log('⚠️ Task summary column may not exist, skipping popup')
          }
        }
        
        // Set current mood from database
        if (fetchedUserStats?.user_mood) {
          console.log('🎭 Setting current mood from database:', fetchedUserStats.user_mood)
          setCurrentMood(fetchedUserStats.user_mood)
        } else {
          console.log('🎭 No mood found in database, keeping default:', currentMood)
        }
        
        // Check if user needs daily reset (24 hours since last reset)
        // Only process once per session to prevent spam
        // Skip for brand new users (first time loading)
        if (fetchedUserStats?.last_daily_reset && !dailyResetProcessed && !isNewUser && fetchedUserStats.all_time_completed > 0) {
          const lastReset = new Date(fetchedUserStats.last_daily_reset)
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          
          console.log('🕐 Daily reset check:', {
            lastReset: lastReset.toISOString(),
            twentyFourHoursAgo: twentyFourHoursAgo.toISOString(),
            needsReset: lastReset < twentyFourHoursAgo,
            allTimeCompleted: fetchedUserStats.all_time_completed,
            isNewUser: fetchedUserStats.all_time_completed === 0
          })
          
          // Only show popup for users who have actually completed tasks before
          // This prevents showing the popup to brand new users
          if (lastReset < twentyFourHoursAgo && fetchedUserStats.all_time_completed > 0) {
            console.log('🔄 User needs daily reset, updating limits...')
            
            // Reset daily limits (only the fields that exist)
            const updatedStats = {
              ...fetchedUserStats,
              mood_checkins_today: 0,
              ai_splits_today: 0,
              last_daily_reset: new Date().toISOString()
            }
            
            await updateUserStats(supabase, user.id, updatedStats)
            setUserStats(updatedStats)
            
            // Show task progress popup
            const lastVisit = lastReset.toISOString()
            const currentDate = new Date().toISOString()
            
            // Get tasks that were active during the last visit period
            const allTasks = [...activeTasks, ...completedTasks]
            const tasksFromLastVisit = allTasks.filter(task => {
              const taskDate = new Date(task.createdAt)
              return taskDate >= lastReset
            })
            
            const completedSinceLastVisit = tasksFromLastVisit.filter(task => task.completed)
            const incompleteSinceLastVisit = tasksFromLastVisit.filter(task => !task.completed)
            
            setLastVisitDate(lastVisit)
            setTasksSinceLastVisit({
              completed: completedSinceLastVisit,
              incomplete: incompleteSinceLastVisit
            })
            setTaskProgressPopupOpen(true)
            
            // Mark daily reset as processed for this session
            setDailyResetProcessed(true)
            
            console.log('📊 Task progress popup data:', {
              lastVisit,
              completedCount: completedSinceLastVisit.length,
              incompleteCount: incompleteSinceLastVisit.length
            })
          } else if (lastReset < twentyFourHoursAgo && fetchedUserStats.all_time_completed === 0) {
            // For new users who need a reset, just update the timestamp without showing popup
            console.log('🔄 New user needs daily reset, updating timestamp only...')
            
            const updatedStats = {
              ...fetchedUserStats,
              mood_checkins_today: 0,
              ai_splits_today: 0,
              last_daily_reset: new Date().toISOString()
            }
            
            await updateUserStats(supabase, user.id, updatedStats)
            setUserStats(updatedStats)
            setDailyResetProcessed(true)
          }
        }
        
        console.log('🔍 User stats check:', {
          hasUserStats: !!fetchedUserStats,
          lastCompletedDate: fetchedUserStats?.last_completed_date,
          allTimeCompleted: fetchedUserStats?.all_time_completed,
          userId: user?.id
        })
        
        // Show onboarding for new users (no tasks and no completed tasks in stats)
        const isNewUserCheck = (fetchedUserStats?.all_time_completed === 0 || !fetchedUserStats?.all_time_completed) && fetchedTasks.length === 0
        setIsNewUser(isNewUserCheck)
        
        console.log('🔍 Onboarding check:', {
          hasUserStats: !!fetchedUserStats,
          lastCompletedDate: fetchedUserStats?.last_completed_date,
          allTimeCompleted: fetchedUserStats?.all_time_completed,
          tasksLength: fetchedTasks.length,
          shouldShowOnboarding: isNewUserCheck,
          isNewUser: isNewUserCheck
        })
        
        if (isNewUserCheck) {
          console.log('🚨 Triggering onboarding modal - new user with no completed tasks')
          setOnboardingModalOpen(true)
        } else if (fetchedUserStats?.all_time_completed === 0 && fetchedTasks.length > 0) {
          console.log('🔧 User has tasks but no completed tasks - setting last_completed_date')
          // Set the last_completed_date to today if user has tasks but no completed tasks
          const today = new Date().toISOString().split('T')[0]
          setUserStats(prev => prev ? { ...prev, last_completed_date: today } : null)
        }
      } catch (error) {
        console.error('Error loading data from database:', error)
        
        // Only show error toast for non-new-user errors
        if (isNewUser) {
          console.log('🆕 New user detected, suppressing error toast')
        } else {
          toast.error('Could not load your data. Please try again.')
        }
      } finally {
        setIsLoadingData(false)
      }
    }
  }, [user, supabase, updateUserActivity])

  useEffect(() => {
    if (user && supabase && isLoaded) {
      // Reset daily reset processed state for new user
      setDailyResetProcessed(false)
      loadData()
    }
  }, [user?.id, supabase, isLoaded]) // Only depend on user ID, not the entire user object

  // Remove the problematic fixCompletedTasks useEffect that's causing infinite loops
  // const fixCompletedTasks = useCallback(async () => {
  //   // ... removed to prevent infinite loops
  // }, [user, supabase, userStats, loadData])

  const saveUserStats = useCallback(async () => {
    if (user && userStats && supabase) {
      try {
        await updateUserStats(supabase, user.id, userStats)
      } catch (error) {
        console.error('Error saving user stats to database:', error)
      }
    }
  }, [user, userStats, supabase])

  useEffect(() => {
    const saveTimer = setTimeout(() => saveUserStats(), 2000)
    return () => clearTimeout(saveTimer)
  }, [saveUserStats])

  // Calculate progress and mood
  useEffect(() => {
    const allTimeCompleted = userStats?.all_time_completed || 0
    if (allTimeCompleted < 10) {
      setProgress(allTimeCompleted)
      setMaxProgress(10)
      setCactusMood('sad')
    } else if (allTimeCompleted < 25) {
      setProgress(allTimeCompleted - 10)
      setMaxProgress(15)
      setCactusMood('neutral')
    } else {
      setProgress(allTimeCompleted - 25)
      setMaxProgress(20)
      setCactusMood('happy')
    }
  }, [userStats?.all_time_completed])

  // AI Motivational Support (Pro feature)
  useEffect(() => {
    if (userStats?.subscription_level === 'pro' && tasks.length > 0) {
      const updateMotivationalMessage = async () => {
        try {
          const message = await getMotivationalMessage(cactusMood, tasks.filter(t => t.completed).length)
          setMotivationalMessage(message)
        } catch (error) {
          console.error("Error getting motivational message:", error)
        }
    }
      updateMotivationalMessage()
    }
  }, [userStats?.subscription_level, cactusMood, tasks])

  // AI Quick Win Suggestion (Pro feature)
  useEffect(() => {
    if (userStats?.subscription_level === 'pro' && tasks.length > 0) {
      const updateQuickWin = async () => {
        try {
          const incompleteTasks = tasks.filter(t => !t.completed).map(t => t.title)
          if (incompleteTasks.length > 0) {
            const suggestion = await suggestQuickWin(incompleteTasks)
            setQuickWinSuggestion(suggestion)
          }
        } catch (error) {
          console.error("Error getting quick win suggestion:", error)
        }
      }
      updateQuickWin()
    }
  }, [userStats?.subscription_level, tasks])

  const handleTaskUpdate = useCallback(
    async (task: Task, updates: Partial<Task>) => {
      if (!supabase || !user) return;
      
      console.log('🔄 handleTaskUpdate called for task:', { 
        id: task.id, 
        title: task.title, 
        updates
      })
      
      // Track if this is a completion state change
      const wasCompleted = task.completed;
      const willBeCompleted = updates.completed;
      const isCompletionChange = wasCompleted !== willBeCompleted;
      
      // Update local state immediately for better UX
      if (isCompletionChange) {
        if (willBeCompleted) {
          // Move task to completed list
          setTasks(prevTasks => prevTasks.filter(t => {
            if (task.id && task.id !== 'null') {
              return t.id !== task.id
            } else {
              return t.title !== task.title // Use title for null IDs
            }
          }))
          setCompletedTasks(prevCompleted => [{ ...task, completed: true }, ...prevCompleted])
          
          // Add to undo stack
          setUndoStack(prev => [...prev, { 
            action: 'complete', 
            task: { ...task, completed: true }, 
            timestamp: Date.now() 
          }])
          setShowGlobalUndo(true)
          setTimeout(() => setShowGlobalUndo(false), 10000)
        } else {
          // Move task back to active list
          setCompletedTasks(prevCompleted => prevCompleted.filter(t => {
            if (task.id && task.id !== 'null') {
              return t.id !== task.id
            } else {
              return t.title !== task.title // Use title for null IDs
            }
          }))
          setTasks(prevTasks => [{ ...task, completed: false }, ...prevTasks])
        }
        
        // Update user stats
        const today = new Date().toISOString().split('T')[0]
        setUserStats(prevStats => {
          if (!prevStats) return null
          const isNewDay = prevStats.last_completed_date !== today
          
          const newStats = willBeCompleted ? {
            ...prevStats,
            all_time_completed: (prevStats.all_time_completed || 0) + 1,
            completed_today: isNewDay ? 1 : (prevStats.completed_today || 0) + 1,
            current_streak: isNewDay ? (prevStats.current_streak || 0) + 1 : prevStats.current_streak || 1,
            last_completed_date: today,
          } : {
            ...prevStats,
            all_time_completed: Math.max(0, (prevStats.all_time_completed || 0) - 1),
            completed_today: Math.max(0, (prevStats.completed_today || 0) - 1),
            current_streak: Math.max(0, (prevStats.current_streak || 0) - 1),
          }
          
          // Save to database in background
          updateUserStats(supabase, user.id, newStats).catch(error => {
            console.error('Error saving user stats:', error)
          })
          
          // Check if this is the first task completion
          if (willBeCompleted && (prevStats?.all_time_completed || 0) === 0) {
            setTimeout(() => setFirstTaskCelebrationOpen(true), 1000)
          }
          
          return newStats
        })
      } else {
        // Regular updates (like title changes)
        setTasks(prevTasks =>
          prevTasks.map(t => {
            if (task.id && task.id !== 'null') {
              return t.id === task.id ? { ...t, ...updates } : t
            } else {
              return t.title === task.title ? { ...t, ...updates } : t
            }
          })
        )
        setCompletedTasks(prevCompleted =>
          prevCompleted.map(t => {
            if (task.id && task.id !== 'null') {
              return t.id === task.id ? { ...t, ...updates } : t
            } else {
              return t.title === task.title ? { ...t, ...updates } : t
            }
          })
        )
      }
      
      // Single database update
      try {
        let updateResult = null
        if (task.id && task.id !== 'null' && !task.id.startsWith('temp_')) {
          updateResult = await updateTask(supabase, task.id, updates)
        } else {
          updateResult = await updateTaskByTitle(supabase, user.id, task.title, updates)
        }
        
        // If database update failed, show a warning but don't break the UI
        if (!updateResult) {
          console.warn('⚠️ Database update failed, but UI state is preserved')
          // Don't show error toast to avoid annoying the user
        }
      } catch (error) {
        console.error('Error updating task in database:', error)
        // Don't show error toast to avoid annoying the user
        // The UI state is already updated, so the user experience is preserved
      }
    },
    [supabase, user]
  )

  const addTask = useCallback(
    async (text: string) => {
      console.log('🚀 addTask called with:', text)
      console.log('👤 user:', user?.id)
      console.log('🗄️ supabase:', !!supabase)
      
      if (!user || !supabase) {
        console.log('❌ Missing user or supabase')
        return
      }

      try {
        console.log('📝 Creating task...')
        const newTask = await createTask(supabase, user.id, text, false)
        console.log('✅ Task created:', newTask)
        
        if (newTask) {
          console.log('📋 Adding task to state...')
          
          // Add to undo stack
          setUndoStack(prev => [...prev, { 
            action: 'create', 
            task: newTask, 
            timestamp: Date.now() 
          }])
          
          // Mark task as animating
          const animatingId = newTask.id || `${newTask.title}-${Date.now()}`
          setAnimatingTasks(prev => new Set(prev).add(animatingId))
          
          // Add task to state with smooth animation
          setTasks(prevTasks => [newTask, ...prevTasks])
          // setSubmittedTask(text) // Removed as per edit hint
          // setTimeout(() => setSubmittedTask(null), 5000) // Removed as per edit hint
          console.log('🎉 Task added successfully to UI')
          
          // Remove from animating after animation completes
          setTimeout(() => {
            setAnimatingTasks(prev => {
              const newSet = new Set(prev)
              newSet.delete(animatingId)
              return newSet
            })
          }, 800)
          } else {
          console.log('❌ Task creation returned null')
          throw new Error('Task creation failed')
        }
    } catch (error) {
        console.error('❌ Error adding task:', error)
        toast.error('Could not add your task. Please try again.')
      }
    },
    [user, supabase]
  )

  const handleDeleteTask = useCallback(
    async (task: Task) => {
      console.log('🗑️ handleDeleteTask called with task:', task)
      if (!supabase) return;
      
      // Store the task for potential undo
      setLastDeletedTask(task)
      
      // Add to undo stack
      setUndoStack(prev => [...prev, { 
        action: 'delete', 
        task: task, 
        timestamp: Date.now() 
      }])
      
      // Show global undo button
      setShowGlobalUndo(true)
      setTimeout(() => setShowGlobalUndo(false), 5000)
      
      // Always remove from local state immediately for better UX
      setTasks(prevTasks => prevTasks.filter(t => {
        if (task.id && task.id !== 'null') {
          return t.id !== task.id
        } else {
          return t !== task // Use object reference for null IDs
        }
      }))
      
      // Also remove from completed tasks if it's there
      setCompletedTasks(prevCompleted => prevCompleted.filter(t => {
        if (task.id && task.id !== 'null') {
          return t.id !== task.id
        } else {
          return t !== task // Use object reference for null IDs
        }
      }))
      
      // Update user stats if we're deleting a completed task
      if (task.completed) {
        console.log('📊 Updating user stats - removing completed task from count')
        setUserStats(prevStats => {
          if (!prevStats) return null
          const newStats = {
            ...prevStats,
            all_time_completed: Math.max(0, (prevStats.all_time_completed || 0) - 1),
            completed_today: Math.max(0, (prevStats.completed_today || 0) - 1),
            current_streak: Math.max(0, (prevStats.current_streak || 0) - 1),
          }
          
          // Immediately save to database
          if (user && supabase) {
            updateUserStats(supabase, user.id, newStats).catch(error => {
              console.error('Error saving user stats:', error)
            })
          }
          
          return newStats
        })
      }
      
      // Try to delete from database in the background
      try {
        if (!task.id || task.id === 'null') {
          // For tasks with null IDs, delete by userId and title
          if (!user) {
            console.error('❌ Cannot delete task - user is null')
            return
          }
          console.log('🗄️ Deleting task with null ID by title:', task.title)
          const deleteSuccess = await deleteTaskByTitle(supabase, user.id, task.title)
          
          if (deleteSuccess) {
            console.log('✅ Task with null ID deleted from database successfully')
          } else {
            console.error('❌ Database deletion failed for null ID task, but task removed from local state')
          }
        } else {
          // For tasks with valid IDs, delete by ID
          console.log('🗄️ Deleting task from database by ID:', task.id)
          const deleteSuccess = await deleteTaskFromDB(supabase, task.id)
          
          if (deleteSuccess) {
            console.log('✅ Task deleted from database successfully')
          } else {
            console.error('❌ Database deletion failed, but task removed from local state')
          }
        }
    } catch (error) {
        console.error('❌ Error deleting task from database:', error)
        // Don't show error to user since the task is already removed from UI
    }
    },
    [supabase]
  )



  const handlePrioritizeTasks = async () => {
    // This function is disabled since priority field doesn't exist in current schema
    toast.info('Task prioritization feature is not available in the current version.')
  }

  // Check if user has checked in today (for free users)
  const hasCheckedInToday = useCallback(() => {
    if (!userStats) {
      console.log('🎭 hasCheckedInToday: No userStats available')
      return false
    }
    
    // For Pro users, they can check in multiple times
    if (userStats.subscription_level === 'pro') {
      console.log('🎭 hasCheckedInToday: Pro user, always allow check-in')
      return false // Always allow Pro users to check in
    }
    
    // For free users, check if they've checked in today
    const checkInsToday = userStats.mood_checkins_today || 0
    const hasCheckedIn = checkInsToday > 0
    console.log('🎭 hasCheckedInToday:', { checkInsToday, hasCheckedIn, subscriptionLevel: userStats.subscription_level })
    return hasCheckedIn
  }, [userStats])

  // Check if user can change mood (Pro users can change multiple times per day)
  const canChangeMood = useCallback(() => {
    const isPro = userStats?.subscription_level === 'pro'
    return isPro || !hasCheckedInToday()
  }, [userStats?.subscription_level, hasCheckedInToday])

  const handleMoodChange = async (mood: 'energized' | 'focused' | 'neutral' | 'tired' | 'stressed') => {
    if (!user || !supabase) return
    
    try {
      // Check if user can perform mood check-in
      const canCheckIn = await canPerformMoodCheckIn(supabase, user.id)
      
      if (!canCheckIn) {
        toast.error('You can only check in once per day. Upgrade to Pro for unlimited check-ins!')
        setMoodCheckInOpen(false)
        return
      }
      
      setCurrentMood(mood)
      setMoodCheckInOpen(false)
      
      console.log('🎭 Mood changed to:', mood)
      
      // Set today's check-in date
      const today = new Date().toISOString().split('T')[0]
      setLastMoodCheckIn(today)
      setIsMoodCheckedToday(true)
      
      // Update user stats with new mood and increment check-in count
      if (userStats) {
        const currentCheckIns = userStats.mood_checkins_today || 0
        const newStats = { 
          ...userStats, 
          user_mood: mood,
          mood_checkins_today: currentCheckIns + 1
        }
        
        console.log('🎭 Updating user stats with new mood:', { mood, currentCheckIns, newCheckIns: currentCheckIns + 1 })
        
        // Update in database
        await updateUserStats(supabase, user.id, newStats)
        
        // Update local state
        setUserStats(newStats)
        
        console.log('🎭 User stats updated successfully')
      }
      
      // Get mood-based suggestions with smooth animation
      try {
        const suggestions = await suggestMoodBasedTasks(mood, completedTasks.length, tasks.map(t => t.title))
        
        // Smooth transition to show suggestions
        setMoodBasedSuggestions(null) // Clear first
        setTimeout(() => {
          setMoodBasedSuggestions(suggestions)
        }, 300) // Small delay for smooth transition
        
        toast.success(`Great! Here are some tasks perfect for your ${mood} mood!`)
      } catch (error) {
        console.error('Error getting mood-based suggestions:', error)
        toast.error('Could not get mood-based suggestions')
      }
    } catch (error) {
      console.error('Error updating mood:', error)
      toast.error('Failed to update mood. Please try again.')
    }
  }

  const handleAddMoodSuggestion = async (suggestion: string) => {
    if (!user || !supabase) return
    
    try {
              const newTask = await createTask(supabase, user.id, suggestion, false)
      if (newTask) {
        setTasks(prevTasks => [newTask, ...prevTasks])
        toast.success('Task added!')
      } else {
        toast.error('Could not create task')
      }
    } catch (error) {
      console.error('Error adding mood suggestion:', error)
      toast.error('Could not add task')
    }
  }

  const handleGlobalUndo = useCallback(async () => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    console.log('🔄 Global undo called for action:', lastAction.action, lastAction.task.title)
    
    switch (lastAction.action) {
      case 'create':
        // Remove the created task
        setTasks(prevTasks => prevTasks.filter(t => {
          if (lastAction.task.id && lastAction.task.id !== 'null') {
            return t.id !== lastAction.task.id
          } else {
            return t !== lastAction.task // Use object reference for null IDs
          }
        }))
        break;
      case 'delete':
        // Restore the deleted task
        if (supabase && user) {
          // Try to recreate in database (works for both null and valid IDs)
          try {
            await createTask(supabase, user.id, lastAction.task.title, false)
          } catch (error) {
            console.error('Error recreating task in database:', error)
          }
        }
        
        // If the task was completed, restore it to completed list and update stats
        if (lastAction.task.completed) {
          setCompletedTasks(prevCompleted => [lastAction.task, ...prevCompleted])
          
          // Update user stats - add back to completed count
          setUserStats(prevStats => {
            if (!prevStats) return null
            const newStats = {
              ...prevStats,
              all_time_completed: (prevStats.all_time_completed || 0) + 1,
              completed_today: (prevStats.completed_today || 0) + 1,
              current_streak: (prevStats.current_streak || 0) + 1,
            }
            
            // Immediately save to database
            if (user && supabase) {
              updateUserStats(supabase, user.id, newStats).catch(error => {
                console.error('Error saving user stats:', error)
              })
            }
            
            return newStats
          })
        } else {
          setTasks(prevTasks => [lastAction.task, ...prevTasks])
        }
        break;
      case 'complete':
        // Restore the completed task to active list
        const uncompletedTask = { ...lastAction.task, completed: false };
        setCompletedTasks(prevCompleted => prevCompleted.filter(t => {
          if (lastAction.task.id && lastAction.task.id !== 'null') {
            return t.id !== lastAction.task.id
        } else {
            return t !== lastAction.task // Use object reference for null IDs
          }
        }))
        setTasks(prevTasks => [uncompletedTask, ...prevTasks])
        
        // Update user stats - subtract from completed count
        setUserStats(prevStats => {
          if (!prevStats) return null
          const newStats = {
            ...prevStats,
            all_time_completed: Math.max(0, (prevStats.all_time_completed || 0) - 1),
            completed_today: Math.max(0, (prevStats.completed_today || 0) - 1),
            current_streak: Math.max(0, (prevStats.current_streak || 0) - 1),
          }
          
          // Immediately save to database
          if (user && supabase) {
            updateUserStats(supabase, user.id, newStats).catch(error => {
              console.error('Error saving user stats:', error)
            })
          }
          
          return newStats
        })
        break;
    }
    
    // Remove from undo stack
    setUndoStack(prev => prev.slice(0, -1))
    setShowGlobalUndo(false)
    
    toast.success('Action undone!')
  }, [undoStack, supabase, user])



  // Check if user can perform AI split
  const [canPerformAISplitState, setCanPerformAISplitState] = useState(true)

  // Check AI split limit on component mount and when user stats change
  useEffect(() => {
    const checkAISplitLimit = async () => {
      if (!user || !supabase) return
      
      try {
        const canSplit = await canPerformAISplit(supabase, user.id)
        setCanPerformAISplitState(canSplit)
      } catch (error) {
        console.error('Error checking AI split limit:', error)
        setCanPerformAISplitState(false)
      }
    }
    
    checkAISplitLimit()
  }, [user, supabase, userStats])

  // Increment AI split count
  const handleIncrementAISplit = async () => {
    if (!user || !supabase) return
    
    try {
      await incrementAISplit(supabase, user.id)
      setCanPerformAISplitState(false) // Disable after use
    } catch (error) {
      console.error('Error incrementing AI split count:', error)
    }
  }

  const handleFixCompletedTasks = async () => {
    if (!user || !supabase) return
    
    try {
      const loadingToast = toast.loading('Fixing completed tasks count...')
      const result = await fixCompletedTasksCount(supabase, user.id)
      
      // Dismiss the loading toast immediately
      toast.dismiss(loadingToast)
      
      if (result.fixed) {
        toast.success(`Fixed! Updated from ${result.oldCount} to ${result.newCount} completed tasks`)
        await loadData() // Refresh data to show updated stats
      } else {
        toast.success('Completed tasks count is already correct!')
      }
    } catch (error) {
      console.error('Error fixing completed tasks count:', error)
      toast.error('Failed to fix completed tasks count')
    }
  }

  const handleAddMultipleTasks = async (taskTexts: string[], isSplitTasks = false) => {
    if (!user || !supabase) {
      console.error('❌ Missing user or supabase in handleAddMultipleTasks')
      return;
    }
    
    console.log('🚀 handleAddMultipleTasks called with:', taskTexts, 'isSplitTasks:', isSplitTasks)
    console.log('👤 User ID:', user.id)
    console.log('🗄️ Supabase available:', !!supabase)
    
    try {
      console.log('📝 Creating tasks in database...')
      const newTasksPromises = taskTexts.map(text => createTask(supabase, user.id, text, isSplitTasks));
      const createdTasks = await Promise.all(newTasksPromises);
      const validTasks = createdTasks.filter((t: unknown): t is Task => t !== null);
      
      console.log('✅ Created tasks:', validTasks)
      console.log('📊 Valid tasks count:', validTasks.length)
      
      if (validTasks.length > 0) {
        console.log('📋 Adding tasks to local state...')
        setTasks(prev => {
          const newState = [...validTasks, ...prev];
          console.log('📊 New task count:', newState.length)
          return newState;
        });
        toast.success(`${validTasks.length} tasks added!`);
    } else {
        console.error('❌ No valid tasks were created')
        toast.error('No tasks were created. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error adding multiple tasks:', error);
      toast.error('Could not add all tasks. Please check and try again.');
    }
  };

  const handleSplitTask = useCallback(
    async (originalTask: Task, newTasks: string[]) => {
      console.log('✂️ handleSplitTask called:', { originalTask: originalTask.title, newTasks })
      
      if (!supabase || !user) {
        console.error('❌ Missing supabase or user in handleSplitTask')
        toast.error('Failed to split task. Please try again.')
        return
      }
      
      try {
        // First, mark the original task as hasBeenSplit in the database
        if (originalTask.id && originalTask.id !== 'null') {
          console.log('🔄 Marking original task as hasBeenSplit:', originalTask.title)
          await updateTask(supabase, originalTask.id, { hasBeenSplit: true })
        } else {
          console.log('🔄 Marking original task as hasBeenSplit by title:', originalTask.title)
          await updateTaskByTitle(supabase, user.id, originalTask.title, { hasBeenSplit: true })
        }
        console.log('✅ Original task marked as hasBeenSplit')
        
        // Delete the original task
        console.log('🗑️ Deleting original task:', originalTask.title)
        await handleDeleteTask(originalTask)
        console.log('✅ Original task deleted')
        
        // Add the new split tasks with hasBeenSplit flag
        console.log('🚀 Creating new split tasks:', newTasks)
        await handleAddMultipleTasks(newTasks, true)
        console.log('✅ New split tasks created')
        
        toast.success(`Split "${originalTask.title}" into ${newTasks.length} smaller tasks!`)
      } catch (error) {
        console.error('❌ Error in handleSplitTask:', error)
        toast.error('Failed to split task. Please try again.')
      }
    },
    [handleDeleteTask, handleAddMultipleTasks, supabase, user]
  )

  const getCactusMessage = () => {
    if (cactusMood === 'sad') return "I'm thirsty! Complete some tasks to help me grow."
    if (cactusMood === 'neutral') return "Keep up the great work! Let's reach the next level."
    if (cactusMood === 'happy') return "I'm feeling fantastic! You're doing an amazing job."
    return ''
  }

  const getNextMilestone = () => {
    if (cactusMood === 'sad') return 10
    if (cactusMood === 'neutral') return 25
    return 'Max'
  }



  const handleFirstTaskMoodCheckIn = useCallback((mood: 'energized' | 'focused' | 'neutral' | 'tired' | 'stressed') => {
    handleMoodChange(mood)
    toast.success('Thanks for checking in! We\'ll send you a reminder tomorrow.')
  }, [handleMoodChange])

  // Task progress popup state
  const [taskProgressPopupOpen, setTaskProgressPopupOpen] = useState(false)
  const [lastVisitDate, setLastVisitDate] = useState<string>('')
  const [tasksSinceLastVisit, setTasksSinceLastVisit] = useState<{ completed: Task[], incomplete: Task[] }>({ completed: [], incomplete: [] })
  
  // Daily reset notification state
  const [showResetNotification, setShowResetNotification] = useState(false)
  const [isResetDue, setIsResetDue] = useState(false)
  const [isEmailDue, setIsEmailDue] = useState(false)

  if (!user || !isLoaded) {
  return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
          </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Sleek Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.img 
                src="/teyra-logo-64kb.png" 
                alt="Teyra logo" 
                className="w-8 h-8"
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.2 }}
              />
              <h1 className="text-xl font-semibold text-gray-900">Teyra</h1>
            </motion.div>
            
            <div className="flex items-center space-x-3">
              {/* Caged Pro Button */}
              <div className="relative cursor-not-allowed">
                {/* Cage overlay */}
                <div className="absolute inset-0 z-10 rounded-full overflow-hidden pointer-events-none">
                  <div className="w-full h-full" style={{
                    backgroundImage: `
                      linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                      linear-gradient(0deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '6px 6px'
                  }}></div>
                </div>
                
                <motion.button
                  disabled={true}
                  className="px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-full text-sm font-medium flex items-center space-x-2 shadow-lg cursor-not-allowed opacity-80"
                >
                  <Crown className="w-4 h-4" />
                  <span>🔒 Upgrade to Pro</span>
                </motion.button>
              </div>
              

              

              
              <motion.div 
                className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full px-4 py-2 border border-gray-200/50 shadow-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  onClick={() => setUserProfileOpen(true)}
                  className="flex items-center space-x-2 hover:bg-white/80 rounded-full p-1 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src={user.imageUrl} alt="User avatar" className="w-6 h-6 rounded-full" />
                  <span className="font-medium text-gray-700 text-sm">{user.firstName}</span>
                </motion.button>
            <SignOutButton>
                  <motion.button 
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                <LogOut className="w-4 h-4" />
                  </motion.button>
            </SignOutButton>
              </motion.div>
          </div>
        </div>
        </div>
      </motion.header>

      {/* Daily Reset Notification */}
      <DailyResetNotification
        isResetDue={isResetDue}
        isEmailDue={isEmailDue}
        onDismiss={() => setShowResetNotification(false)}
        onRefresh={() => {
          if (user && supabase) {
            loadData();
          }
        }}
      />

      {/* Daily Reset Popup */}
      <DailyResetPopup
        taskSummary={taskSummary}
        onClose={() => {
          setTaskSummaryPopupOpen(false)
          setTaskSummary(null)
          // Clear the task summary from database after showing popup
          if (user && supabase && userStats) {
            updateUserStats(supabase, user.id, { last_task_summary: '' })
          }
        }}
        onReflectionSubmit={async (reflection) => {
          console.log('Reflection submitted:', reflection)
          // You could save the reflection to the database here
          toast.success('Thank you for your reflection!')
        }}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Message */}
        <AnimatePresence>
          {onboardingModalOpen && (
            <OnboardingModal isOpen={onboardingModalOpen} onClose={() => setOnboardingModalOpen(false)} />
          )}
          {mikeIntroModalOpen && (
            <MikeIntroModal isOpen={mikeIntroModalOpen} onClose={() => setMikeIntroModalOpen(false)} />
          )}
          {firstTaskCelebrationOpen && (
                    <FirstTaskCelebration 
          isOpen={firstTaskCelebrationOpen} 
          onClose={() => setFirstTaskCelebrationOpen(false)} 
          onMoodCheckIn={handleFirstTaskMoodCheckIn}
        />
          )}
        </AnimatePresence>
        
        {/* Mood Check-in Area - Dedicated space above main content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-3xl p-8 border border-pink-200/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🎭</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">How are you feeling today?</h3>
                  <p className="text-gray-600">
                    {userStats?.subscription_level === 'pro' 
                      ? 'Pro: Change mood anytime for personalized suggestions' 
                      : 'Free: Check in once per day for mood-based tasks'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current mood</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{currentMood}</p>
                  {hasCheckedInToday() && userStats?.subscription_level !== 'pro' && (
                    <p className="text-xs text-gray-400">Checked in today</p>
                  )}
                </div>
                <motion.button
                  onClick={() => {
                    if (canChangeMood()) {
                      setMoodCheckInOpen(true)
                    } else {
                      toast.info('Free users can only check in once per day. Upgrade to Pro for unlimited mood changes!')
                    }
                  }}
                  disabled={!canChangeMood()}
                  className={`px-8 py-3 rounded-full font-medium transition-all duration-200 shadow-lg ${
                    canChangeMood()
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  whileHover={canChangeMood() ? { scale: 1.05 } : {}}
                  whileTap={canChangeMood() ? { scale: 0.95 } : {}}
                >
                  {hasCheckedInToday() && userStats?.subscription_level !== 'pro' ? 'Checked In' : 'Check In'}
                </motion.button>
              </div>
            </div>
            
            {/* Mood-based suggestions */}
            <AnimatePresence mode="wait">
              {moodBasedSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeOut",
                    height: { duration: 0.4 }
                  }}
                  className="mt-6 pt-6 border-t border-pink-200/50 overflow-hidden"
                >
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-gray-700 font-medium mb-4"
                  >
                    {moodBasedSuggestions.message}
                  </motion.p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {moodBasedSuggestions.suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: 0.3 + index * 0.1,
                          duration: 0.4,
                          ease: "easeOut"
                        }}
                        onClick={() => handleAddMoodSuggestion(suggestion)}
                        className="p-4 bg-white/60 rounded-xl border border-pink-200/50 hover:bg-white/80 transition-all duration-200 text-left group"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-2">
                          <motion.span 
                            className="text-pink-500 group-hover:text-pink-600"
                            whileHover={{ scale: 1.2 }}
                          >
                            +
                          </motion.span>
                          <span className="text-sm text-gray-800">{suggestion}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Mike - The Main Star */}
          <div className="lg:col-span-5 lg:col-start-1">
            <div className="sticky top-24">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
              >
                {/* Enhanced blob background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-[3rem] blur-2xl opacity-70"></div>
                
                <div className="relative bg-white/90 backdrop-blur-xl rounded-[3rem] p-16 border border-white/30 shadow-2xl">
                  {/* Header Section */}
                  <div className="text-center mb-20">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ 
                        duration: 6, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="text-5xl mb-6"
                    >
                      🌵
                    </motion.div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">Mike</h2>
                    <p className="text-gray-600 text-xl font-medium">Your productivity companion</p>
                  </div>
            
                  {/* Cactus Display */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.03, 1],
                      y: [0, -5, 0]
                    }}
                    transition={{ 
                      duration: 10, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="mb-20 flex justify-center"
                  >
                                      <div className="scale-200 transform">
                    <Cactus 
                      mood={cactusMood} 
                      todayCompletedTasks={completedTasks.map(task => ({
                        title: task.title,
                        completedAt: task.completedAt
                      }))}
                    />
                  </div>
                  </motion.div>

                  {/* Progress Section */}
                  <div className="space-y-16">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-10">Your Progress</h3>
                      <div className="flex justify-center mb-12">
              <AnimatedCircularProgressBar 
                progress={progress}
                maxProgress={maxProgress}
                          size={140}
                          strokeWidth={10}
              />
            </div>
          </div>
          
                    {/* Stats Cards */}
                    <div className="space-y-8">
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200/50 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-medium text-blue-600 mb-2">Current Progress</p>
                            <p className="text-3xl font-bold text-blue-900">
                              {progress}/{maxProgress}
                            </p>
                          </div>
                          <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">📈</span>
                          </div>
                        </div>
                      </motion.div>
                      
            <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200/50 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-medium text-green-600 mb-2">Next Milestone</p>
                            <p className="text-3xl font-bold text-green-900">
                              {getNextMilestone()} tasks
                            </p>
                          </div>
                          <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">🎯</span>
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-200/50 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-medium text-purple-600 mb-2">Total Completed</p>
                            <p className="text-3xl font-bold text-purple-900">
                              {userStats?.all_time_completed || 0}
                            </p>
                          </div>
                          <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">🏆</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Daily Countdown Timer */}
                    <DailyCountdownTimer
                      lastDailyReset={userStats?.last_daily_reset || null}
                      lastActivityAt={userStats?.last_activity_at || null}
                      timezone={userStats?.timezone || 'UTC'}
                      isNewUser={isNewUser}
                      onResetDue={(isDue) => {
                        setIsResetDue(isDue);
                        if (isDue) {
                          setShowResetNotification(true);
                        }
                      }}
                      onEmailDue={(isDue) => {
                        setIsEmailDue(isDue);
                        if (isDue) {
                          setShowResetNotification(true);
                        }
                      }}
                    />
                    
                    {/* Motivational Message */}
                    {userStats?.subscription_level === 'pro' && motivationalMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-200/50"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-base">💬</span>
              </div>
                          <div>
                            <p className="text-base font-medium text-yellow-800 mb-2">Mike says:</p>
                            <p className="text-gray-700 text-base leading-relaxed">{motivationalMessage}</p>
                          </div>
                        </div>
            </motion.div>
          )}
                    
                    {/* Help Section for New Users */}
                    {(!userStats?.last_completed_date || userStats.all_time_completed === 0) && (
            <motion.div
                        initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200/50"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm">💡</span>
              </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-green-800">Quick Tips:</p>
                            <ul className="text-xs text-green-700 space-y-1">
                              <li>• Add tasks in the input box to the right</li>
                              <li>• Click the checkbox to complete tasks</li>
                              <li>• Watch Mike grow happier as you progress</li>
                            </ul>
                          </div>
                        </div>
            </motion.div>
          )}
                  </div>
                </div>
              </motion.div>
            </div>
        </div>

          {/* Task Section */}
          <div className="lg:col-span-7 lg:col-start-6 space-y-8">
            {/* Task Input */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative"
            >
              {/* Blob background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 rounded-[2rem] blur-xl opacity-60"></div>
              
              <div className="relative bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/20 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
                  <div className="flex items-center space-x-2">
                    <motion.span 
                      className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {tasks.length} active
                    </motion.span>
                    
                    {/* Fix Completed Tasks Button */}
                    <motion.button
                      onClick={handleFixCompletedTasks}
                      className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Fix completed tasks count to match actual completed tasks"
                    >
                      🔧 Fix
                    </motion.button>
                    
                    {/* Global Undo Button */}
                    <AnimatePresence>
                      {showGlobalUndo && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8, x: 20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: 20 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          onClick={() => handleGlobalUndo()}
                          className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Undo</span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
        </div>

                <div ref={taskInputRef}>
                  <TaskInput onSubmit={addTask} />
        </div>
              </div>
            </motion.div>

            {/* Active Tasks List */}
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="relative"
            >
              {/* Blob background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-[2rem] blur-xl opacity-60"></div>
              
              <div className="relative bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/20 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Active Tasks</h3>
                  <motion.span 
                    className="text-sm text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {tasks.length} remaining
                  </motion.span>
                </div>
                
                <div ref={tasksListRef} className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {tasks.map((task, index) => (
                      <motion.div
                        key={task.id || `${task.title}-${index}`}
                        layout
                        initial={{ 
                          opacity: 0, 
                          y: 20, 
                          scale: 0.95,
                          rotateX: -15
                        }}
                        animate={{ 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          rotateX: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.95,
                          transition: { duration: 0.3, ease: "easeOut" }
                        }}
                        transition={{ 
                          duration: 0.5, 
                          ease: "easeOut",
                          delay: index * 0.1,
                          type: "spring",
                          stiffness: 100,
                          damping: 15
                        }}
                        whileHover={{ 
                          scale: 1.02,
                          transition: { duration: 0.2 }
                        }}
              >
                <TaskCard
                  task={task}
                          onUpdate={handleTaskUpdate}
                          onDelete={handleDeleteTask}
                          onSplitTask={handleSplitTask}
                          userMood={cactusMood}
                          isDev={false}
                          canPerformAISplit={canPerformAISplitState}
                          onIncrementAISplit={handleIncrementAISplit}
                          onShowSubscription={() => setSubscriptionModalOpen(true)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tasks.length === 0 && (
            <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-center py-12"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 4, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                        className="text-6xl mb-4"
                      >
                        🌵
                      </motion.div>
                      <p className="text-gray-500 text-lg">No tasks yet! Add your first task above.</p>
                      <p className="text-gray-400 text-sm mt-2">Mike is waiting for you to get started!</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                className="relative"
              >
                {/* Blob background */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-[2rem] blur-xl opacity-60"></div>
                
                <div className="relative bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/20 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Completed Today</h3>
                    <motion.span 
                      className="text-sm text-gray-500 bg-green-100 px-3 py-1 rounded-full"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {completedTasks.length} completed
                    </motion.span>
                  </div>
                  
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {completedTasks.map((task, index) => (
                        <motion.div
                          key={task.id || `completed-${task.title}-${index}`}
                          layout
                          initial={{ 
                            opacity: 0, 
                            y: 20, 
                            scale: 0.95,
                            rotateX: 15
                          }}
                          animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                            rotateX: 0
                          }}
                          exit={{ 
                            opacity: 0, 
                            scale: 0.95,
                            transition: { duration: 0.3, ease: "easeOut" }
                          }}
                          transition={{ 
                            duration: 0.5, 
                            ease: "easeOut",
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 100,
                            damping: 15
                          }}
                          className="bg-green-50/50 border border-green-200/50 rounded-2xl p-4"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-lg bg-green-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-gray-700 text-sm line-through">{task.title}</span>
                            <motion.button
                              onClick={async () => {
                                // Update in database first
                                if (supabase && user) {
                                  try {
                                    if (task.id && task.id !== 'null') {
                                      await updateTask(supabase, task.id, { completed: false })
                                    } else {
                                      await updateTaskByTitle(supabase, user.id, task.title, { completed: false })
                                    }
                                  } catch (error) {
                                    console.error('Error updating task in database:', error)
                                  }
                                }
                                // Then update local state
                                handleTaskUpdate(task, { completed: false })
                              }}
                              className="ml-auto p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-all duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {userProfileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setUserProfileOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <UserProfile routing="hash" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OnboardingModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
      />

      <MikeIntroModal
        isOpen={mikeIntroModalOpen}
        onClose={() => setMikeIntroModalOpen(false)}
      />

      <MoodCheckIn
        currentMood={currentMood}
        onMoodChange={handleMoodChange}
        isOpen={moodCheckInOpen}
        onClose={() => setMoodCheckInOpen(false)}
      />

      {/* Caged Pro Subscription Modal */}
      <AnimatePresence>
        {subscriptionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSubscriptionModalOpen(false)}
          >
            {/* Cage overlay pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full" style={{
                backgroundImage: `
                  linear-gradient(90deg, #000 1px, transparent 1px),
                  linear-gradient(0deg, #000 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}></div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-purple-200/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cage bars around the modal */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px),
                    linear-gradient(0deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '15px 15px'
                }}></div>
              </div>
              
              <div className="relative text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg border-2 border-white">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">🔒 Pro Features Locked</h3>
                <p className="text-gray-600 text-sm">Unlock advanced AI features and priority support</p>
                
                <div className="space-y-3 text-left bg-gray-50/50 rounded-xl p-4 border border-gray-200/50">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-gray-700 font-medium">3x AI task splitting</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Mood-based suggestions</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Priority recommendations</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={() => {
                      alert('Pro upgrade coming soon!')
                      setSubscriptionModalOpen(false)
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🔓 Unlock Pro - $9/month
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TaskProgressPopup
        isOpen={taskProgressPopupOpen}
        onClose={() => setTaskProgressPopupOpen(false)}
        completedTasks={tasksSinceLastVisit.completed}
        incompleteTasks={tasksSinceLastVisit.incomplete}
        lastVisitDate={lastVisitDate}
        currentDate={new Date().toISOString()}
        onStartFresh={async () => {
          if (!user || !supabase) return
          await deleteAllTasks(supabase, user.id)
          setTasks([])
          setCompletedTasks([])
          setTaskProgressPopupOpen(false)
        }}
      />
    </div>
  )
} 