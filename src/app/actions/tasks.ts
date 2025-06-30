"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { CactusState, User } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { generateAndSaveTasks } from "@/lib/generation";
import type { Task } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { isToday, isYesterday, startOfDay, subDays, addDays } from "date-fns";

export async function getTasksByUserId(userId: string) {
  noStore();
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tasksLastGeneratedAt: true },
    });

    if (!user || !user.tasksLastGeneratedAt) {
      return [];
    }

    const targetDate = startOfDay(user.tasksLastGeneratedAt);

    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,
        assignedDate: targetDate,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return tasks;
  } catch (error) {
    console.error("Database Error in getTasksByUserId:", error);
    throw new Error("Failed to fetch tasks.");
  }
}

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

export async function regenerateDailyTasks(
  userId: string,
  userAnswers: any,
  simulationDate?: Date
) {
  const now = simulationDate || new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      let newStreak = user.currentStreak;
      if (user.lastTaskCompletedAt) {
        const today = startOfDay(now);
        const yesterday = subDays(today, 1);
        const lastCompletionDay = startOfDay(user.lastTaskCompletedAt);

        if (lastCompletionDay.getTime() < yesterday.getTime()) {
          newStreak = 0;
        }
      }

      const lastCycleDate = startOfDay(user.tasksLastGeneratedAt || new Date());
      const uncompletedTasks = await tx.task.findMany({
        where: {
          userId,
          assignedDate: lastCycleDate,
          completed: false,
        },
      });

      let penaltyApplied = false;
      let newCactusState = user.cactusState;
      let newTasksCompletedForCactus = user.tasksCompletedForCactus;

      if (uncompletedTasks.length > 0) {
        penaltyApplied = true;
        newTasksCompletedForCactus = Math.max(
          0,
          user.tasksCompletedForCactus - uncompletedTasks.length
        );

        if (newTasksCompletedForCactus >= 15) {
          newCactusState = "HAPPY";
        } else if (newTasksCompletedForCactus >= 5) {
          newCactusState = "MEDIUM";
        } else {
          newCactusState = "SAD";
        }

        const uncompletedTaskIds = uncompletedTasks.map((t) => t.id);
        if (uncompletedTaskIds.length > 0) {
          await tx.task.deleteMany({
            where: { id: { in: uncompletedTaskIds } },
          });
        }
      }
      
      const allCompletedTasksEver = await tx.task.findMany({
        where: { userId, completed: true },
        orderBy: { createdAt: "asc" }
      });

      const newTasksResult = await generateAndSaveTasks(
        userId,
        userAnswers,
        now,
        allCompletedTasksEver.map((t) => t.title),
        tx
      );

      if (!newTasksResult.success || !newTasksResult.tasks) {
        throw new Error("Failed to generate new tasks.");
      }
      
      const newTasksWithIds = await tx.task.findMany({
        where: {
          userId,
          assignedDate: startOfDay(now),
        },
        orderBy: { createdAt: "asc" },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          tasksLastGeneratedAt: now,
          cactusState: newCactusState,
          tasksCompletedForCactus: newTasksCompletedForCactus,
          currentStreak: newStreak,
        },
      });

      return {
        success: true,
        tasks: newTasksWithIds,
        user: updatedUser,
        penaltyApplied,
      };
    });
    revalidatePath("/dashboard");
    return result;
  } catch (error) {
    console.error("Error in regenerateDailyTasks transaction:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function updateTaskStatus(taskId: string, completed: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const task = await tx.task.findFirst({
        where: { id: taskId, userId },
      });
      if (!task) throw new Error("Task not found");
      
      const now = user.tasksLastGeneratedAt || new Date();

      if (task.completed === completed) {
         const currentTasks = await tx.task.findMany({
            where: {
                userId,
                assignedDate: startOfDay(user.tasksLastGeneratedAt || new Date())
            },
            orderBy: { createdAt: 'asc' }
        });
        return { success: true, user, tasks: currentTasks };
      }

      await tx.task.update({
        where: { id: taskId },
        data: { completed, completedAt: completed ? now : null },
      });

      let newStreak = user.currentStreak;
      let newLastTaskCompletedAt = user.lastTaskCompletedAt;

      if (completed) {
        const today = startOfDay(now);
        const lastCompletionDate = user.lastTaskCompletedAt
          ? startOfDay(user.lastTaskCompletedAt)
          : null;

        if (!lastCompletionDate || lastCompletionDate.getTime() < today.getTime()) {
          const yesterday = subDays(today, 1);
          if (
            lastCompletionDate &&
            lastCompletionDate.getTime() === yesterday.getTime()
          ) {
            newStreak = user.currentStreak + 1;
          } else {
            newStreak = 1;
          }
        }
        newLastTaskCompletedAt = now;
      } else {
        const mostRecentCompletedTask = await tx.task.findFirst({
          where: { userId, completed: true, id: { not: taskId } },
          orderBy: { completedAt: "desc" },
        });

        newLastTaskCompletedAt = mostRecentCompletedTask?.completedAt || null;

        const today = startOfDay(now);
        if (
          user.lastTaskCompletedAt &&
          startOfDay(user.lastTaskCompletedAt).getTime() === today.getTime()
        ) {
          const anyOtherCompletionsToday = await tx.task.count({
            where: {
              userId,
              completed: true,
              completedAt: { gte: today },
            },
          });

          if (anyOtherCompletionsToday === 0) {
            newStreak = Math.max(0, user.currentStreak - 1);
          }
        }
      }

      const totalTasksCompleted = await tx.task.count({
        where: { userId, completed: true },
      });
      
      // Step 4: Update Cactus Status based on the current score
      const newTasksCompletedForCactus = user.tasksCompletedForCactus + (completed ? 1 : -1);

      let newCactusState: CactusState = "SAD";
      if (newTasksCompletedForCactus >= 15) newCactusState = "HAPPY";
      else if (newTasksCompletedForCactus >= 5) newCactusState = "MEDIUM";

      // Step 5: Persist all user updates to the database
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          tasksCompletedForCactus: newTasksCompletedForCactus,
          cactusState: newCactusState,
          currentStreak: newStreak,
          longestStreak: Math.max(user.longestStreak, newStreak),
          lastTaskCompletedAt: newLastTaskCompletedAt,
          hasCompletedFirstTask: user.hasCompletedFirstTask || completed,
        },
      });
      
      const currentTasks = await tx.task.findMany({
          where: {
              userId,
              assignedDate: startOfDay(user.tasksLastGeneratedAt || new Date())
          },
          orderBy: { createdAt: 'asc' }
      });

      return { success: true, user: updatedUser, tasks: currentTasks };
    });
    
    revalidatePath("/dashboard");
    return result;
  } catch (error) {
    console.error("Database Error:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
    throw new Error("Failed to update task due to an unknown error.");
  }
}

export async function simulateTaskRegeneration(simulatedDateString: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  const placeholderAnswers = {
    q1: "Car",
    q2: "Mix",
    q3: "Sometimes",
    q4: "Air",
    q5: "Waste",
  };

  const simulatedDate = new Date(simulatedDateString);

  // Call the single, reliable source of truth for regeneration.
  return regenerateDailyTasks(userId, placeholderAnswers, simulatedDate);
}

export async function generateInitialTasks(userId: string) {
  "use server";
  try {
    const placeholderAnswers = {
      q1: "Car",
      q2: "Mix of everything",
      q3: "I try to turn them off",
      q4: "Air pollution",
      q5: "Reducing waste",
    };

    await generateAndSaveTasks(userId, placeholderAnswers, new Date());

    await prisma.user.update({
      where: { id: userId },
      data: { tasksLastGeneratedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to generate initial tasks:", error);
    return { success: false, error: "Task generation failed." };
  }
}

export async function updateCactusState(newCactusState: CactusState) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { cactusState: newCactusState },
    });
    revalidatePath("/dashboard");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Database Error in updateCactusState:", error);
    throw new Error("Failed to update cactus state.");
  }
}

export async function updateHasSeenIntroPopup(hasSeen: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { hasSeenIntroPopup: hasSeen },
    });
    revalidatePath("/dashboard");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Database Error in updateHasSeenIntroPopup:", error);
    throw new Error("Failed to update intro popup status.");
  }
}

export async function updateHasSeenStreakPopup(hasSeen: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { hasSeenStreakPopup: hasSeen },
    });
    revalidatePath("/dashboard");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Database Error in updateHasSeenStreakPopup:", error);
    throw new Error("Failed to update streak popup status.");
  }
}

export async function updateHasSeenCompletionPopup(hasSeen: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { hasSeenCompletionPopup: hasSeen },
    });
    revalidatePath("/dashboard");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Database Error in updateHasSeenCompletionPopup:", error);
    throw new Error("Failed to update completion popup status.");
  }
}

export async function updateHasCompletedFirstTask(hasCompleted: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { hasCompletedFirstTask: hasCompleted },
    });
    revalidatePath("/dashboard");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Database Error in updateHasCompletedFirstTask:", error);
    throw new Error("Failed to update first task completion status.");
  }
}

export async function updateUsername(username: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username: username },
    });
    revalidatePath("/dashboard");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Database Error in updateUsername:", error);
    throw new Error("Failed to update username.");
  }
}

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const userId = session.user.id;

  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    return { success: true };
  } catch (error) {
    console.error("Database Error in deleteAccount:", error);
    throw new Error("Failed to delete account.");
  }
}