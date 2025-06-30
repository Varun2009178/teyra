import { Prisma, PrismaClient } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import prisma from "./prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Define a type for the transactional client to avoid using `any`
type PrismaTransactionalClient = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function generateAndSaveTasks(
  userId: string,
  answers: { [key: string]: string },
  assignedDate: Date,
  completedTasks?: string[],
  db: PrismaTransactionalClient = prisma
) {
  // Production Mode: Call the real Gemini API
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const completionHistory =
    completedTasks && completedTasks.length > 0
      ? `The user has recently completed the following tasks, so try to generate different ones: ${completedTasks.join(
          ", "
        )}`
      : "This is the user's first set of tasks.";

  const prompt = `
    Based on the following user answers to a sustainability questionnaire, generate EXACTLY 3 simple, actionable, daily tasks suitable for a beginner.
    Each task should be easy to understand and have a clear, concise description.
    ${completionHistory}
    The user's answers are:
    1. How they get around: "${answers.q1}"
    2. Their typical meal: "${answers.q2}"
    3. Their habits with lights/electronics: "${answers.q3}"
    4. Their biggest local environmental concern: "${answers.q4}"
    5. The area of sustainability they care about most: "${answers.q5}"

    Please provide the output as a valid JSON array of objects, where each object has a "title" and a "description". Do not include any other text or markdown formatting.
    Example format:
    [
      {"title": "One Meat-Free Meal", "description": "Challenge yourself to make one of your meals today completely meat-free. It's a small change with a big impact!"},
      {"title": "Unplug One Device", "description": "Before bed, find one electronic device (like a coffee maker or toaster) and unplug it completely. Many devices use 'phantom power' even when off."}
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    let tasks = JSON.parse(cleanedText);

    if (!Array.isArray(tasks)) {
      throw new Error("AI did not return a valid array of tasks.");
    }

    // Failsafe: Always take the first 3 tasks.
    tasks = tasks.slice(0, 3);

    const taskData = tasks.map((task: any) => ({
      userId: userId,
      title: task.title,
      description: task.description,
      assignedDate: assignedDate,
    }));

    await db.task.createMany({
      data: taskData,
    });

    return { success: true, tasks };
  } catch (error) {
    console.error("Full error in task generation:", error);
    return { success: false, error: "Failed to generate tasks." };
  }
} 