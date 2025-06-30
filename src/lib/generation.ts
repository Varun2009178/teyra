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

  const previousTaskTitles = completedTasks ? completedTasks : [];
  const topics = [answers.q1, answers.q2, answers.q3, answers.q4, answers.q5];
  const difficulty = "beginner";
  const count = 3;

  const prompt = `You are a sustainability assistant. Generate ${count} simple, actionable, and unique sustainable tasks for a user.
The user has previously been assigned the following tasks: ${previousTaskTitles.join(", ")}.
It is CRITICAL that you do not repeat any of the tasks from the list above.
The tasks should be related to topics the user is interested in: ${topics.join(", ")}.
The user's difficulty preference is ${difficulty}.
The generated tasks must be fundamentally different from the previous tasks, not just rephrased.
Format the output as a single JSON array of strings, where each string is a task title.
Example: ["Unplug chargers when not in use", "Use a reusable water bottle", "Switch to LED light bulbs"]
Do not include any other text, comments, or formatting. The output must be ONLY the JSON array.`;

  console.log("Generating tasks with prompt:", prompt);

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