import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

// Lazy initialization to avoid build-time errors
function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build'
  });
}
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { input } = await request.json();

    const prompt = `You are a task parser. Extract task details from natural language input.

Input: "${input}"

Extract and return ONLY a JSON object with these fields:
- title: the task description (string)
- dueDate: ISO date string or null if no date mentioned
- tags: array of tags/projects mentioned (look for #hashtags or project names)
- recurring: object with { frequency: 'daily'|'weekly'|'monthly'|null, time: string|null } if recurring pattern detected
- timeBlock: number of hours if time duration mentioned (e.g., "2 hours" -> 2)

Examples:
"remind me to call john tomorrow at 3pm" -> { title: "call john", dueDate: "tomorrow 3pm", tags: [], recurring: null, timeBlock: null }
"weekly standup every monday at 9am" -> { title: "weekly standup", dueDate: null, tags: [], recurring: { frequency: "weekly", time: "09:00" }, timeBlock: 1 }
"work on #project-x for 2 hours" -> { title: "work on project-x", dueDate: null, tags: ["project-x"], recurring: null, timeBlock: 2 }
"buy groceries next week" -> { title: "buy groceries", dueDate: "next week", tags: [], recurring: null, timeBlock: null }

Return ONLY valid JSON, nothing else.`;

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a task parsing assistant. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '{}';

    let parsedTask;
    try {
      parsedTask = JSON.parse(content);
    } catch {
      // Fallback if AI doesn't return valid JSON
      parsedTask = {
        title: input,
        dueDate: null,
        tags: [],
        recurring: null,
        timeBlock: null,
      };
    }

    // Convert relative dates to actual dates
    if (parsedTask.dueDate) {
      parsedTask.dueDate = parseDueDate(parsedTask.dueDate);
    }

    return NextResponse.json({ task: parsedTask });
  } catch (error) {
    console.error('error parsing task:', error);
    return NextResponse.json(
      { error: 'failed to parse task' },
      { status: 500 }
    );
  }
}

function parseDueDate(dateString: string): string | null {
  const now = new Date();
  const lower = dateString.toLowerCase();

  // Tomorrow
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Extract time if present
    const timeMatch = dateString.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();

      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      tomorrow.setHours(hours, minutes, 0, 0);
    }

    return tomorrow.toISOString();
  }

  // Next week
  if (lower.includes('next week')) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString();
  }

  // Next Monday, Tuesday, etc.
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      const targetDay = i;
      const currentDay = now.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;

      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysUntil);
      return targetDate.toISOString();
    }
  }

  // Today
  if (lower.includes('today')) {
    return now.toISOString();
  }

  return null;
}
