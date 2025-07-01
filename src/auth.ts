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
    async signIn({ user, account }) {
      if (!user.email) {
        // This should not happen with OAuth providers like Google and Discord
        // as they always provide an email.
        return false;
      }
      
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { accounts: true },
      });

      if (existingUser && account) {
        const existingAccount = existingUser.accounts.find(
          (acc) => acc.provider === account.provider
        );

        if (existingAccount) {
          // User is signing in with a provider they have already linked.
          return true;
        }

        // User exists but is trying to sign in with a new provider.
        // `allowDangerousEmailAccountLinking` is true, so NextAuth will link it.
        // If you want to prevent this, you can return a redirect to the login page
        // with an error.
        const providerName = existingUser.accounts[0]?.provider.charAt(0).toUpperCase() + existingUser.accounts[0]?.provider.slice(1);
        throw new Error(`You have already signed up with ${providerName}. Please log in using that method.`);
      }
      
      // New user or user signing in with their first/only linked provider.
      return true;
    },
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