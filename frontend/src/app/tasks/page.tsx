'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { format, startOfToday } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SparklesIcon, ZapIcon, AlertTriangleIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DailyTask {
  id: number;
  task_description: string;
  is_completed: boolean;
  xp_value: number | null; 
  eco_score: number;
  isRevealed?: boolean;
}

const getRevealedTasksStorageKey = (dateStr: string) => `revealedTaskIds_${dateStr}`;

const lifestyleOptions = [
  { value: "mostly_at_home_student", label: "Mostly at home / student" },
  { value: "always_on_the_go_commuting", label: "Always on the go / commuting a lot" },
  { value: "office_workplace_every_day", label: "Office / workplace every day" },
  { value: "remote_hybrid_worker", label: "Remote or hybrid worker" },
  { value: "outdoor_active_lifestyle", label: "Outdoor / active lifestyle" },
];

const sustainabilityFocusOptions = [
  { value: "eating_sustainably", label: "Eating more sustainably" },
  { value: "reducing_plastic_use", label: "Reducing plastic use" },
  { value: "saving_energy", label: "Saving energy" },
  { value: "transportation_impact", label: "Transportation impact" },
  { value: "eco_friendly_shopping", label: "Eco-friendly shopping" },
];

const climateChallengesOptions = [
  { value: "heatwaves_fires", label: "Heatwaves or fires" },
  { value: "water_shortages", label: "Water shortages" },
  { value: "flooding", label: "Flooding" },
  { value: "cold_winters", label: "Cold winters" },
  { value: "not_sure", label: "Not sure" },
];

export default function TasksPage() {
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [taskToUndoId, setTaskToUndoId] = useState<number | null>(null);
  const [activeDateString, setActiveDateString] = useState(() => format(startOfToday(), 'yyyy-MM-dd'));
  const [profileLifestyle, setProfileLifestyle] = useState<string | null>(null);
  const [profileSustainabilityFocus, setProfileSustainabilityFocus] = useState<string[]>([]);
  const [profileClimateChallenges, setProfileClimateChallenges] = useState<string[]>([]);
  const [nextTaskDueAt, setNextTaskDueAt] = useState<Date | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!activeDateString) return;
      setIsInitialLoading(true);
      setError(null);
      setDailyTasks([]);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not logged in");

        const { data, error: dbError } = await supabase
          .from('daily_tasks')
          .select('id, task_description, is_completed, xp_value, eco_score')
          .eq('user_id', user.id)
          .eq('assigned_date', activeDateString)
          .order('created_at', { ascending: true });

        if (dbError) throw new Error("Could not load tasks.");

        const storageKey = getRevealedTasksStorageKey(activeDateString);
        const revealedIdsFromStorage = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const tasksWithRevealState = (data || []).map(task => ({ 
          ...task, 
          isRevealed: revealedIdsFromStorage.includes(task.id) || task.is_completed
        }));
        setDailyTasks(tasksWithRevealState);

      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsInitialLoading(false); 
      }
    };

    fetchTasks();
  }, [activeDateString]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('next_task_due_at, lifestyle, sustainability_focus, climate_challenges')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
            console.warn("[TasksPage Profile Fetch] Error fetching profile:", profileError.message);
        } else if (profileData) {
          setNextTaskDueAt(profileData.next_task_due_at ? new Date(profileData.next_task_due_at) : null);
          setProfileLifestyle(profileData.lifestyle);
          setProfileSustainabilityFocus(profileData.sustainability_focus || []);
          setProfileClimateChallenges(profileData.climate_challenges || []);
        }
      } catch (err) {
        console.error("[TasksPage Profile Fetch] Unexpected error:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  const actuallyToggleTaskStatus = async (taskId: number, newStatus: boolean) => {
    const originalTasks = [...dailyTasks];
    const taskToUpdate = dailyTasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    const ecoScoreChange = newStatus ? taskToUpdate.eco_score : -taskToUpdate.eco_score;

    setDailyTasks(prevTasks =>
      prevTasks.map(task => (task.id === taskId ? { ...task, is_completed: newStatus } : task))
    );

    try {
      const { error: updateError } = await supabase
        .from('daily_tasks')
        .update({ is_completed: newStatus })
        .eq('id', taskId);
      
      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated for score update.");

      const { error: rpcError } = await supabase.rpc('update_total_eco_score', {
        user_id_input: user.id,
        score_change: ecoScoreChange
      });

      if (rpcError) throw new Error("Failed to update total eco score.");

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred while updating the task.");
      setDailyTasks(originalTasks);
    }
  };

  const handleTaskToggle = (taskId: number, currentStatus: boolean) => {
    if (currentStatus) {
      setTaskToUndoId(taskId);
      setShowUndoConfirm(true);
    } else {
      actuallyToggleTaskStatus(taskId, true);
    }
  };
  
  const confirmUndoTask = () => {
    if (taskToUndoId !== null) {
      actuallyToggleTaskStatus(taskToUndoId, false);
    }
    setShowUndoConfirm(false);
    setTaskToUndoId(null);
  };

  const cancelUndoTask = () => {
    setShowUndoConfirm(false);
    setTaskToUndoId(null);
  };

  const toggleIndividualTaskReveal = (taskId: number) => {
    let taskWasRevealed = false;
    setDailyTasks(currentTasks =>
      currentTasks.map(task => {
        if (task.id === taskId && !task.isRevealed) {
          taskWasRevealed = true;
          return { ...task, isRevealed: true };
        }
        return task;
      })
    );

    if (taskWasRevealed) { 
      const storageKey = getRevealedTasksStorageKey(activeDateString);
      const revealedIdsFromStorage = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!revealedIdsFromStorage.includes(taskId)) {
        const updatedRevealedIds = [...revealedIdsFromStorage, taskId];
        localStorage.setItem(storageKey, JSON.stringify(updatedRevealedIds));
      }
    }
  };
  
  const allTasksCompleted = !isInitialLoading && dailyTasks.length > 0 && dailyTasks.every(task => task.is_completed);

  const getLabel = (value: string, options: Array<{ value: string; label: string }>): string => {
    return options.find(opt => opt.value === value)?.label.toLowerCase() || value.toLowerCase();
  };

  const personalizationPoints = useMemo(() => {
    const points: Array<{ type: string; label: string }> = [];
    if (profileLifestyle) {
      points.push({ type: 'lifestyle', label: getLabel(profileLifestyle, lifestyleOptions) });
    }
    profileSustainabilityFocus.forEach(focus => {
      points.push({ type: 'focus', label: getLabel(focus, sustainabilityFocusOptions) });
    });
    profileClimateChallenges.forEach(challenge => {
      points.push({ type: 'challenge', label: getLabel(challenge, climateChallengesOptions) });
    });
    return points;
  }, [profileLifestyle, profileSustainabilityFocus, profileClimateChallenges]);

  return (
    <>
      <div className="container mx-auto max-w-3xl px-4 py-12 flex flex-col items-center text-center min-h-[calc(100vh-8rem)] justify-start">
        <motion.h1 
          className="text-5xl font-extrabold mb-10 text-emerald-500"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Today's Tasks
        </motion.h1>

        {(isInitialLoading || isLoadingProfile) && <p className="text-neutral-400 py-4 text-lg">Preparing your tasks...</p>}
        
        {!isInitialLoading && !isLoadingProfile && personalizationPoints.length > 0 && (
          <motion.div 
            className="mb-12 w-full max-w-lg text-left text-2xl sm:text-3xl" 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="text-neutral-300 mb-2">Since you are:</p>
            <p className="text-emerald-300 ml-4">• a {personalizationPoints.find(p => p.type === 'lifestyle')?.label}</p>
            
            <p className="text-neutral-300 mt-4 mb-2">And you want to:</p>
            {personalizationPoints.filter(p => p.type === 'focus').map((point, idx) => (
              <p key={`focus-${idx}`} className="text-emerald-300 ml-4">• {point.label}</p>
            ))}
            <p className="text-emerald-300 ml-4">• be more motivated</p>

            {personalizationPoints.some(p => p.type === 'challenge') && (
              <>
                <p className="text-neutral-300 mt-4 mb-2">While being affected by:</p>
                {personalizationPoints.filter(p => p.type === 'challenge').map((point, idx) => (
                  <p key={`challenge-${idx}`} className="text-emerald-300 ml-4">• {point.label}</p>
                ))}
              </>
            )}
            <p className="text-neutral-300 mt-6">Here are your tasks:</p>
          </motion.div>
        )}

        {!isInitialLoading && !isLoadingProfile && error && <p className="text-red-500 py-4">Error: {error.toLowerCase()}</p>}

        {!isInitialLoading && !isLoadingProfile && !error && dailyTasks.length === 0 && (
          <motion.p 
            className="text-neutral-300 py-4 text-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          >
            No tasks assigned for today. Check back soon!
          </motion.p>
        )}

        <div className="w-full max-w-lg space-y-4 mt-2 text-left">
          <AnimatePresence>
            {!isInitialLoading && !isLoadingProfile && !error && dailyTasks.map((task, index) => (
              <motion.div
                key={task.id}
                layout 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 180, damping: 25 }}
                className="w-full"
              >
                {!task.isRevealed ? (
                  <Button 
                    variant="outline"
                    className="w-full justify-center py-6 text-xl font-semibold tracking-wide border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-700 hover:text-emerald-200"
                    onClick={() => toggleIndividualTaskReveal(task.id)}
                  >
                    REVEAL TASK {index + 1}
                    <ZapIcon className="ml-3 h-6 w-6" />
                  </Button>
                ) : (
                  <div className="flex items-center justify-between w-full p-3 sm:p-4 bg-neutral-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.is_completed}
                        onCheckedChange={() => handleTaskToggle(task.id, task.is_completed)}
                        className="h-6 w-6 rounded-full data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white border-neutral-600"
                      />
                      <Label htmlFor={`task-${task.id}`} className={`text-base font-medium ${task.is_completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                        {task.task_description}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-400 font-semibold text-sm">
                      <SparklesIcon className="h-4 w-4" />
                      <span>{task.eco_score}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {!isInitialLoading && !isLoadingProfile && !error && dailyTasks.length > 0 && allTasksCompleted && (
          <motion.div 
              initial={{ opacity: 0, y:30}} 
              animate={{ opacity:1, y:0}} 
              transition={{delay: 0.5, type: "spring"}} 
              className="mt-12 text-center" 
          >
              <p className="text-emerald-400 text-2xl drop-shadow-lg">
                  🎉 All tasks completed! 🎉
              </p>
              {nextTaskDueAt && new Date() < nextTaskDueAt &&
                 <p className="text-neutral-300 mt-3">Your next tasks arrive around {format(nextTaskDueAt, 'p').toLowerCase()}.</p>
              }
              <p className="text-neutral-300 mt-1">
                  Curious about your progress? <a href="/impact" className="underline hover:text-emerald-400 transition-colors">See your impact!</a>
              </p>
          </motion.div>
        )}
      </div>

      <AlertDialog open={showUndoConfirm} onOpenChange={setShowUndoConfirm}>
        <AlertDialogContent className="bg-neutral-800 border-neutral-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangleIcon className="w-6 h-6 mr-2 text-amber-400" />
              Undo Task Completion?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-300 pt-2">
              Are you sure? This will revert your eco score for this task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={cancelUndoTask} className="bg-neutral-700 hover:bg-neutral-600 border-neutral-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUndoTask} className="bg-emerald-600 hover:bg-emerald-700">Yes, undo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}