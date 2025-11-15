import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build',
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧠 Mood task generation request received');
    console.log('GROQ API Key configured:', !!process.env.GROQ_API_KEY);
    
    const user = await currentUser();
    if (!user?.id) {
      console.log('❌ Unauthorized request - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { mood, existingTasks } = body;
    
    console.log('📝 Request data:', { mood, existingTasksCount: existingTasks?.length || 0 });
    
    if (!mood || typeof mood !== 'string') {
      console.log('❌ Invalid mood provided:', mood);
      return NextResponse.json({ error: 'Mood is required and must be a string' }, { status: 400 });
    }

    // If GROQ API is not configured, return fallback tasks immediately
    if (!process.env.GROQ_API_KEY) {
      console.log('⚠️ GROQ API not configured, using fallback tasks');
      const fallbackTasks = getFallbackTasks(mood);
      return NextResponse.json({ 
        tasks: fallbackTasks,
        source: 'fallback',
        message: 'AI service not configured, using curated tasks'
      });
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

    // Create context about existing tasks
    const existingTasksContext = existingTasks && existingTasks.length > 0 
      ? `\n\nExisting tasks they already have:\n${existingTasks.map((task: any) => `- ${task.title}`).join('\n')}\n\nAvoid suggesting tasks that are too similar to what they already have.`
      : '';

    const prompt = `Generate exactly 3 task suggestions for someone who is feeling ${mood}. 

Context: The person is feeling ${mood}, so suggest ${moodDescription}.${existingTasksContext}

Rules:
- MUST be exactly 3 tasks, no more, no less
- Each task should be 5-12 words maximum
- Tasks should be specific and actionable
- Match the mood's energy level and mindset
- Include time estimates when helpful (e.g., "for 15 minutes", "for 30 minutes")
- Make tasks feel achievable and appropriate for the mood
- Be encouraging and positive
- Don't duplicate or closely mirror existing tasks

Return ONLY the tasks as a JSON array of exactly 3 strings, like:
["Task 1 text", "Task 2 text", "Task 3 text"]

Example for "energized":
["Tackle that big project you've been avoiding", "Organize your entire workspace completely", "Learn something challenging for 45 minutes"]

Example for "tired":
["Do gentle stretches for 5 minutes", "Prepare tomorrow's clothes and snacks", "Listen to a calming podcast"]`;

    console.log('🤖 Calling GROQ API for mood-based tasks...');
    
    const completion = await getGroqClient().chat.completions.create({
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
    console.log('🤖 GROQ API response received:', response?.substring(0, 100) + '...');
    
    if (!response) {
      console.log('❌ No response from GROQ API');
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let tasks;
    try {
      // Clean the response - remove any markdown formatting
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      tasks = JSON.parse(cleanResponse);
      
      // Validate it's an array of strings
      if (!Array.isArray(tasks) || !tasks.every(task => typeof task === 'string')) {
        console.log('❌ Invalid AI response format:', tasks);
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
      
      console.log('✅ Successfully generated AI tasks:', tasks);
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', response, parseError);
      
      // Use fallback tasks
      tasks = getFallbackTasks(mood);
      console.log('🔄 Using fallback tasks instead:', tasks);
    }

    return NextResponse.json({ 
      tasks,
      source: 'ai',
      mood: mood
    });
    
  } catch (error) {
    console.error('❌ Error in mood task generation:', error);
    
    // Fallback response
    const { mood } = await request.json().catch(() => ({ mood: 'calm' }));
    const fallbackTasks = getFallbackTasks(mood);
    
    console.log('🔄 Returning fallback tasks due to error:', fallbackTasks);
    
    return NextResponse.json({
      tasks: fallbackTasks,
      source: 'fallback_error',
      mood: mood,
      error: 'AI service temporarily unavailable'
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