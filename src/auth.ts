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
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.onboarded = dbUser.onboarded;
          token.currentStreak = dbUser.currentStreak;
          token.cactusState = dbUser.cactusState;
          token.hasSeenIntroPopup = dbUser.hasSeenIntroPopup;
          token.hasSeenStreakPopup = dbUser.hasSeenStreakPopup;
          token.hasSeenCompletionPopup = dbUser.hasSeenCompletionPopup;
          token.hasCompletedFirstTask = dbUser.hasCompletedFirstTask;
          token.tasksLastGeneratedAt = dbUser.tasksLastGeneratedAt;
          token.tasksCompletedForCactus = dbUser.tasksCompletedForCactus;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.onboarded = token.onboarded;
        session.user.currentStreak = token.currentStreak;
        session.user.cactusState = token.cactusState;
        session.user.hasSeenIntroPopup = token.hasSeenIntroPopup;
        session.user.hasSeenStreakPopup = token.hasSeenStreakPopup;
        session.user.hasSeenCompletionPopup = token.hasSeenCompletionPopup;
        session.user.hasCompletedFirstTask = token.hasCompletedFirstTask;
        session.user.tasksLastGeneratedAt = token.tasksLastGeneratedAt;
        session.user.tasksCompletedForCactus = token.tasksCompletedForCactus;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
}); 