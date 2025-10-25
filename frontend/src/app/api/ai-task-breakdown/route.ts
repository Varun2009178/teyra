import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';
import { createTask, deleteTask } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }
    
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskTitle, originalTaskId } = await request.json();
    
    if (!taskTitle || typeof taskTitle !== 'string') {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }
    
    if (!originalTaskId) {
      return NextResponse.json({ error: 'Original task ID is required' }, { status: 400 });
    }

    // Only split tasks that are long enough to benefit from splitting
    if (taskTitle.length < 40) {
      return NextResponse.json({ error: 'Task too short for smart splitting. Try longer, more complex tasks.' }, { status: 400 });
    }

    const prompt = `Break down this task into exactly 3 smaller, actionable steps: "${taskTitle}"

Rules:
- MUST be exactly 3 steps, no more, no less
- Each step should be 4-10 words maximum  
- Steps should be specific and actionable
- Order them logically (first to last)
- Make them time-bound when possible (e.g., "15 minutes", "5 items")
- Each step should feel achievable in 10-45 minutes
- Focus on the most essential actions only

Return ONLY the steps as a JSON array of exactly 3 strings, like:
["Step 1 text", "Step 2 text", "Step 3 text"]

Example:
For "Plan birthday party" you might return:
["Create guest list (10 people)", "Choose venue and date", "Send invitations this week"]`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a productivity expert who breaks down complex tasks into simple, actionable steps. Always respond with valid JSON array format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let steps;
    try {
      steps = JSON.parse(response);
      
      // Validate it's an array of strings
      if (!Array.isArray(steps) || !steps.every(step => typeof step === 'string')) {
        throw new Error('Invalid response format');
      }
      
      // Ensure exactly 3 steps
      if (steps.length > 3) {
        steps = steps.slice(0, 3);
      } else if (steps.length < 3) {
        // Pad with generic steps if needed
        while (steps.length < 3) {
          steps.push(`Continue working on: ${taskTitle.slice(0, 25)}...`);
        }
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      
      // Fallback breakdown - exactly 3 steps
      steps = [
        `Start working on: ${taskTitle.slice(0, 25)}...`,
        "Set a 15-minute timer and focus",
        "Complete and review the work"
      ];
    }

    // Now create the split tasks in the database and delete the original
    try {
      // Delete the original task first
      await deleteTask(originalTaskId);
      
      // Create the split tasks
      const createdTasks = [];
      for (const step of steps) {
        const task = await createTask(user.id, step, undefined, true); // Mark as hasBeenSplit = true
        createdTasks.push(task);
      }
      
      return NextResponse.json({ 
        breakdown: steps,
        createdTasks: createdTasks,
        message: `Successfully split task into ${steps.length} subtasks`
      });
      
    } catch (dbError) {
      console.error('Error creating split tasks:', dbError);
      return NextResponse.json({ 
        error: 'Failed to create split tasks in database',
        breakdown: steps // Still return the breakdown for debugging
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in AI task breakdown:', error);
    
    // Fallback response - exactly 3 steps
    return NextResponse.json({
      breakdown: [
        "Break this into smaller pieces",
        "Set a 10-minute timer and start",
        "Complete and celebrate progress"
      ]
    });
  }
}