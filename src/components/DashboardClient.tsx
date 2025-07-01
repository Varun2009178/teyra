"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CactusAnimation from "@/components/CactusAnimation";
import TaskList from "@/components/TaskList";
import Modal from "@/components/Modal";
import type { Session } from "next-auth";
import type { Task, CactusState, User } from "@prisma/client";
import { IntroPopup } from "@/components/IntroPopup";
import { StreakModal } from "@/components/StreakModal";
import { PenaltyModal } from "@/components/PenaltyModal";
import { LevelUpModal } from "@/components/LevelUpModal";
import { markPopupAsSeen } from "@/app/actions/user";
import { useSession, signOut } from "next-auth/react";
import {
  updateTaskStatus,
  regenerateDailyTasks,
  simulateTaskRegeneration,
} from "@/app/actions/tasks";
import Confetti from "react-confetti";
import { useMeasure } from "react-use";
import { startOfDay } from "date-fns";
import { FiSettings, FiMessageSquare } from "react-icons/fi";
import { FaCheckCircle, FaLeaf, FaTrophy } from "react-icons/fa";

const encouragingMessages: Record<CactusState, string[]> = {
  HAPPY: [
    "You're doing great! Keep up the amazing work! 🌟",
    "Your dedication is truly inspiring! 🎯",
    "You're on fire! Nothing can stop you now! 🔥",
  ],
  MEDIUM: [
    "You're making progress! Keep going! 💪",
    "Every step counts! You've got this! 🌱",
    "Stay focused, you're doing well! 🎯",
  ],
  SAD: [
    "Don't give up! Every new day is a fresh start! 🌅",
    "Small steps lead to big changes! 🌱",
    "You can do this! Believe in yourself! ⭐",
  ],
};

function getRandomText(state: CactusState | undefined): string {
  const currentState = state || 'MEDIUM';
  const options = encouragingMessages[currentState] || encouragingMessages.MEDIUM;
  return options[Math.floor(Math.random() * options.length)];
}

const cactusThoughts = {
  sad: [
    "Feeling a bit dry today...",
    "A single task would be like a drop of rain.",
    "Do not skip a day to make me sad again!",
  ],
  neutral: [
    "Keep it up! I am really proud of you!",
    "Every task you complete helps me grow a little.",
    "Doing sustainable tasks is pretty fun, I cannot lie!",
  ],
  happy: [
    "I am feeling fantastic, thanks to you!",
    "We are making a real difference together!",
    "I mean all you have to do is a few sustainable tasks, it cannot be that hard...",
  ],
};

export default function DashboardClient({
  session: initialSession,
  tasks: initialTasks,
}: {
  session: Session;
  tasks: Task[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const { data: session, update: updateSession } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const user = useMemo(() => session?.user ?? initialSession.user, [session, initialSession.user]);

  // Combine all modal states
  const [modals, setModals] = useState({
    intro: false,
    streak: false,
    penalty: false,
    completion: false,
    levelUp: false,
    idle: false
  });

  // Combine all animation states
  const [animations, setAnimations] = useState<{
    isCelebrating: boolean;
    isLevelingUp: boolean;
    feedbackMessage: string;
    levelUpState: CactusState | null;
  }>({
    isCelebrating: false,
    isLevelingUp: false,
    feedbackMessage: "",
    levelUpState: null
  });

  // Track previous states in one object
  const [prevStates, setPrevStates] = useState({
    streak: user.currentStreak ?? 0,
    hasCompletedFirstTask: user.hasCompletedFirstTask,
    cactusState: user.cactusState
  });

  const [isRegenerating, setIsRegenerating] = useState(false);
  const router = useRouter();

  const [isSimulating, setIsSimulating] = useState(false);
  const [displayDate, setDisplayDate] = useState(
    () => new Date(user.tasksLastGeneratedAt || Date.now())
  );

  // HYDRATION FIX: Initialize moodText with a deterministic value
  const [moodText, setMoodText] = useState(() => {
    const state: CactusState = user.cactusState || 'MEDIUM';
    return getRandomText(state);
  });

  const [tasksRevealed, setTasksRevealed] = useState(false);

  // Single effect for client-side initialization
  useEffect(() => {
    setIsClient(true);
    // Check intro popup condition
    if (!user.hasSeenIntroPopup && localStorage.getItem("hasSeenIntroPopup") !== "true") {
      setModals(m => ({ ...m, intro: true }));
    }
    // Set initial tasks revealed state
    const key = getRevealStorageKey(new Date(user.tasksLastGeneratedAt || Date.now()));
    setTasksRevealed(localStorage.getItem(key) === "true");
  }, [user.hasSeenIntroPopup, user.tasksLastGeneratedAt]);

  // Single effect for idle timer
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const IDLE_TIMEOUT = 30 * 60 * 1000;
    
    const resetTimer = () => {
      if (modals.idle) {
        setModals(m => ({ ...m, idle: false }));
      }
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setModals(m => ({ ...m, idle: true })), IDLE_TIMEOUT);
    };

    if (isClient) {
      ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "click", "focus"].forEach(
        event => window.addEventListener(event, resetTimer)
      );
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) resetTimer();
      });
      resetTimer();
    }

    return () => {
      clearTimeout(timeoutId);
      ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "click", "focus"].forEach(
        event => window.removeEventListener(event, resetTimer)
      );
      document.removeEventListener("visibilitychange", resetTimer);
    };
  }, [isClient, modals.idle]);

  // Single effect for user state updates
  useEffect(() => {
    // Handle streak modal
    if (
      typeof user.currentStreak === 'number' &&
      user.currentStreak > prevStates.streak &&
      user.currentStreak > 1 &&
      !user.hasSeenStreakPopup
    ) {
      setModals(m => ({ ...m, streak: true }));
    }

    // Handle first task completion
    if (
      user.hasCompletedFirstTask &&
      !prevStates.hasCompletedFirstTask &&
      !user.hasSeenStreakPopup
    ) {
      setModals(m => ({ ...m, streak: true }));
    }

    // Handle cactus level up
    const stateChanged = user.cactusState !== prevStates.cactusState;
    const leveledUpToMedium = stateChanged && user.cactusState === "MEDIUM" && prevStates.cactusState === "SAD";
    const leveledUpToHappy = stateChanged && user.cactusState === "HAPPY" && prevStates.cactusState === "MEDIUM";

    if (leveledUpToMedium || leveledUpToHappy) {
      setAnimations(a => ({
        ...a,
        isLevelingUp: true,
        levelUpState: user.cactusState || "MEDIUM"
      }));
      setTimeout(() => {
        setAnimations(a => ({
          ...a,
          isLevelingUp: false,
          levelUpState: null
        }));
      }, 6000);
    }

    // Update previous states
    setPrevStates({
      streak: user.currentStreak ?? 0,
      hasCompletedFirstTask: user.hasCompletedFirstTask,
      cactusState: user.cactusState
    });
  }, [
    user.currentStreak,
    user.hasCompletedFirstTask,
    user.cactusState,
    user.hasSeenStreakPopup,
    prevStates.streak,
    prevStates.hasCompletedFirstTask,
    prevStates.cactusState
  ]);

  // Single effect for task regeneration
  useEffect(() => {
    if (!isClient) return;

    const lastGenDate = user.tasksLastGeneratedAt ? startOfDay(new Date(user.tasksLastGeneratedAt)) : null;
    const today = startOfDay(new Date());
    const shouldRegenerate = lastGenDate && lastGenDate.getTime() < today.getTime();

    if (shouldRegenerate) {
      setIsRegenerating(true);
      const placeholderAnswers = {
        q1: "Car",
        q2: "Mix of everything",
        q3: "I try to turn things off",
        q4: "Air pollution",
        q5: "Reducing waste",
      };

      regenerateDailyTasks(user.id, placeholderAnswers)
        .then((result) => {
          if (result.success && "tasks" in result && "user" in result) {
            setTasks(result.tasks);
            if (result.user) {
              updateSession({ user: result.user as User });
            }
            if (result.penaltyApplied) {
              setModals(m => ({ ...m, penalty: true }));
            }
          }
        })
        .finally(() => setIsRegenerating(false));
    }
  }, [isClient, user.id, user.tasksLastGeneratedAt, updateSession]);

  // --- Reveal Tasks Logic ---
  const getRevealStorageKey = (date: Date) => {
    // Use toISOString and split to get a consistent YYYY-MM-DD format
    return `tasksRevealed-${date.toISOString().split("T")[0]}`;
  };

  const handleLoginRedirect = () => {
    signOut({ callbackUrl: "/login" });
  };

  // HYDRATION FIX: Set random text only on the client after initial mount
  useEffect(() => {
    const state: CactusState = user.cactusState || 'MEDIUM';
    setMoodText(
      encouragingMessages[state][Math.floor(Math.random() * encouragingMessages[state].length)]
    );
  }, [user.cactusState]);

  useEffect(() => {
    // This effect ensures the date displayed on the dashboard always matches
    // the authoritative date from the user's session data, fixing the sync issue.
    if (session?.user?.tasksLastGeneratedAt) {
      const serverDate = new Date(session.user.tasksLastGeneratedAt);
      // Only update if the client date is different to avoid infinite loops
      if (displayDate.toISOString().split("T")[0] !== serverDate.toISOString().split("T")[0]) {
        setDisplayDate(serverDate);
      }
    }
  }, [session, displayDate]);

  const handleRevealTasks = () => {
    const key = getRevealStorageKey(displayDate);
    localStorage.setItem(key, "true");
    setTasksRevealed(true);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setModals(m => ({ ...m, penalty: false })); // Close any existing penalty modal

    const newSimulatedDate = new Date(displayDate.getTime());
    newSimulatedDate.setDate(newSimulatedDate.getDate() + 1);

    try {
      const result = await simulateTaskRegeneration(
        newSimulatedDate.toISOString()
      );
      if (result.success && "tasks" in result && "user" in result) {
        setTasks(result.tasks);
        await updateSession({ user: result.user as User });
        setDisplayDate(newSimulatedDate); // Move to the next day on success
        // Show penalty modal if the simulation resulted in one
        if (result.penaltyApplied) {
          setModals(m => ({ ...m, penalty: true }));
        }
      } else {
        console.error("Failed to update task, reverting.");
        setTasks(tasks); // Revert on failure
      }
    } catch (error) {
      console.error("Error updating task:", error);
      setTasks(tasks);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCloseIntro = async () => {
    setModals(m => ({ ...m, intro: false }));
    // Set local storage immediately for responsiveness
    localStorage.setItem("hasSeenIntroPopup", "true");
    // Then, update the database as the source of truth
    await markPopupAsSeen("intro");
    await updateSession({ user: { ...user, hasSeenIntroPopup: true } });
  };

  const handleCloseStreak = () => {
    setModals(m => ({ ...m, streak: false }));
    markPopupAsSeen("streak");
  };

  const { cactusState, tasksCompletedForCactus } = user;

  const calculateMoodProgress = (state: CactusState | undefined) => {
  let progress = 0;
    let progressColor = "bg-gray-300";
    let progressText = "Just getting started!";

    // Provide a default state if it's undefined to prevent crashes
    const currentState = state || "MEDIUM";

    if (currentState === "SAD") {
      progress = 25;
      progressColor = "bg-red-500";
      progressText = "Feeling down";
    } else if (currentState === "MEDIUM") {
      progress = 60;
      progressColor = "bg-yellow-500";
      progressText = "Doing okay, keep it up!";
    } else if (currentState === "HAPPY") {
    progress = 100;
    progressColor = "bg-green-500";
      progressText = "You have reached the highest level of happiness!";
    }

    return { progress, progressColor, progressText };
  };

  const moodProgress = calculateMoodProgress(user.cactusState);

  let progress = moodProgress.progress;
  let progressText = moodProgress.progressText;
  let progressColor = moodProgress.progressColor;

  const date = displayDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const allTasksCompleted = useMemo(
    () => tasks.length > 0 && tasks.every((task) => task.completed),
    [tasks]
  );

  useEffect(() => {
    if (allTasksCompleted && user && !user.hasSeenCompletionPopup) {
      setModals(m => ({ ...m, completion: true }));
    }
  }, [allTasksCompleted, user]);

  const handleCloseCompletion = async () => {
    setModals(m => ({ ...m, completion: false }));
    // Immediately update local state to prevent re-opening
    // Sync with the server session
    await updateSession({ user: { ...user, hasSeenCompletionPopup: true } });
  };

  const handleTaskStateChange = async (taskId: string, completed: boolean) => {
    setIsUpdating(true);
    // Optimistically update the UI for instant feedback
    const originalTasks = [...tasks];
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed } : t
    );
    setTasks(updatedTasks);

    try {
    // Call the server action and update the state with the authoritative result
      const result = await updateTaskStatus(taskId, completed);
      
        if (!result.success || !result.user || !result.tasks) {
          console.error("Failed to update task, reverting.");
          setTasks(originalTasks); // Revert on failure
        setIsUpdating(false);
          return;
        }

      // Only update state if the values have actually changed
      if (JSON.stringify(tasks) !== JSON.stringify(result.tasks)) {
        setTasks(result.tasks);
      }

      // Only update user state if something has changed
      if (JSON.stringify(user) !== JSON.stringify(result.user)) {
        // Update the session in the background
        await updateSession({ user: result.user as User });
      }

        // Celebrate if a task was completed
        if (completed) {
        setAnimations(a => ({
          ...a,
          isCelebrating: true,
          feedbackMessage: `Task done. 🌱 Cactus mood is improving!`
        }));
          setTimeout(() => {
          setAnimations(a => ({
            ...a,
            isCelebrating: false,
            feedbackMessage: ""
          }));
          }, 4000);
        }
    } catch (error) {
        console.error("Error updating task:", error);
        setTasks(originalTasks);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isRegenerating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="animate-pulse text-2xl font-bold">
            Generating your new daily tasks...
          </h2>
          <p>This will just take a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <IntroPopup isOpen={modals.intro} onClose={handleCloseIntro} />
      <StreakModal
        isOpen={modals.streak}
        onClose={handleCloseStreak}
        streak={user.currentStreak || 0}
      />
      <PenaltyModal
        isOpen={modals.penalty}
        onClose={() => setModals(m => ({ ...m, penalty: false }))}
      />
      {animations.levelUpState && (animations.levelUpState === 'MEDIUM' || animations.levelUpState === 'HAPPY') && (
        <LevelUpModal
          isOpen={animations.isLevelingUp}
          onClose={() => setAnimations(a => ({ ...a, isLevelingUp: false }))}
          newState={animations.levelUpState}
        />
      )}
      <Modal isOpen={modals.completion} onClose={handleCloseCompletion}>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Great Job!</h2>
          <p className="mt-2 text-gray-600">
            You have completed all your tasks for the day. New tasks will be
            generated for you in 24 hours. Keep up the great work!
          </p>
          <div className="mt-6">
            <button
              onClick={handleCloseCompletion}
              className="rounded-lg bg-brand-sea-green px-6 py-2 font-semibold text-white transition hover:bg-green-700"
            >
              Got it!
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modals.idle} onClose={() => {}}>
        <div className="text-center">
          <h2 className="text-2xl font-bold">You have been idle for a while</h2>
          <p className="mt-4 text-gray-600">
            For your security, you should log in again to continue.
          </p>
          <div className="mt-6">
            <button
              onClick={handleLoginRedirect}
              className="w-full rounded-lg border-2 border-black bg-[#A18BFF] px-4 py-2 font-bold text-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              Log In
            </button>
          </div>
        </div>
      </Modal>

      <main className="min-h-screen bg-[#F8F7F4] p-4 pt-20 sm:p-8 sm:pt-28">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-4xl font-black text-gray-800 sm:text-5xl lg:text-6xl">
              Welcome, {user.username}!
            </h1>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Cactus */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-4 border-brand-dark-orange bg-yellow-50 p-4 text-center shadow-[8px_8px_0_0_#FCA311] sm:p-8 lg:col-span-2">
              <div className="w-full">
                <h2 className="text-xl font-bold text-gray-700 sm:text-2xl">
                  Cactus Mood
                </h2>
              </div>
              <div className="h-64 w-full sm:h-80">
                <CactusAnimation
                  state={user.cactusState || 'MEDIUM'}
                  isCelebrating={animations.isCelebrating}
                />
              </div>
              <div className="flex h-14 items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={animations.feedbackMessage || moodText}
                    className="text-base font-bold text-gray-700 sm:text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {animations.feedbackMessage || moodText}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="mt-4 w-full max-w-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Cactus Mood Progress
                </h3>
                <div className="mt-2 h-4 w-full rounded-full border-2 border-gray-300 bg-gray-200">
                  <div
                    className={`h-full rounded-full ${progressColor} transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-600">
                  {progressText}
                </p>
              </div>
            </div>

            {/* Right Column: Tasks & Status */}
            <div className="relative rounded-2xl border-4 border-brand-dark-orange bg-yellow-50 p-4 shadow-[8px_8px_0_0_#FCA311] sm:p-8 lg:col-span-1">
              {animations.isCelebrating && !animations.isLevelingUp && (
                <Confetti recycle={false} numberOfPieces={200} />
              )}
              {animations.isLevelingUp && (
                <Confetti recycle={false} numberOfPieces={500} gravity={0.3} />
              )}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-700 sm:text-2xl">
                  Tasks for Today
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-lg font-bold text-orange-500 sm:text-xl">
                    <span>🔥</span>
                    <span>{user.currentStreak || 0}</span>
                  </div>
                  <button
                    onClick={() => router.push("/feedback")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-lg text-gray-600 transition-all hover:bg-gray-300"
                    aria-label="Feedback"
                  >
                    <FiMessageSquare />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-gray-600">{date}</p>
              <div className="mt-4">
                {!isClient ? (
                  <div className="h-48 w-full animate-pulse rounded-lg bg-gray-200"></div>
                ) : isUpdating ? (
                  <div className="h-48 w-full animate-pulse rounded-lg bg-gray-100"></div>
                ) : tasks.length > 0 && tasksRevealed ? (
                  <TaskList
                    tasks={tasks}
                    onUpdateTask={handleTaskStateChange}
                  />
                ) : !tasksRevealed ? (
                  <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg bg-blue-100 p-4">
                    <button
                      onClick={handleRevealTasks}
                      className="rounded-xl border-4 border-black bg-white px-6 py-3 text-lg font-bold text-black shadow-[8px_8px_0_0_#000] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none sm:px-8 sm:py-4 sm:text-2xl"
                    >
                      Click to Reveal Tasks for Today!
                    </button>
                  </div>
                ) : (
                  <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg bg-gray-100 p-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-700">No tasks for this day.</h3>
                    <p className="text-gray-500">New tasks will be generated on your next daily refresh!</p>
                  </div>
                )}
              </div>
              <div className="mt-6 border-t-2 border-gray-200 pt-6">
                <h2 className="text-xl font-bold text-gray-700 sm:text-2xl">
                  Streak Progress
                </h2>
                <p className="mt-2 text-base font-bold text-gray-700 sm:text-lg">
                  You are on a {user.currentStreak}-day streak!
                </p>
                <div className="mt-4 w-full">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    15-Day Challenge
                  </h3>
                  <div className="mt-2 h-4 w-full rounded-full border-2 border-gray-300 bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all duration-500"
                      style={{
                        width: `${((user.currentStreak || 0) / 15) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-600">
                    {user.currentStreak} / 15 days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}