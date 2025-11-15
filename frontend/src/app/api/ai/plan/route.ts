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

    const { currentTasks, context, preferences } = await request.json();

    const contextInfo = context || 'general productivity';
    const workHours = preferences?.workHours || '8';
    const priorityLevel = preferences?.priorityLevel || 'balanced';

    const prompt = `you are a productivity ai assistant helping plan someone's day.

CONTEXT: ${contextInfo}

CURRENT INCOMPLETE TASKS:
${currentTasks.map((task: string, i: number) => `${i + 1}. ${task}`).join('\n')}

PREFERENCES:
- Available work hours: ${workHours}
- Priority level: ${priorityLevel}

Generate a realistic, achievable day plan with 3-6 tasks. Consider:
- The context they provided
- Their existing tasks
- Natural task sequencing and dependencies
- Energy levels throughout the day
- ${priorityLevel === 'relaxed' ? 'Include buffer time and breaks' : priorityLevel === 'intense' ? 'Maximize productivity with tight scheduling' : 'Balance productivity with sustainable pacing'}
- Make tasks specific and actionable

respond with only a json array of task titles, nothing else. example: ["9:00 AM - Review emails and prioritize", "10:30 AM - Deep work on main project", "1:00 PM - Team meeting prep"]`;

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'you are a helpful productivity assistant. respond only with valid json arrays of strings.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '[]';

    // Parse AI response
    let suggestedTasks: string[] = [];
    try {
      suggestedTasks = JSON.parse(content);
    } catch {
      // Fallback if AI doesn't return valid JSON
      suggestedTasks = ['review priorities', 'take a short break'];
    }

    return NextResponse.json({ suggestedTasks });
  } catch (error) {
    console.error('error planning day:', error);
    return NextResponse.json(
      { error: 'failed to plan day' },
      { status: 500 }
    );
  }
}
