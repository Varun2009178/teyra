'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfToday, isSameYear, differenceInSeconds } from 'date-fns';
import { supabase } from '@/lib/supabase';

// --- Define Task Type ---
interface DailyTask {
  id: number;
  task_description: string;
  is_completed: boolean;
  xp_value: number | null; // Allow null if optional
  // Add other fields if needed
}

// Remove placeholder tasks array
// const placeholderTasks = [...];

interface CustomCalendarProps {}

// Define a more structured type for monthly tasks, mapping date strings to completion status
interface MonthlyTasksData {
  [dateString: string]: { is_completed: boolean };
}

const CustomCalendar: React.FC<CustomCalendarProps> = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  
  // --- State for Tasks ---
  // TodaysTasks is still useful for the popover content for the current day
  const [todaysTasks, setTodaysTasks] = useState<DailyTask[]>([]); 
  const [isInitialLoadingTasks, setIsInitialLoadingTasks] = useState(true); // For today's tasks popover
  const [taskError, setTaskError] = useState<string | null>(null); // For today's tasks popover

  // --- NEW: State for all tasks of the currently viewed month for styling days ---
  const [monthlyTasksData, setMonthlyTasksData] = useState<MonthlyTasksData>({});
  const [isLoadingMonthlyTasks, setIsLoadingMonthlyTasks] = useState(true);
  // --- End Task State ---

  // --- NEW: State for Countdown Timer ---
  const [nextTaskDueAt, setNextTaskDueAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isLoadingNextTaskDue, setIsLoadingNextTaskDue] = useState(true);
  // --- End Countdown Timer State ---

  // Add new state for user's start date
  const [userStartDate, setUserStartDate] = useState<Date | null>(null);

  // --- NEW: Polling state for new users ---
  const [isWaitingForFirstTasks, setIsWaitingForFirstTasks] = useState(false);
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('welcome') === 'true';

  const today = startOfToday();
  const router = useRouter();
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized date string for *today* (used for fetching today's tasks for popover, and comparison)
  const todayDateString = useMemo(() => format(startOfToday(), 'yyyy-MM-dd'), []);

  // Combined fetch function to avoid repetition
  const fetchAllCalendarData = useCallback(async () => {
    console.log("[Fetch] Grabbing all calendar data...");
    setIsLoadingMonthlyTasks(true);
    setIsInitialLoadingTasks(true);
    setIsLoadingNextTaskDue(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      // Fetch profile data (due time and start date)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('next_task_due_at, created_at')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) console.warn("[Fetch] Could not fetch profile data:", profileError.message);
      setNextTaskDueAt(profileData?.next_task_due_at ? new Date(profileData.next_task_due_at) : null);
      setUserStartDate(profileData?.created_at ? new Date(profileData.created_at) : null);

      // Fetch monthly tasks
      const monthStartDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEndDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const { data: monthTasks, error: monthError } = await supabase
        .from('daily_tasks')
        .select('assigned_date, is_completed')
        .eq('user_id', user.id)
        .gte('assigned_date', monthStartDate)
        .lte('assigned_date', monthEndDate);

      if (monthError) throw monthError;
      const newMonthlyData: MonthlyTasksData = {};
      monthTasks?.forEach(task => {
        if (task.assigned_date) newMonthlyData[task.assigned_date] = { is_completed: task.is_completed };
      });
      setMonthlyTasksData(newMonthlyData);

      // Check if today's tasks exist in the monthly fetch
      const todaysDataExists = todayDateString in newMonthlyData;
      return { todaysDataExists }; // Return success status

    } catch (err) {
      console.error("[Fetch] Error fetching calendar data:", err);
      setTaskError(err instanceof Error ? err.message : "Failed to load data.");
      return { todaysDataExists: false }; // Return failure status
    } finally {
      setIsLoadingMonthlyTasks(false);
      setIsInitialLoadingTasks(false);
      setIsLoadingNextTaskDue(false);
    }
  }, [currentMonth, todayDateString]);

  // Initial fetch and polling logic
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | undefined;

    const initialFetch = async () => {
      const { todaysDataExists } = await fetchAllCalendarData();
      // If it's a new user and tasks don't exist yet, start polling.
      if (isNewUser && !todaysDataExists) {
        setIsWaitingForFirstTasks(true);
        console.log("[Polling] New user detected and no tasks found. Starting to poll...");
        pollInterval = setInterval(async () => {
          console.log("[Polling] Checking for tasks...");
          const { todaysDataExists: foundTasks } = await fetchAllCalendarData();
          if (foundTasks) {
            console.log("[Polling] Tasks found! Stopping polling.");
            setIsWaitingForFirstTasks(false);
            clearInterval(pollInterval);
          }
        }, 2500); // Poll every 2.5 seconds
      }
    };

    initialFetch();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
    // isNewUser is stable, fetchAllCalendarData is memoized.
  }, [isNewUser, fetchAllCalendarData]); 

  // --- This useEffect now ONLY handles the countdown logic ---
  useEffect(() => {
    if (!nextTaskDueAt) {
      setTimeRemaining(null);
      return;
    }
    const intervalId = setInterval(() => {
      const secondsRemaining = differenceInSeconds(nextTaskDueAt, new Date());
      if (secondsRemaining <= 0) {
        setTimeRemaining("00:00:00");
        clearInterval(intervalId);
        return;
      }
      const hours = Math.floor(secondsRemaining / 3600);
      const minutes = Math.floor((secondsRemaining % 3600) / 60);
      const seconds = secondsRemaining % 60;
      setTimeRemaining(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [nextTaskDueAt]);

  // This effect is now just for fetching the popover tasks when needed.
  // It runs if the monthly data for today changes.
  const todayCompletedStatus = monthlyTasksData[todayDateString]?.is_completed;
  useEffect(() => {
    let isMounted = true;
    const fetchTodaysTasksForPopover = async () => {
        if (!isMounted) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase.from('daily_tasks').select('id, task_description, is_completed, xp_value').eq('user_id', user.id).eq('assigned_date', todayDateString);
            if (error) throw error;
            if (isMounted) setTodaysTasks(data || []);
        } catch (err) {
            if (isMounted) setTaskError(err instanceof Error ? err.message : "Error loading tasks");
        }
    };

    if (todayDateString in monthlyTasksData) {
      fetchTodaysTasksForPopover();
    }
    return () => { isMounted = false; };
  }, [todayDateString, todayCompletedStatus]);

  // --- Calculate allTasksCompleted status for TODAY (for popover and today's cell styling) ---
  const allTodaysTasksCompleted = useMemo(() => {
      const tasksForToday = monthlyTasksData[todayDateString];
      return tasksForToday ? tasksForToday.is_completed : false;
  }, [monthlyTasksData, todayDateString]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Update navigation logic
  const canGoToPreviousMonth = userStartDate ? currentMonth > userStartDate : false;
  const canGoToNextMonth = !isSameMonth(currentMonth, today) && currentMonth < today;

  const goToPrevMonth = () => {
    if (canGoToPreviousMonth) {
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  };

  const goToNextMonth = () => {
    if (canGoToNextMonth) {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const handleDayClick = (day: Date) => {
    if (isToday(day)) {
      router.push('/tasks');
    } else {
      // Optional: Navigate to a day-specific view or log page if tasks exist for that past day
      // console.log("Clicked on past day:", format(day, 'yyyy-MM-dd'));
      // Potentially useful if you implement a way to view details of past tasks
    }
  };

  // --- Hover Logic Refinement ---
  // Function to show the popover and clear any pending hide actions
  const showPopover = useCallback((day: Date) => {
    if (isToday(day)) { // Only allow hover for today
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setHoveredDay(day);
    }
  }, []); // Depends only on isToday

  // Function to start the timer to hide the popover
  const startHidePopoverTimer = useCallback(() => {
    // Clear any existing timer before setting a new one
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredDay(null);
    }, 150); // Slightly longer delay (150ms)
  }, []);

  // Function to cancel the hide timer (used when entering the popover)
  const cancelHidePopoverTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);
  // --- End Hover Logic ---

  // NEW: Add a top-level loading state for the calendar view
  if (isWaitingForFirstTasks) {
    return (
      <div className="w-full flex flex-col items-center justify-center text-center p-8 bg-neutral-900 rounded-lg h-[70vh]">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
            <Loader2 className="w-12 h-12 text-emerald-500 mb-4" />
        </motion.div>
        <h3 className="text-xl font-semibold text-white">Generating Your First Tasks</h3>
        <p className="text-neutral-400 mt-2">This will just take a moment...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-[#111111] text-white border border-neutral-800 rounded-lg p-4 md:p-6 shadow-lg relative">
      
      {/* Header: Month Navigation & Countdown Timer */}
      <div className="flex items-center justify-between mb-1 px-2">
        <button 
          onClick={goToPrevMonth} 
          disabled={!canGoToPreviousMonth}
          className="p-2 rounded-md text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          aria-label="Previous month"
          aria-disabled={!canGoToPreviousMonth}
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <h2 className="text-lg md:text-xl font-semibold tracking-tight text-neutral-100">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={goToNextMonth} 
          disabled={!canGoToNextMonth}
          className="p-2 rounded-md text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          aria-label="Next month"
          aria-disabled={!canGoToNextMonth}
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>

      {/* Countdown Timer Display */}
      {timeRemaining && (
        <div className="text-center mb-4 md:mb-6">
          <p className="text-sm text-neutral-400">Next task in:</p>
          <p className="text-2xl md:text-3xl font-bold text-green-400 tracking-wider">
            {timeRemaining}
          </p>
        </div>
      )}
      {!timeRemaining && !isLoadingNextTaskDue && (
         <div className="text-center mb-4 md:mb-6">
          <p className="text-sm text-neutral-500">Next task status loading...</p>
           {/* Or could be silent if nextTaskDueAt is legitimately null */}
        </div>
      )}

      {/* Grid: Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 border-b border-neutral-800 pb-2 px-1 md:px-2">
        {weekdays.map(day => (
          <div key={day} className="text-center text-xs md:text-sm font-medium text-[#888888] uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid: Days */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 px-1 md:px-2">
        {days.map(day => {
          const dayString = format(day, 'yyyy-MM-dd');
          const isCurrentDay = isToday(day);
          const isPastDay = isBefore(day, today) && !isCurrentDay;
          const isInCurrentMonth = isSameMonth(day, currentMonth);
          
          let dayStyle = 'text-white hover:bg-[#1a1a1a] cursor-pointer bg-[#000000]'; // Default for other days in month
          let isDisabled = !isInCurrentMonth;

          if (!isInCurrentMonth) {
            dayStyle = 'text-neutral-700 bg-transparent pointer-events-none';
          } else if (isCurrentDay) {
            dayStyle = allTodaysTasksCompleted 
              ? 'bg-emerald-700 border-emerald-600 font-bold text-white cursor-pointer hover:bg-emerald-600' // Completed Today
              : 'bg-neutral-800 border-neutral-600 font-bold text-white cursor-pointer hover:bg-neutral-700'; // Default Today
          } else if (isPastDay) {
            // If the day is after user's start date, it should be red unless completed
            if (userStartDate && day >= userStartDate) {
              const taskStatusForPastDay = monthlyTasksData[dayString];
              if (taskStatusForPastDay?.is_completed) {
                dayStyle = 'bg-emerald-800 opacity-70 hover:opacity-90 cursor-default'; // Completed Past Day (Greenish)
              } else {
                dayStyle = 'bg-red-700 hover:bg-red-600 text-white cursor-default opacity-80'; // Missed Past Day (Red)
              }
            } else {
              // Before user's start date
              dayStyle = 'text-white opacity-40 cursor-default bg-[#000000]';
            }
            isDisabled = true;
          } else {
            dayStyle = 'text-white opacity-60 cursor-default bg-[#000000]';
            isDisabled = true;
          }

          return (
            <div key={day.toString()} className="relative">
              <button
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => showPopover(day)}
                onMouseLeave={startHidePopoverTimer}
                disabled={isDisabled}
                className={`
                  aspect-square w-full flex items-center justify-center 
                  text-xs md:text-sm lg:text-base 
                  border border-transparent rounded-md 
                  transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:z-10 relative
                  ${dayStyle}
                `}
              >
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>

      {/* Task Popover - Update content based on completion */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            key="task-popover-global"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <div 
              className="w-72 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl p-4 text-left pointer-events-auto"
              onMouseEnter={cancelHidePopoverTimer}
              onMouseLeave={startHidePopoverTimer}
            >
              {/* Check if today is completed first */}
              {allTodaysTasksCompleted ? (
                <div className='text-center'>
                  <p className="text-emerald-400 font-semibold mb-1">✨ Well Done! ✨</p>
                  <p className="text-sm text-neutral-300">All tasks completed today.</p>
                </div>
              ) : (
                // Original popover content if not all completed
                <>
              <h4 className="text-md font-semibold mb-2 text-neutral-100">Today's Tasks:</h4>
                  {isInitialLoadingTasks ? (
                    <p className="text-sm text-neutral-400">Loading tasks...</p>
                  ) : taskError ? (
                    <p className="text-sm text-red-500">Error: {taskError}</p>
                  ) : todaysTasks.length > 0 ? (
              <ul className="list-disc list-inside space-y-1.5">
                      {/* Show only INCOMPLETE tasks in hover? Or all? Let's show all for now. */}
                      {todaysTasks.map((task) => (
                        <li key={task.id} className={`text-sm ${task.is_completed ? 'text-neutral-500 line-through' : 'text-neutral-300'}`}>
                          {task.task_description}
                  </li>
                ))}
              </ul>
                  ) : (
                     <p className="text-sm text-neutral-400">No tasks assigned for today yet.</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomCalendar; 