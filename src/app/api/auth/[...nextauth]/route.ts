import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const { handlers, auth, signIn, signOut } = NextAuth({
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
      const cookieStore = cookies();
      const isLoginAttempt =
        cookieStore.get("next-auth.login-attempt")?.value === "true";
      const isSignUpAttempt =
        cookieStore.get("next-auth.signup-attempt")?.value === "true";

      // Clean up cookies immediately
      if (isLoginAttempt) cookieStore.delete("next-auth.login-attempt");
      if (isSignUpAttempt) cookieStore.delete("next-auth.signup-attempt");

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (isLoginAttempt && !dbUser) {
        // Block login if user doesn't exist
        return "/login?error=AccountNotFound";
      }

      if (isSignUpAttempt && dbUser) {
        // Block sign-up if user already exists
        return "/login?error=AccountExists";
      }

      // Allow all other cases (successful login, new user sign-up, account linking)
      return true;
    },
    async session({ session, user }) {
      // The user object here is the full user from the database, thanks to the Prisma adapter.
      // We're creating a new session object to avoid direct mutation and type issues.
      return {
        ...session,
        user: {
          ...session.user, // Keep original properties like name, email, image
          id: user.id,
          username: user.username,
          onboardingComplete: user.onboardingComplete,
          currentStreak: user.currentStreak,
          cactusState: user.cactusState,
          hasSeenIntroPopup: user.hasSeenIntroPopup,
          hasSeenStreakPopup: user.hasSeenStreakPopup,
          hasSeenCompletionPopup: user.hasSeenCompletionPopup,
          hasCompletedFirstTask: user.hasCompletedFirstTask,
        },
      };
    },
  },
});

export const { GET, POST } = handlers;
export { auth, signIn, signOut };