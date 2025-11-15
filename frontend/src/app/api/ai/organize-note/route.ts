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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check if GROQ API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not configured, returning default values');
      return NextResponse.json({
        title: 'untitled',
        tags: [],
        summary: ''
      });
    }

    // Use Groq AI to auto-generate title and tags
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that helps organize notes for gen z users.

Your job is to:
1. Generate a short, lowercase title (max 50 chars)
2. Extract 2-4 relevant lowercase tags
3. Create a one-line summary

Return ONLY valid JSON:
{
  "title": "short descriptive title",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "one line summary"
}

Rules:
- MUST be lowercase
- Title should be catchy but descriptive
- Tags should be simple (work, school, ideas, personal, code, etc)
- Summary is ONE sentence max
- Keep it gen z friendly and casual`
        },
        {
          role: 'user',
          content: `Organize this note:\n\n${content.slice(0, 500)}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    let result;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                       responseText.match(/(\{[\s\S]*?\})/);

      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        result = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json({
        title: 'untitled',
        tags: [],
        summary: ''
      });
    }

    // Ensure lowercase
    return NextResponse.json({
      title: (result.title || 'untitled').toLowerCase(),
      tags: (result.tags || []).map((t: string) => t.toLowerCase()),
      summary: (result.summary || '').toLowerCase()
    });

  } catch (error) {
    console.error('Error organizing note:', error);
    return NextResponse.json({
      title: 'untitled',
      tags: [],
      summary: ''
    }, { status: 500 });
  }
}
