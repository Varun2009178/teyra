import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateAndSaveTasks } from "@/lib/generation";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { answers } = await req.json();

  // In a real app, you'd fetch the user's saved answers.
  // For now, we use what's passed or a default set for regeneration.
  const generationAnswers = answers || {
    q1: "Car",
    q2: "Mix of everything",
    q3: "I try to turn them off",
    q4: "Air pollution",
    q5: "Reducing waste",
  };

  if (!generationAnswers) {
    return NextResponse.json({ error: "Answers not provided" }, { status: 400 });
  }
  
  const result = await generateAndSaveTasks(
    session.user.id,
    generationAnswers,
    new Date()
  );

  if (result.success) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        onboarded: true,
        tasksLastGeneratedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, tasks: result.tasks });
  } else {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
} 