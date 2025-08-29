import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }
    
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incompleteTasks, reason, completedTasks, totalTasks, timeOfDay } = await request.json();
    
    if (!incompleteTasks || !Array.isArray(incompleteTasks)) {
      return NextResponse.json({ error: 'Incomplete tasks are required' }, { status: 400 });
    }

    // Create AI prompt based on the incomplete tasks and user's situation
    const prompt = `The user has been real about their productivity today. Here's the situation:

INCOMPLETE TASKS:
${incompleteTasks.map((task: any, i: number) => `${i + 1}. "${task.title}"`).join('\n')}

CONTEXT:
- Total tasks today: ${totalTasks}
- Completed: ${completedTasks}
- Time of day: ${timeOfDay}h
- User's reason: ${reason || 'Not specified'}

As Mike the Cactus, your job is to:
1. Analyze WHY these tasks weren't completed (be specific about each task)
2. Suggest 3-5 BETTER, more realistic replacement tasks
3. Give actionable advice for tomorrow
4. Be encouraging but honest

Your response should be in this JSON format:
{
  "analysis": "2-3 sentences analyzing what went wrong with these specific tasks",
  "suggestions": [
    "Replacement task 1 (3-8 words)",
    "Replacement task 2 (3-8 words)", 
    "Replacement task 3 (3-8 words)"
  ],
  "advice": "1-2 sentences of practical advice for tomorrow",
  "encouragement": "1 sentence of motivation from Mike"
}

Be specific about the tasks, don't give generic advice. Look at the actual task titles and suggest realistic alternatives.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are Mike the Cactus, a wise and encouraging productivity companion. You help users analyze their incomplete tasks and suggest better alternatives. Be specific, practical, and supportive. Always respond in valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      max_tokens: 400,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let aiResponse;
    try {
      aiResponse = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      // Fallback response
      aiResponse = {
        analysis: "These tasks might have been too ambitious for today. That's totally normal!",
        suggestions: [
          "Break down one big task",
          "Set a 15-minute timer", 
          "Choose your easiest task first"
        ],
        advice: "Tomorrow, try starting with smaller, more specific goals.",
        encouragement: "Mike believes every incomplete task is a learning opportunity! 🌵"
      };
    }

    return NextResponse.json(aiResponse);
    
  } catch (error) {
    console.error('Error in AI Be Real analysis:', error);
    
    // Fallback response
    return NextResponse.json({
      analysis: "Sometimes our ambitions outpace our energy, and that's perfectly human!",
      suggestions: [
        "Pick one task to focus on",
        "Set a 10-minute timer",
        "Celebrate small wins"
      ],
      advice: "Tomorrow, try breaking tasks into smaller pieces.",
      encouragement: "Mike thinks you're doing great by being honest! 🌵💚"
    });
  }
}