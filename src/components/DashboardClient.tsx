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

const encouragingMessages = {
  HAPPY: [
    "You are doing great! Let us keep this positive streak going.",
    "Do not skip a day to make me sad again!",
    "I am feeling so happy and energized thanks to you!",
    "Keep it up! I am really proud of you!",
    "Let us make sustainability a daily habit, together.",
    "Doing sustainable tasks is pretty fun, I cannot even lie!",
    "Your efforts are making a real difference, and I can feel it!",
    "I believe in you! Let us make tomorrow even better.",
  ],
  MEDIUM: [
    "You are on the right track! A little more effort and I will be overjoyed!",
    "Almost there! Your consistency is key to my happiness.",
    "I am feeling better already, let us not stop now!",
  ],
  SAD: [
    "I am feeling a bit down. Completing a task would really cheer me up.",
    "I know you can do it! Let us turn things around.",
    "I mean all you have to do is a few sustainable tasks, it cannot be that hard...",
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
  session,
  tasks: initialTasks,
}: {
  session: Session;
  tasks: Task[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const { data: sessionData, update: updateSession } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);

  // New Local State: The single source of truth for the UI
  const [currentUser, setCurrentUser] = useState(session.user);

  // The `user` variable will now always point to our reliable local state
  const user = currentUser;

  const [isIntroModalOpen, setIntroModalOpen] = useState(false);
  const [isStreakModalOpen, setStreakModalOpen] = useState(false);
  const [prevStreak, setPrevStreak] = useState(user.currentStreak ?? 0);
  const [isCompletionModalOpen, setCompletionModalOpen] = useState(false);
  const [isPenaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const router = useRouter();

  const [isSimulating, setIsSimulating] = useState(false);
  const [displayDate, setDisplayDate] = useState(
    () => new Date(session.user.tasksLastGeneratedAt || Date.now())
  );

  // State for celebration animations
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [levelUpState, setLevelUpState] = useState<CactusState | null>(null);

  // State to track the previous value of hasCompletedFirstTask for reliable popup logic
  const [prevHasCompletedFirstTask, setPrevHasCompletedFirstTask] = useState(
    user.hasCompletedFirstTask
  );
  const [prevCactusState, setPrevCactusState] = useState(user.cactusState);

  // HYDRATION FIX: Initialize moodText with a deterministic value
  const [moodText, setMoodText] = useState(() => {
    const state = user.cactusState;
    return getRandomText(state);
  });

  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "focus",
    ];

    const resetTimer = () => {
      if (isIdle) {
        setIsIdle(false);
      }
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        resetTimer();
      }
    };

    events.forEach((event) => window.addEventListener(event, resetTimer));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resetTimer(); // Initial timer start

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isIdle]);

  const handleLoginRedirect = () => {
    signOut({ callbackUrl: "/login" });
  };

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setIsClient(true);
    // Prioritize database value, then check local storage.
    if (!user.hasSeenIntroPopup && localStorage.getItem("hasSeenIntroPopup") !== "true") {
      setIntroModalOpen(true);
    }
  }, [user.hasSeenIntroPopup]);

  // HYDRATION FIX: Set random text only on the client after initial mount
  useEffect(() => {
    const state = user.cactusState || 'MEDIUM';
    if (Array.isArray(encouragingMessages[state])) {
      setMoodText(
        encouragingMessages[state][Math.floor(Math.random() * encouragingMessages[state].length)]
      );
    } else {
      setMoodText(encouragingMessages[state]);
    }
  }, [user.cactusState]);

  useEffect(() => {
    // Logic for the STREAK modal (when streak increases)
    if (
      typeof user.currentStreak === 'number' &&
      user.currentStreak > prevStreak &&
      user.currentStreak > 1 &&
      !user.hasSeenStreakPopup
    ) {
      setStreakModalOpen(true);
    }
    setPrevStreak(user.currentStreak ?? 0);
  }, [user.currentStreak, prevStreak, user.hasSeenStreakPopup]);

  // New, robust logic for the FIRST TASK modal
  useEffect(() => {
    if (
      user.hasCompletedFirstTask &&
      !prevHasCompletedFirstTask &&
      !user.hasSeenStreakPopup
    ) {
      setStreakModalOpen(true);
    }
    setPrevHasCompletedFirstTask(user.hasCompletedFirstTask);
  }, [
    user.hasCompletedFirstTask,
    prevHasCompletedFirstTask,
    user.hasSeenStreakPopup,
  ]);

  // Effect to handle cactus level-up celebrations
  useEffect(() => {
    const stateChanged = user.cactusState !== prevCactusState;
    const leveledUpToMedium =
      stateChanged &&
      user.cactusState === "MEDIUM" &&
      prevCactusState === "SAD";
    const leveledUpToHappy =
      stateChanged &&
      user.cactusState === "HAPPY" &&
      prevCactusState === "MEDIUM";

    if (leveledUpToMedium || leveledUpToHappy) {
      if (user.cactusState) {
        setIsLevelingUp(true);
        setLevelUpState(user.cactusState);
        setTimeout(() => {
          setIsLevelingUp(false);
          setLevelUpState(null);
        }, 6000); // Celebrate for 6 seconds
      }
    }
    setPrevCactusState(user.cactusState);
  }, [user.cactusState, prevCactusState]);

  // Effect to handle automatic daily task regeneration
  useEffect(() => {
    // Check if its a new calendar day since the last task generation
    const lastGenDate = user.tasksLastGeneratedAt
      ? startOfDay(new Date(user.tasksLastGeneratedAt))
      : null;
    const today = startOfDay(new Date());

    const shouldRegenerate =
      lastGenDate && lastGenDate.getTime() < today.getTime();

    if (shouldRegenerate) {
      setIsRegenerating(true);
      // We need a proper way to get user answers here. For now, using placeholders.
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
            setCurrentUser(result.user as User);
            if (result.user) {
              updateSession({ user: result.user as User });
            }
            if (result.penaltyApplied) {
              setPenaltyModalOpen(true);
            }
          }
        })
        .finally(() => setIsRegenerating(false));
    }
  }, [user.id, user.tasksLastGeneratedAt, updateSession]);

  // --- Reveal Tasks Logic ---
  const getRevealStorageKey = (date: Date) => {
    // Use toISOString and split to get a consistent YYYY-MM-DD format
    return `tasksRevealed-${date.toISOString().split("T")[0]}`;
  };

  const [tasksRevealed, setTasksRevealed] = useState(false);

  useEffect(() => {
    if (isClient) {
      const key = getRevealStorageKey(displayDate);
      setTasksRevealed(localStorage.getItem(key) === "true");
    }
  }, [isClient, displayDate]);

  useEffect(() => {
    // This effect ensures the date displayed on the dashboard always matches
    // the authoritative date from the user's session data, fixing the sync issue.
    if (session.user.tasksLastGeneratedAt) {
      const serverDate = new Date(session.user.tasksLastGeneratedAt);
      // Only update if the client date is different to avoid infinite loops
      if (displayDate.toISOString().split("T")[0] !== serverDate.toISOString().split("T")[0]) {
        setDisplayDate(serverDate);
      }
    }
  }, [session.user.tasksLastGeneratedAt, displayDate]);

  const handleRevealTasks = () => {
    const key = getRevealStorageKey(displayDate);
    localStorage.setItem(key, "true");
    setTasksRevealed(true);
  };

  useEffect(() => {
    // Prioritize database value, then check local storage.
    if (
      isClient &&
      !user.hasSeenIntroPopup &&
      localStorage.getItem("hasSeenIntroPopup") !== "true"
    ) {
      setIntroModalOpen(true);
    }
  }, [user.hasSeenIntroPopup, isClient]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    setPenaltyModalOpen(false); // Close any existing penalty modal

    const newSimulatedDate = new Date(displayDate.getTime());
    newSimulatedDate.setDate(newSimulatedDate.getDate() + 1);

    try {
      const result = await simulateTaskRegeneration(
        newSimulatedDate.toISOString()
      );
      if (result.success && "tasks" in result && "user" in result) {
        setTasks(result.tasks);
        setCurrentUser(result.user as User);
        await updateSession({ user: result.user as User });
        setDisplayDate(newSimulatedDate); // Move to the next day on success
        // Show penalty modal if the simulation resulted in one
        if (result.penaltyApplied) {
          setPenaltyModalOpen(true);
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
    setIntroModalOpen(false);
    // Set local storage immediately for responsiveness
    localStorage.setItem("hasSeenIntroPopup", "true");
    // Then, update the database as the source of truth
    await markPopupAsSeen("intro");
    await updateSession({ user: { ...currentUser, hasSeenIntroPopup: true } });
    setCurrentUser({ ...currentUser, hasSeenIntroPopup: true });
  };

  const handleCloseStreak = () => {
    setStreakModalOpen(false);
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
      setCompletionModalOpen(true);
    }
  }, [allTasksCompleted, user]);

  const handleCloseCompletion = async () => {
    setCompletionModalOpen(false);
    // Immediately update local state to prevent re-opening
    setCurrentUser({ ...currentUser, hasSeenCompletionPopup: true });
    await markPopupAsSeen("completion");
    // Sync with the server session
    await updateSession({ user: { ...currentUser, hasSeenCompletionPopup: true } });
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
      if (JSON.stringify(currentUser) !== JSON.stringify(result.user)) {
        setCurrentUser(result.user as User);
        // Update the session in the background
        await updateSession({ user: result.user as User });
      }

      // Celebrate if a task was completed
      if (completed) {
        setIsCelebrating(true);
        setFeedbackMessage(`Task done. 🌱 Cactus mood is improving!`);
        setTimeout(() => {
          setIsCelebrating(false);
          setFeedbackMessage("");
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
      <IntroPopup isOpen={isIntroModalOpen} onClose={handleCloseIntro} />
      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={handleCloseStreak}
        streak={user.currentStreak || 0}
      />
      <PenaltyModal
        isOpen={isPenaltyModalOpen}
        onClose={() => setPenaltyModalOpen(false)}
      />
      {levelUpState && (levelUpState === 'MEDIUM' || levelUpState === 'HAPPY') && (
        <LevelUpModal
          isOpen={isLevelingUp}
          onClose={() => setIsLevelingUp(false)}
          newState={levelUpState}
        />
      )}
      <Modal isOpen={isCompletionModalOpen} onClose={handleCloseCompletion}>
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

      <Modal isOpen={isIdle} onClose={() => {}}>
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
                  isCelebrating={isCelebrating || isLevelingUp}
                />
              </div>
              <div className="flex h-14 items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={isCelebrating ? feedbackMessage : moodText}
                    className="text-base font-bold text-gray-700 sm:text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isCelebrating ? (
                      <span className="text-green-600">{feedbackMessage}</span>
                    ) : (
                      moodText
                    )}
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
              {isCelebrating && !isLevelingUp && (
                <Confetti recycle={false} numberOfPieces={200} />
              )}
              {isLevelingUp && (
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