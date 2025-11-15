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

    const { currentTasks, completedToday, timeOfDay } = await request.json();

    const prompt = `You are a productivity AI. Suggest the SINGLE best task to work on next.

Context:
- Time: ${timeOfDay}
- Tasks completed today: ${completedToday}
- Pending tasks:
${currentTasks.map((t: any, i: number) => `${i + 1}. ${t.title}${t.dueDate ? ' (due: ' + new Date(t.dueDate).toLocaleDateString() + ')' : ''}`).join('\n')}

Consider:
- Urgency (due dates)
- Time of day (deep work vs administrative tasks)
- Energy levels (morning = creative, afternoon = meetings/admin)
- Task dependencies and natural order

Respond with ONLY a JSON object:
{
  "taskTitle": "the exact task title to work on",
  "reason": "brief 1-sentence reason why"
}`;

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a productivity assistant. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '{}';

    let suggestion;
    try {
      suggestion = JSON.parse(content);
    } catch {
      suggestion = {
        taskTitle: currentTasks[0]?.title || 'Take a break',
        reason: 'Start with the first task on your list',
      };
    }

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('error suggesting task:', error);
    return NextResponse.json(
      { error: 'failed to suggest task' },
      { status: 500 }
    );
  }
}
