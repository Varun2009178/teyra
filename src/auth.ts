import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Loaded" : "MISSING");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Loaded" : "MISSING");
console.log("DISCORD_CLIENT_ID:", process.env.DISCORD_CLIENT_ID ? "Loaded" : "MISSING");
console.log("DISCORD_CLIENT_SECRET:", process.env.DISCORD_CLIENT_SECRET ? "Loaded" : "MISSING");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Loaded" : "MISSING");

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
      try {
        const cookieStore = cookies();
        const isLoginAttempt =
          cookieStore.get("next-auth.login-attempt")?.value === "true";
        const isSignUpAttempt =
          cookieStore.get("next-auth.signup-attempt")?.value === "true";

        // Clean up cookies immediately
        if (isLoginAttempt) cookieStore.delete("next-auth.login-attempt");
        if (isSignUpAttempt) cookieStore.delete("next-auth.signup-attempt");

        console.log("signIn callback triggered", {
          userEmail: user.email,
          isLoginAttempt,
          isSignUpAttempt,
        });

        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        
        console.log("dbUser lookup result:", dbUser ? "Found" : "Not Found");

        if (isLoginAttempt && !dbUser) {
          // Block login if user doesn't exist
          console.log("Blocking login: Account not found.");
          return "/login?error=AccountNotFound";
        }

        if (isSignUpAttempt && dbUser) {
          // Block sign-up if user already exists
          console.log("Blocking signup: Account already exists.");
          return "/login?error=AccountExists";
        }

        console.log("Allowing sign in.");
        // Allow all other cases (successful login, new user sign-up, account linking)
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false; // Prevent sign-in on error
      }
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
          onboarded: user.onboarded,
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