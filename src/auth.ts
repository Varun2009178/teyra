import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// Validate required environment variables
const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
  } else {
    console.log(`${key}: Loaded`);
  }
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) {
        console.error("Sign in failed: No email provided");
        return false;
      }

      try {
        const cookieStore = cookies();
        const isLoginAttempt =
          cookieStore.get("next-auth.login-attempt")?.value === "true";
        const isSignUpAttempt =
          cookieStore.get("next-auth.signup-attempt")?.value === "true";

        // Clean up cookies immediately
        if (isLoginAttempt) cookieStore.delete("next-auth.login-attempt");
        if (isSignUpAttempt) cookieStore.delete("next-auth.signup-attempt");

        console.log("Sign in attempt details:", {
          email: user.email,
          provider: account?.provider,
          isLoginAttempt,
          isSignUpAttempt,
        });

        // Verify database connection
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          
          console.log("Database lookup result:", {
            email: user.email,
            userFound: !!dbUser,
            isLoginAttempt,
            isSignUpAttempt,
          });

          if (isLoginAttempt && !dbUser) {
            console.log("Login blocked: Account not found");
            return "/login?error=AccountNotFound";
          }

          if (isSignUpAttempt && dbUser) {
            console.log("Signup blocked: Account already exists");
            return "/login?error=AccountExists";
          }

          return true;
        } catch (dbError) {
          console.error("Database error during sign in:", dbError);
          throw new Error("Database connection failed");
        }
      } catch (error) {
        console.error("Sign in error:", {
          message: error instanceof Error ? error.message : "Unknown error",
          email: user.email,
          provider: account?.provider,
        });
        return "/api/auth/error?error=ServerError";
      }
    },
    async session({ session, user }) {
      if (session.user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
          });

          if (!dbUser) {
            console.error("Session error: User not found in database", {
              userId: user.id,
              email: session.user.email,
            });
            return session;
          }

          session.user.id = dbUser.id;
          session.user.username = dbUser.username;
          session.user.onboarded = dbUser.onboarded;
          session.user.currentStreak = dbUser.currentStreak;
          session.user.cactusState = dbUser.cactusState;
          session.user.hasSeenIntroPopup = dbUser.hasSeenIntroPopup;
          session.user.hasSeenStreakPopup = dbUser.hasSeenStreakPopup;
          session.user.hasSeenCompletionPopup = dbUser.hasSeenCompletionPopup;
          session.user.hasCompletedFirstTask = dbUser.hasCompletedFirstTask;
          session.user.tasksLastGeneratedAt = dbUser.tasksLastGeneratedAt;
          session.user.tasksCompletedForCactus = dbUser.tasksCompletedForCactus;
        } catch (error) {
          console.error("Session database error:", {
            message: error instanceof Error ? error.message : "Unknown error",
            userId: user.id,
            email: session.user.email,
          });
        }
      }
      return session;
    },
  },
  pages: {
    error: "/auth/error",
    signIn: "/login",
  },
}); 