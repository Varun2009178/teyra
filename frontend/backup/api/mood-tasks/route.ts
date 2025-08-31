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

    const { mood } = await request.json();
    
    if (!mood || typeof mood !== 'string') {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    const moodPrompts: Record<string, string> = {
      energized: "high-energy, challenging tasks that require focus and drive",
      focused: "deep-work tasks that require concentration and clear thinking", 
      creative: "creative, artistic, or innovative tasks that inspire imagination",
      calm: "peaceful, mindful tasks that promote relaxation and reflection",
      motivated: "ambitious, goal-oriented tasks that build momentum",
      tired: "gentle, low-energy tasks that are still productive but not overwhelming",
      overwhelmed: "simple, grounding tasks that help reduce stress and create clarity",
      procrastinating: "easy, quick-win tasks that help build momentum and motivation"
    };

    const moodDescription = moodPrompts[mood] || moodPrompts.calm;

    const prompt = `Generate exactly 3 task suggestions for someone who is feeling ${mood}. 

Context: The person is feeling ${mood}, so suggest ${moodDescription}.

Rules:
- MUST be exactly 3 tasks, no more, no less
- Each task should be 5-12 words maximum
- Tasks should be specific and actionable
- Match the mood's energy level and mindset
- Include time estimates when helpful (e.g., "for 15 minutes", "for 30 minutes")
- Make tasks feel achievable and appropriate for the mood
- Be encouraging and positive

Return ONLY the tasks as a JSON array of exactly 3 strings, like:
["Task 1 text", "Task 2 text", "Task 3 text"]

Example for "energized":
["Tackle that big project you've been avoiding", "Organize your entire workspace completely", "Learn something challenging for 45 minutes"]

Example for "tired":
["Do gentle stretches for 5 minutes", "Prepare tomorrow's clothes and snacks", "Listen to a calming podcast"]`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a productivity coach who suggests tasks perfectly matched to people's current mood and energy level. Always respond with valid JSON array format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let tasks;
    try {
      tasks = JSON.parse(response);
      
      // Validate it's an array of strings
      if (!Array.isArray(tasks) || !tasks.every(task => typeof task === 'string')) {
        throw new Error('Invalid response format');
      }
      
      // Ensure exactly 3 tasks
      if (tasks.length > 3) {
        tasks = tasks.slice(0, 3);
      } else if (tasks.length < 3) {
        // Pad with mood-appropriate fallback tasks if needed
        const fallbackTasks = getFallbackTasks(mood);
        while (tasks.length < 3 && fallbackTasks.length > 0) {
          tasks.push(fallbackTasks.pop()!);
        }
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      
      // Use fallback tasks
      tasks = getFallbackTasks(mood);
    }

    return NextResponse.json({ tasks });
    
  } catch (error) {
    console.error('Error in mood task generation:', error);
    
    // Fallback response
    const { mood } = await request.json().catch(() => ({ mood: 'calm' }));
    return NextResponse.json({
      tasks: getFallbackTasks(mood)
    });
  }
}

function getFallbackTasks(mood: string): string[] {
  const fallbacks: Record<string, string[]> = {
    energized: [
      "Tackle that big project you've been avoiding",
      "Organize your entire workspace completely",
      "Learn something challenging for 45 minutes"
    ],
    focused: [
      "Complete your most important task today",
      "Plan out next week's detailed priorities",
      "Finish reading that book you started"
    ],
    creative: [
      "Brainstorm 10 wild ideas for your project",
      "Create something beautiful with your hands",
      "Write freely in a journal for 20 minutes"
    ],
    calm: [
      "Practice mindful breathing for 10 minutes",
      "Take a peaceful walk in nature",
      "Organize your digital photos thoughtfully"
    ],
    motivated: [
      "Start that project you've been planning",
      "Reach out to someone important to you",
      "Set 3 ambitious goals for this month"
    ],
    tired: [
      "Do gentle stretches for 5 minutes",
      "Prepare healthy snacks for tomorrow",
      "Listen to a soothing podcast"
    ],
    overwhelmed: [
      "List 3 things you're grateful for today",
      "Break your biggest task into tiny steps",
      "Do one small thing to help future you"
    ],
    procrastinating: [
      "Set a 5-minute timer and start anything",
      "Clear your workspace of all distractions",
      "Choose your easiest task and do it now"
    ]
  };
  
  return fallbacks[mood] || fallbacks.calm;
}