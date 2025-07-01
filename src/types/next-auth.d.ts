import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { CactusState } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      onboarded: boolean;
      currentStreak: number;
      cactusState: CactusState;
      hasSeenIntroPopup: boolean;
      hasSeenStreakPopup: boolean;
      hasSeenCompletionPopup: boolean;
      hasCompletedFirstTask: boolean;
      tasksLastGeneratedAt: Date | null;
      tasksCompletedForCactus: number;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string | null;
    onboarded: boolean;
    currentStreak: number;
    cactusState: CactusState;
    hasSeenIntroPopup: boolean;
    hasSeenStreakPopup: boolean;
    hasSeenCompletionPopup: boolean;
    hasCompletedFirstTask: boolean;
    tasksLastGeneratedAt: Date | null;
    tasksCompletedForCactus: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username: string | null;
    onboarded: boolean;
    currentStreak: number;
    cactusState: CactusState;
    hasSeenIntroPopup: boolean;
    hasSeenStreakPopup: boolean;
    hasSeenCompletionPopup: boolean;
    hasCompletedFirstTask: boolean;
    tasksLastGeneratedAt: Date | null;
    tasksCompletedForCactus: number;
  }
}