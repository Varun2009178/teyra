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

    const { tasks, streak, completedToday } = await request.json();

    const completedTasks = tasks.filter((t: any) => t.completed);
    const incompleteTasks = tasks.filter((t: any) => !t.completed);

    const prompt = `you are a thoughtful productivity coach. analyze this user's progress:

completed today: ${completedToday}
current streak: ${streak} days
completed tasks: ${completedTasks.map((t: any) => t.title).join(', ') || 'none yet'}
incomplete tasks: ${incompleteTasks.length}

provide a brief, encouraging reflection (2-3 sentences max). be:
- genuine and supportive
- specific to their progress
- motivating without being cheesy
- lowercase and professional

focus on patterns, consistency, or next steps.`;

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'you are a supportive productivity coach. keep responses brief, genuine, and lowercase.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const insights = completion.choices[0]?.message?.content?.trim() ||
      'nice work today. keep the momentum going.';

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('error reflecting:', error);
    return NextResponse.json(
      { error: 'failed to generate insights' },
      { status: 500 }
    );
  }
}
