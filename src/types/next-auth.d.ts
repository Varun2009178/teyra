import type { DefaultSession } from "next-auth";
import type { User as PrismaUser, CactusState } from "../../prisma/generated/client";
import "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session.user type with our custom fields.
   */
  interface User {
    username?: string | null;
    onboarded?: boolean;
    currentStreak?: number;
    longestStreak?: number;
    lastTaskCompletedAt?: Date | null;
    cactusState?: CactusState;
    tasksCompletedForCactus?: number;
    tasksLastGeneratedAt?: Date | null;
    hasSeenIntroPopup?: boolean;
    hasSeenStreakPopup?: boolean;
    hasSeenCompletionPopup?: boolean;
    hasCompletedFirstTask?: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string | null;
      onboarded: boolean;
      currentStreak: number;
      longestStreak: number;
      lastTaskCompletedAt: Date | null;
      cactusState: CactusState;
      tasksCompletedForCactus: number;
      tasksLastGeneratedAt: Date | null;
      hasSeenIntroPopup: boolean;
      hasSeenStreakPopup: boolean;
      hasSeenCompletionPopup: boolean;
      hasCompletedFirstTask: boolean;
    } & DefaultSession["user"];
  }
} 