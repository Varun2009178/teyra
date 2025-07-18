const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callGroqAPI(prompt: string, systemPrompt?: string): Promise<string> {
  console.log("Calling Groq API with key:", GROQ_API_KEY ? "Present" : "Missing");
  
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not found");
  }

  console.log("Making API request to Groq...");
  
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are a helpful AI assistant that helps users break down tasks and improve productivity. Be concise, actionable, and encouraging."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  console.log("Groq API response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq API error response:", errorText);
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data: GroqResponse = await response.json();
  console.log("Groq API success, response:", data.choices[0].message.content);
  return data.choices[0].message.content;
}

// AI Task Breakdown - Generate 3 simple, standalone tasks
export async function breakDownTask(taskDescription: string, userMood?: string): Promise<string[]> {
  const prompt = `Break this task into exactly 3 simple, standalone tasks. Return ONLY a JSON array with exactly 3 strings, no other text or explanation.

  Task: "${taskDescription}"
  User mood: ${userMood || "neutral"}
  
  Rules:
  - Each task must be a single, simple action
  - No nested tasks or complex multi-step actions
  - Each task should take 5-15 minutes
  - Make them feel achievable and motivating
  - DO NOT include numbers, bullets, or prefixes in the task titles
  - Return clean task titles only
  
  IMPORTANT: Return ONLY a JSON array like this:
  ["Task 1", "Task 2", "Task 3"]
  
  Examples:
  - "Clean the house and organize everything" → ["Wipe down kitchen counters", "Sort laundry into piles", "Clear desk surface"]
  - "Go to Miami and come back" → ["Book flight to Miami", "Pack travel essentials", "Return home safely"]
  - "Study for exam" → ["Review chapter 1", "Practice problems", "Create study notes"]
  
  DO NOT include any text before or after the JSON array.`;

  try {
    const response = await callGroqAPI(prompt);
    console.log("Raw AI response:", response);
    console.log("Response type:", typeof response);
    console.log("Response length:", response.length);
    
    // Try to parse as JSON
    try {
      const steps = JSON.parse(response);
      if (Array.isArray(steps) && steps.length > 0) {
        // Clean the tasks to remove any numbers or prefixes
        const cleanedSteps = steps.slice(0, 3).map((step: string) => {
          return step
            .replace(/^\d+\.\s*/, '') // Remove leading numbers like "1. "
            .replace(/^[-*•]\s*/, '') // Remove bullets
            .replace(/^["']|["']$/g, '') // Remove quotes
            .trim();
        });
        console.log("Cleaned steps:", cleanedSteps);
        return cleanedSteps;
      }
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      console.log("Response was not valid JSON:", response);
    }
    
    // If JSON parsing fails, try to extract tasks from text response
    console.log("Attempting to extract tasks from text response...");
    
    // Try to find JSON-like patterns in the response
    const jsonMatch = response.match(/\[.*\]/);
    if (jsonMatch) {
      try {
        const extractedJson = JSON.parse(jsonMatch[0]);
        if (Array.isArray(extractedJson) && extractedJson.length > 0) {
          console.log("Found JSON in text:", extractedJson);
          const cleanedSteps = extractedJson.slice(0, 3).map((step: string) => {
            return step
              .replace(/^\d+\.\s*/, '')
              .replace(/^[-*•]\s*/, '')
              .replace(/^["']|["']$/g, '')
              .trim();
          });
          return cleanedSteps;
        }
      } catch (e) {
        console.log("Failed to parse extracted JSON:", e);
      }
    }
    
    // Try to extract from lines
    const lines = response.split('\n').filter(line => line.trim());
    console.log("Lines found:", lines);
    
    const potentialTasks = lines
      .map(line => line
        .replace(/^[-*•]\s*/, '') // Remove bullets
        .replace(/^\d+\.\s*/, '') // Remove numbers
        .replace(/^["']|["']$/g, '') // Remove quotes
        .trim()
      )
      .filter(task => task.length > 0 && task.length < 100 && !task.includes('Example') && !task.includes('NOT:'))
      .slice(0, 3);
    
    console.log("Potential tasks extracted:", potentialTasks);
    
    if (potentialTasks.length > 0) {
      console.log("Extracted tasks from text:", potentialTasks);
      return potentialTasks;
    }
    
    // Fallback: create more specific tasks based on the original
    let fallbackTasks = [];
    
    if (taskDescription.toLowerCase().includes(' and ')) {
      // Split on "and" for compound tasks
      const parts = taskDescription.toLowerCase().split(' and ');
      fallbackTasks = parts.map(part => part.trim()).slice(0, 3);
    } else if (taskDescription.length > 20) {
      // For longer single tasks, create logical steps
      fallbackTasks = [
        `Plan ${taskDescription.toLowerCase()}`,
        `Begin ${taskDescription.toLowerCase()}`,
        `Complete ${taskDescription.toLowerCase()}`
      ];
    } else {
      // For short tasks, don't split
      fallbackTasks = [taskDescription];
    }
    
    console.log("Using fallback tasks:", fallbackTasks);
    return fallbackTasks;
    
  } catch (error) {
    console.error("Error breaking down task:", error);
    // Fallback: create more specific tasks based on the original
    if (taskDescription.toLowerCase().includes(' and ')) {
      // Split on "and" for compound tasks
      const parts = taskDescription.toLowerCase().split(' and ');
      return parts.map(part => part.trim()).slice(0, 3);
    } else if (taskDescription.length > 20) {
      // For longer single tasks, create logical steps
      return [
        `Plan ${taskDescription.toLowerCase()}`,
        `Begin ${taskDescription.toLowerCase()}`,
        `Complete ${taskDescription.toLowerCase()}`
      ];
    } else {
      // For short tasks, don't split
      return [taskDescription];
    }
  }
}

// AI Task Clarification - Make it more specific and energizing
export async function suggestTaskClarification(taskDescription: string): Promise<string> {
  const prompt = `Make this task more specific and energizing in one short sentence. Focus on the most exciting part:

  Original: "${taskDescription}"
  
  More specific and exciting version:`;

  try {
    return await callGroqAPI(prompt);
  } catch (error) {
    console.error("Error suggesting clarification:", error);
    return "";
  }
}

// AI Task Prioritization - Smart priority based on context
export async function prioritizeTasks(tasks: string[], userMood?: string, completedToday?: number): Promise<string[]> {
  const prompt = `Prioritize these tasks for maximum motivation and success. Consider: urgency, effort, user mood, and energy levels. Return only a JSON array of task strings in priority order, no other text:

  Tasks: ${JSON.stringify(tasks)}
  User mood: ${userMood || "neutral"}
  Completed today: ${completedToday || 0}
  
  Prioritize for quick wins and momentum building:`;

  try {
    const response = await callGroqAPI(prompt);
    const prioritized = JSON.parse(response);
    return Array.isArray(prioritized) ? prioritized : tasks;
  } catch (error) {
    console.error("Error prioritizing tasks:", error);
    return tasks;
  }
}

// AI Effort Estimation - Keep it simple and motivating
export async function estimateTaskEffort(taskDescription: string): Promise<{ effort: string; timeEstimate: string }> {
  const prompt = `Give a quick, motivating estimate for this task. Return only a JSON object with "effort" (easy/medium/challenging) and "timeEstimate" (e.g., "10 minutes", "1 hour"), no other text:

  Task: "${taskDescription}"
  
  Keep it encouraging and realistic. Example: {"effort": "easy", "timeEstimate": "15 minutes"}`;

  try {
    const response = await callGroqAPI(prompt);
    const estimation = JSON.parse(response);
    return {
      effort: estimation.effort || "medium",
      timeEstimate: estimation.timeEstimate || "30 minutes"
    };
  } catch (error) {
    console.error("Error estimating effort:", error);
    return { effort: "medium", timeEstimate: "30 minutes" };
  }
}

// AI Motivational Support - Context-aware encouragement
export async function getMotivationalMessage(userMood: string, completedTasks: number, totalTasks?: number, streak?: number): Promise<string> {
  const prompt = `Generate a brief, personalized motivational message. Keep it under 80 characters and be encouraging:

  User mood: ${userMood}
  Completed today: ${completedTasks}
  Total tasks: ${totalTasks || 0}
  Streak: ${streak || 0} days
  
  Make it feel personal and supportive:`;

  try {
    return await callGroqAPI(prompt);
  } catch (error) {
    console.error("Error getting motivational message:", error);
    return "You're doing great! Keep going! 🌵";
  }
}

// AI Quick Win Suggestion - Smart 1-minute wins
export async function suggestQuickWin(availableTasks: string[], userMood?: string): Promise<string> {
  const prompt = `Suggest the perfect 1-minute win from this list. Choose the easiest, most satisfying task that will boost motivation. Return only the task text, no other text:

  Available tasks: ${JSON.stringify(availableTasks)}
  User mood: ${userMood || "neutral"}
  
  Pick the most energizing quick win:`;

  try {
    return await callGroqAPI(prompt);
  } catch (error) {
    console.error("Error suggesting quick win:", error);
    return availableTasks[0] || "Add a simple task to get started!";
  }
}

// AI Task Clarity Check - Detect if task needs clarification
export async function checkTaskClarity(taskDescription: string): Promise<{ needsClarification: boolean; reason: string }> {
  const prompt = `Check if this task is clear and actionable. Return only a JSON object with "needsClarification" (true/false) and "reason" (brief explanation), no other text:

  Task: "${taskDescription}"
  
  Example: {"needsClarification": true, "reason": "Too vague - needs specific steps"} or {"needsClarification": false, "reason": "Clear and actionable"}`;

  try {
    const response = await callGroqAPI(prompt);
    const result = JSON.parse(response);
    return {
      needsClarification: result.needsClarification || false,
      reason: result.reason || "Task looks good!"
    };
  } catch (error) {
    console.error("Error checking task clarity:", error);
    return { needsClarification: false, reason: "Task looks good!" };
  }
}

// AI Daily Planning - Suggest optimal task load
export async function suggestDailyPlanning(tasks: string[], userMood: string, completedToday: number): Promise<{ suggestedTasks: string[]; message: string }> {
  const prompt = `Suggest an optimal daily plan based on user capacity and mood. Return only a JSON object with "suggestedTasks" (array of 3-5 tasks) and "message" (brief encouragement), no other text:

  Available tasks: ${JSON.stringify(tasks)}
  User mood: ${userMood}
  Completed today: ${completedToday}
  
  Focus on achievable, motivating tasks:`;

  try {
    const response = await callGroqAPI(prompt);
    const result = JSON.parse(response);
    return {
      suggestedTasks: Array.isArray(result.suggestedTasks) ? result.suggestedTasks : [],
      message: result.message || "You've got this!"
    };
  } catch (error) {
    console.error("Error suggesting daily planning:", error);
    return { suggestedTasks: [], message: "You've got this!" };
  }
}

// AI Progress Reflection - Celebrate wins and suggest next steps
export async function reflectOnProgress(completedTasks: string[], totalTasks: number, streak: number): Promise<string> {
  const prompt = `Celebrate the user's progress and suggest next steps. Keep it under 100 characters and be encouraging:

  Completed today: ${JSON.stringify(completedTasks)}
  Total tasks: ${totalTasks}
  Streak: ${streak} days
  
  Celebrate wins and motivate:`;

  try {
    return await callGroqAPI(prompt);
  } catch (error) {
    console.error("Error reflecting on progress:", error);
    return "Amazing progress! Keep the momentum going! 🚀";
  }
}

// AI Mood-Based Task Suggestions - Suggest tasks based on user's current mood
export async function suggestMoodBasedTasks(userMood: string, completedToday: number, availableTasks?: string[]): Promise<{ suggestions: string[]; message: string }> {
  const moodPrompts = {
    energized: "You're feeling energized! Suggest 3 high-energy, impactful tasks that will make you feel accomplished. Focus on creative or challenging tasks that match your energy level.",
    focused: "You're in a focused state! Suggest 3 tasks that require concentration and will benefit from your current mental clarity. Think deep work, planning, or complex tasks.",
    neutral: "You're feeling balanced! Suggest 3 moderate tasks that will help you build momentum without overwhelming you. Mix of quick wins and meaningful progress.",
    tired: "You're feeling tired. Suggest 3 gentle, low-effort tasks that will still make you feel productive. Focus on simple, satisfying tasks that won't drain your energy.",
    stressed: "You're feeling stressed. Suggest 3 calming, manageable tasks that will help you feel in control and reduce anxiety. Think organizing, planning, or self-care tasks."
  };

  const prompt = `Based on the user's mood, suggest 3 perfect tasks. Return only a JSON object with "suggestions" (array of 3 task strings) and "message" (brief mood-appropriate encouragement), no other text:

  User mood: ${userMood}
  Completed today: ${completedToday}
  Available tasks: ${availableTasks ? JSON.stringify(availableTasks) : 'none'}
  
  ${moodPrompts[userMood as keyof typeof moodPrompts] || moodPrompts.neutral}
  
  Make suggestions feel personal and mood-appropriate:`;

  try {
    const response = await callGroqAPI(prompt);
    const result = JSON.parse(response);
    return {
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      message: result.message || "Here are some tasks perfect for your mood!"
    };
  } catch (error) {
    console.error("Error suggesting mood-based tasks:", error);
    // Fallback suggestions based on mood
    const fallbackSuggestions = {
      energized: ["Start a creative project", "Tackle a challenging task", "Plan something exciting"],
      focused: ["Deep work session", "Review and organize", "Make important decisions"],
      neutral: ["Check off quick wins", "Make steady progress", "Build good habits"],
      tired: ["Simple organization", "Gentle self-care", "Light planning"],
      stressed: ["Declutter your space", "Write down your thoughts", "Take a mindful break"]
    };
    
    return {
      suggestions: fallbackSuggestions[userMood as keyof typeof fallbackSuggestions] || fallbackSuggestions.neutral,
      message: "Here are some tasks perfect for how you're feeling!"
    };
  }
}