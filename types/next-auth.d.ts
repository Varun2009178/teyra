import { type DefaultSession } from "next-auth";
import { CactusState } from "@prisma/client";

declare module "next-auth" {
  /**
   * Represents the user object in your application.
   * This extends the default user with your custom fields.
   */
  interface User {
    id: string;
    username: string | null;
    onboarded: boolean;
    currentStreak: number;
    cactusState: CactusState;
    tasksCompletedForCactus: number;
    tasksLastGeneratedAt: Date | null;
    hasSeenIntroPopup: boolean;
    hasSeenStreakPopup: boolean;
    hasSeenCompletionPopup: boolean;
    hasCompletedFirstTask: boolean;
  }

  /**
   * Represents the session object.
   * This ensures that `session.user` will have the custom fields defined in the User interface.
   */
  interface Session {
    user: User & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    onboardingComplete: boolean;
    currentStreak: number;
    cactusState: CactusState;
  }
} 