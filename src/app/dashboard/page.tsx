import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getTasksByUserId } from "@/app/actions/tasks";
import DashboardClient from "@/components/DashboardClient";
import prisma from "@/lib/prisma";
import { CactusState } from "@prisma/client";
import type { Session } from "next-auth";
import { generateAndSaveTasks } from "@/lib/generation";
import { startOfDay } from "date-fns";

type DashboardSession = Session & {
  user: {
    id: string;
    username?: string | null;
    currentStreak?: number;
    cactusState?: string;
    tasksCompletedForCactus?: number;
    tasksLastGeneratedAt?: Date | null;
    hasSeenIntroPopup?: boolean;
    hasSeenStreakPopup?: boolean;
    hasSeenCompletionPopup?: boolean;
    hasCompletedFirstTask?: boolean;
  };
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { tasks: true } } },
  });

  if (!user) {
    redirect("/login");
  }

  // --- Final, Robust Self-Healing & Task Loading Logic ---

  // 1. Handle users who have completed onboarding but have no generation timestamp.
  if (user.onboarded && !user.tasksLastGeneratedAt) {
    const today = new Date();
    // Use placeholder answers for the initial, automatic generation.
    const placeholderAnswers = {
      q1: "Car",
      q2: "Mix of everything",
      q3: "I try to turn them off",
      q4: "Air pollution",
      q5: "Reducing waste",
    };
    await generateAndSaveTasks(user.id, placeholderAnswers, today);
    // Update the user and refetch them to get the new timestamp.
    user = await prisma.user.update({
      where: { id: user.id },
      data: { tasksLastGeneratedAt: today },
    });
  }

  // 2. Fetch the tasks associated with the user's current generation cycle.
  let tasks = await getTasksByUserId(user.id);

  // 3. If the user has a generation date but an incorrect number of tasks (e.g., duplicates),
  //    wipe the tasks for that day and regenerate them cleanly.
  if (user.tasksLastGeneratedAt && tasks.length !== 3) {
    const currentCycleDate = startOfDay(user.tasksLastGeneratedAt);
    const placeholderAnswers = {
      q1: "Car",
      q2: "Mix of everything",
      q3: "I try to turn them off",
      q4: "Air pollution",
      q5: "Reducing waste",
    };
    
    // Delete all tasks for the broken cycle.
    await prisma.task.deleteMany({
      where: { userId: user.id, assignedDate: currentCycleDate },
    });

    // Generate a fresh, correct set.
    await generateAndSaveTasks(user.id, placeholderAnswers, currentCycleDate);

    // Refetch the tasks to get the new, correct set.
    tasks = await getTasksByUserId(user.id);
  }

  // 4. Standard check for users who are genuinely new and need to go through onboarding.
  if (!user.onboarded) {
    redirect("/onboarding/preferences");
  }

  // The user object is now guaranteed to be up-to-date.
  const updatedUser = user;

  // Construct a new session object with the fresh user data for the client
  const updatedSession = {
    ...session,
    user: {
      ...session.user,
      id: updatedUser.id,
      username: updatedUser.username,
      currentStreak: updatedUser.currentStreak,
      cactusState: updatedUser.cactusState,
      tasksCompletedForCactus: updatedUser.tasksCompletedForCactus,
      tasksLastGeneratedAt: updatedUser.tasksLastGeneratedAt,
      hasSeenIntroPopup: updatedUser.hasSeenIntroPopup,
      hasSeenStreakPopup: updatedUser.hasSeenStreakPopup,
      hasSeenCompletionPopup: updatedUser.hasSeenCompletionPopup,
      hasCompletedFirstTask: updatedUser.hasCompletedFirstTask,
    },
  };

  return <DashboardClient session={updatedSession as DashboardSession} tasks={tasks} />;
} 