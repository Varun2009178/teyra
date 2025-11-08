import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal, currentHabits, wakeUpTime, sleepTime, workHours } = await request.json();

    const prompt = `You are Teyra Brain, an expert AI routine designer. A user wants to build this habit/goal:

GOAL: "${goal}"

USER CONTEXT:
- Wake up time: ${wakeUpTime || '7:00 AM'}
- Sleep time: ${sleepTime || '11:00 PM'}
- Work hours: ${workHours || '9 AM - 5 PM'}
- Current habits: ${currentHabits || 'None provided'}

Create a SUPER DETAILED, PREMIUM-QUALITY daily routine that maps out EVERY HOUR of their day to help them achieve this goal. This should be so comprehensive and personalized that users would happily pay for it.

Your response MUST be a JSON object with this EXACT structure:
{
  "routine": {
    "title": "Brief title for this routine",
    "description": "2-3 sentence overview of how this routine will transform their life",
    "timeline": [
      {
        "time": "7:00 AM",
        "duration": "30 min",
        "activity": "Name of activity",
        "category": "morning|work|exercise|learning|evening|sleep",
        "description": "Detailed description of what to do and why",
        "tips": ["Actionable tip 1", "Actionable tip 2"],
        "checkIn": "Question to ask user at this time"
      }
    ],
    "weeklyCheckIns": [
      {
        "day": "Monday",
        "checkIn": "Specific question or reflection prompt"
      }
    ],
    "metrics": {
      "dailyFocusTime": "Number",
      "weeklyGoalHours": "Number",
      "targetStreak": "Number"
    },
    "aiCoachTips": [
      "Premium tip 1 about optimizing this routine",
      "Premium tip 2 about staying consistent",
      "Premium tip 3 about measuring progress"
    ]
  }
}

IMPORTANT REQUIREMENTS:
1. Map out EVERY SINGLE HOUR from wake time to sleep time
2. Include specific times, durations, and detailed instructions
3. Add micro-habits throughout the day that support the main goal
4. Include check-in questions at key moments
5. Provide science-backed reasoning for each activity
6. Include energy management (when to do intense vs light tasks)
7. Add buffer time for flexibility
8. Include wind-down and preparation routines
9. Make it feel PREMIUM - this should blow their mind
10. Include weekly patterns and progression

Generate the routine now. Return ONLY valid JSON, no other text.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 8000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const routineData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(routineData);
  } catch (error: any) {
    console.error('Error generating routine:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate routine' },
      { status: 500 }
    );
  }
}
