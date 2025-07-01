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
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email || !account) {
        return false;
      }
      
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        if (existingUser) {
          // Check if they already have an account with this provider
          const existingAccount = existingUser.accounts.find(
            (acc) => acc.provider === account.provider
          );

          if (existingAccount) {
            // User is signing in with a provider they have already linked - allow
            return true;
          } else {
            // User exists but is trying to sign in with a new provider
            // Get the provider name of their existing account
            const existingProviderName = existingUser.accounts[0]?.provider;
            const providerDisplayName = existingProviderName 
              ? existingProviderName.charAt(0).toUpperCase() + existingProviderName.slice(1)
              : 'another provider';
            
            // Redirect to login with error
            return `/login?error=AccountExists&provider=${providerDisplayName}`;
          }
        }
        
        // New user - allow sign up
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        // When session is updated, merge the new data
        const updatedToken = { ...token, ...session };
        
        // Also fetch fresh data from database to ensure we have the latest
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
          });
          if (dbUser) {
            updatedToken.username = dbUser.username;
            updatedToken.onboarded = dbUser.onboarded;
            updatedToken.currentStreak = dbUser.currentStreak;
            updatedToken.cactusState = dbUser.cactusState;
            updatedToken.hasSeenIntroPopup = dbUser.hasSeenIntroPopup;
            updatedToken.hasSeenStreakPopup = dbUser.hasSeenStreakPopup;
            updatedToken.hasSeenCompletionPopup = dbUser.hasSeenCompletionPopup;
            updatedToken.hasCompletedFirstTask = dbUser.hasCompletedFirstTask;
            updatedToken.tasksLastGeneratedAt = dbUser.tasksLastGeneratedAt;
            updatedToken.tasksCompletedForCactus = dbUser.tasksCompletedForCactus;
          }
        }
        
        return updatedToken;
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
    async redirect({ url, baseUrl }) {
      // If the URL is already absolute, use it
      if (url.startsWith("http")) {
        return url;
      }
      
      // If it's a relative URL starting with /, prepend baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Default to base URL
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
    newUser: "/onboarding/username", // Where new users go after signing up
  },
}); 