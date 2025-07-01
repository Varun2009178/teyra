import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { username } = await req.json();

  if (!username || username.length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 characters long" },
      { status: 400 }
    );
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { username: username },
    });
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        onboarded: updatedUser.onboarded,
        currentStreak: updatedUser.currentStreak,
        cactusState: updatedUser.cactusState,
        hasSeenIntroPopup: updatedUser.hasSeenIntroPopup,
        hasSeenStreakPopup: updatedUser.hasSeenStreakPopup,
        hasSeenCompletionPopup: updatedUser.hasSeenCompletionPopup,
        hasCompletedFirstTask: updatedUser.hasCompletedFirstTask,
        tasksLastGeneratedAt: updatedUser.tasksLastGeneratedAt,
        tasksCompletedForCactus: updatedUser.tasksCompletedForCactus,
      }
    });
  } catch (error) {
    // Check for unique constraint violation (P2002)
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: "This username is already taken." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
} 