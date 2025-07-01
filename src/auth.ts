import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set");
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error("NEXTAUTH_URL is not set");
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
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
  session: {
    strategy: "database"
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) {
        console.error("Sign in failed: No email provided");
        return false;
      }

      try {
        // Verify database connection
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        
        console.log("Database lookup result:", {
          email: user.email,
          userFound: !!dbUser,
        });

        return true;
      } catch (error) {
        console.error("Database error during sign in:", error);
        throw new Error("Database connection failed");
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
    }
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
}); 