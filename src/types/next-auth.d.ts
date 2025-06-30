import type { User as PrismaUser } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session.user type with our custom fields.
   */
  interface User {
    username?: string | null;
    onboarded?: boolean;
    currentStreak?: number;
    cactusState?: PrismaUser["cactusState"]; // Use the enum type from Prisma
    hasSeenIntroPopup?: boolean;
    hasSeenStreakPopup?: boolean;
    hasSeenCompletionPopup?: boolean;
    hasCompletedFirstTask?: boolean;
    tasksLastGeneratedAt?: Date | null;
    tasksCompletedForCactus?: number;
  }

  interface Session {
    user: User & {
      id: string;
    };
  }
} 