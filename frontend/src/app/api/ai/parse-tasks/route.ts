import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Use Groq to parse the text and extract actionable tasks
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant specialized in extracting actionable tasks from text.

Your job is to:
1. Identify all actionable items (things that need to be done)
2. Make each task title start with an action verb (send, schedule, review, complete, etc.)
3. Keep tasks concise and clear (max 80 characters)
4. Use lowercase for everything

Return ONLY a valid JSON array with this exact format:
[
  {
    "title": "action-focused task description"
  }
]

Rules:
- MUST start each task with a lowercase action verb
- NO vague tasks like "the presentation" - make it "complete the presentation slides"
- If text contains no actionable items, return empty array []
- Only include tasks that require action from the user
- Don't include FYI items or informational statements
- Keep it simple and clean, like notion tasks`
        },
        {
          role: 'user',
          content: `Extract actionable tasks from this text:\n\n${text}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Try to parse the JSON response
    let tasks = [];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ||
                       responseText.match(/(\[[\s\S]*?\])/);

      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[1]);
      } else {
        tasks = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse tasks from AI response', tasks: [] },
        { status: 500 }
      );
    }

    // Validate and sanitize tasks
    const validTasks = tasks
      .filter((task: any) => task.title && typeof task.title === 'string')
      .map((task: any) => ({
        title: task.title.trim().toLowerCase().slice(0, 200)
      }));

    // Increment daily_parses counter for usage tracking (only for free users)
    try {
      // Check Pro status
      let isPro = false;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
        if (!baseUrl) {
          throw new Error('NEXT_PUBLIC_APP_URL must be configured in production');
        }
        const subResponse = await fetch(`${baseUrl}/api/subscription/status`, {
          headers: {
            'Authorization': `Bearer ${userId}`
          }
        });

        if (subResponse.ok) {
          const subData = await subResponse.json();
          isPro = subData.isPro || false;
        }
      } catch (error) {
        console.warn('Could not check Pro status for increment, assuming free user:', error);
      }

      // Only increment for non-Pro users
      if (!isPro) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: userProgress } = await supabase
          .from('user_progress')
          .select('daily_parses')
          .eq('user_id', userId)
          .single();

        const newParseCount = (userProgress?.daily_parses || 0) + 1;
        await supabase
          .from('user_progress')
          .update({ daily_parses: newParseCount })
          .eq('user_id', userId);

        console.log(`📊 Incremented daily_parses for user ${userId}: ${newParseCount}`);
      } else {
        console.log(`👑 Pro user ${userId} - skipping parse increment (unlimited)`);
      }
    } catch (error) {
      console.error('Failed to increment daily_parses counter:', error);
      // Don't fail the request if counter update fails
    }

    return NextResponse.json({
      success: true,
      tasks: validTasks
    });

  } catch (error) {
    console.error('Error parsing tasks:', error);
    return NextResponse.json(
      { error: 'Failed to parse tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
