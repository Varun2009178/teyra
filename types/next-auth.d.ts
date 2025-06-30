import "next-auth";
import { CactusState } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      onboardingComplete: boolean;
      currentStreak: number;
      cactusState: CactusState;
    } & import("next-auth").DefaultSession["user"];
  }

  interface User extends import("next-auth").DefaultUser {
    username: string;
    onboardingComplete: boolean;
    currentStreak: number;
    cactusState: CactusState;
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