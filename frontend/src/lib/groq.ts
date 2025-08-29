// Mock implementation of the Groq API for MVP
// This file simulates AI responses without requiring the actual API

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Mock API call that returns predefined responses based on the prompt
export async function callGroqAPI(prompt: string, systemPrompt?: string): Promise<string> {
  console.log("Using mock Groq API implementation");
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Extract key information from the prompt to determine response
  const promptLower = prompt.toLowerCase();
  
  // Handle different types of prompts
  if (promptLower.includes('break') && promptLower.includes('task')) {
    return generateTaskBreakdown(prompt);
  } else if (promptLower.includes('mood') && promptLower.includes('message')) {
    return generateMotivationalMessage(prompt);
  } else if (promptLower.includes('suggest') && promptLower.includes('task')) {
    return generateTaskSuggestion(prompt);
  } else if (promptLower.includes('autopilot') || promptLower.includes('life plan')) {
    return generateLifeAutopilot(prompt);
  } else {
    // Generic response
    return JSON.stringify(["Complete one small task", "Take a short break", "Review your progress"]);
  }
}

// AI Task Breakdown - Generate 3 simple, standalone tasks with mood-aware suggestions
export async function breakDownTask(taskDescription: string, userMood?: string): Promise<string[]> {
  const taskLower = taskDescription.toLowerCase();
  
  // Mood-based energy level adjustments
  const isLowEnergyMood = userMood && ['tired', 'down', 'stressed'].includes(userMood);
  const isHighEnergyMood = userMood && ['happy', 'energetic', 'focused'].includes(userMood);
  
  // More specific task type detection with mood adaptations
  if (taskLower.includes('email') || taskLower.includes('write') || taskLower.includes('letter') || taskLower.includes('message')) {
    if (isLowEnergyMood) {
      return [
        "Start with a simple greeting and main point",
        "Add key details one at a time",
        "Quick proofread and send"
      ];
    } else if (isHighEnergyMood) {
      return [
        "Create detailed outline with all key points",
        "Write comprehensive draft with examples",
        "Polish, refine, and send with confidence"
      ];
    }
    return [
      "Outline main points to cover",
      "Draft the content",
      "Review and send"
    ];
  } else if (taskLower.includes('clean') || taskLower.includes('organize') || taskLower.includes('tidy')) {
    if (isLowEnergyMood) {
      return [
        "Pick up and sort just the most obvious items",
        "Focus on one small area at a time",
        "Put away what you've sorted"
      ];
    } else if (isHighEnergyMood) {
      return [
        "Do a complete declutter and deep clean",
        "Create an organized system for everything",
        "Set up maintenance routines"
      ];
    }
    return [
      "Clear out unnecessary items",
      "Sort and categorize what remains", 
      "Put everything in its proper place"
    ];
  } else if (taskLower.includes('research') || taskLower.includes('study') || taskLower.includes('learn')) {
    if (isLowEnergyMood) {
      return [
        "Find 2-3 reliable sources to start with",
        "Read and take basic notes",
        "Summarize key takeaways"
      ];
    } else if (isHighEnergyMood) {
      return [
        "Create comprehensive research plan with multiple sources",
        "Deep dive into topics with detailed note-taking",
        "Synthesize findings and create actionable insights"
      ];
    }
    return [
      "Identify key topics to explore",
      "Gather and review relevant resources",
      "Take notes and summarize findings"
    ];
  } else if (taskLower.includes('presentation') || taskLower.includes('meeting') || taskLower.includes('talk')) {
    if (isLowEnergyMood) {
      return [
        "Create simple outline with main points",
        "Prepare basic talking points",
        "Do a quick run-through"
      ];
    } else if (isHighEnergyMood) {
      return [
        "Design comprehensive presentation with engaging visuals",
        "Prepare detailed talking points and examples",
        "Practice multiple times and refine delivery"
      ];
    }
    return [
      "Create an outline or agenda",
      "Prepare visual materials or talking points",
      "Practice delivery and timing"
    ];
  } else if (taskLower.includes('project') || taskLower.includes('develop') || taskLower.includes('build')) {
    if (isLowEnergyMood) {
      return [
        "Define basic requirements and first steps",
        "Set up simple workspace or tools",
        "Start with smallest component"
      ];
    } else if (isHighEnergyMood) {
      return [
        "Create detailed project plan with milestones",
        "Set up comprehensive development environment",
        "Begin implementation of core features"
      ];
    }
    return [
      "Define project requirements and scope",
      "Create initial implementation plan",
      "Set up development environment"
    ];
  } else if (taskLower.includes('exercise') || taskLower.includes('workout') || taskLower.includes('fitness')) {
    if (isLowEnergyMood) {
      return [
        "Start with 5-10 minutes of light movement",
        "Focus on gentle stretching or walking",
        "Cool down and hydrate"
      ];
    } else if (isHighEnergyMood) {
      return [
        "Plan an energizing full workout routine",
        "Execute high-intensity exercises with focus",
        "Cool down properly and track progress"
      ];
    }
    return [
      "Plan your workout routine",
      "Execute the main exercises",
      "Cool down and stretch"
    ];
  } else if (taskLower.includes('cook') || taskLower.includes('meal') || taskLower.includes('recipe')) {
    if (isLowEnergyMood) {
      return [
        "Choose a simple recipe with few ingredients",
        "Prep ingredients in batches as you go",
        "Cook and clean up one step at a time"
      ];
    } else if (isHighEnergyMood) {
      return [
        "Plan elaborate meal with multiple components",
        "Prep all ingredients with precision",
        "Cook with attention to technique and plating"
      ];
    }
    return [
      "Plan menu and gather ingredients",
      "Prep and cook the meal",
      "Serve and clean up"
    ];
  } else if (taskLower.includes('shop') || taskLower.includes('buy') || taskLower.includes('purchase')) {
    if (isLowEnergyMood) {
      return [
        "Make simple list of essentials only",
        "Go to nearest store for quick trip",
        "Get what you need and head home"
      ];
    } else if (isHighEnergyMood) {
      return [
        "Research best deals and create detailed shopping list",
        "Visit multiple stores for optimal purchases",
        "Compare prices and make thoughtful choices"
      ];
    }
    return [
      "Create shopping list and check prices",
      "Visit stores and make purchases",
      "Organize and put away items"
    ];
  } else if (taskLower.includes('call') || taskLower.includes('phone') || taskLower.includes('contact')) {
    if (isLowEnergyMood) {
      return [
        "Write down key points to discuss",
        "Make the call when you feel ready",
        "Follow up with any next steps"
      ];
    } else if (isHighEnergyMood) {
      return [
        "Prepare comprehensive talking points and questions",
        "Have engaging conversation with follow-up questions",
        "Document outcomes and plan next steps"
      ];
    }
    return [
      "Prepare what you want to discuss",
      "Make the call",
      "Follow up on any action items"
    ];
  } else {
    // More specific generic subtasks based on mood
    if (isLowEnergyMood) {
      return [
        `Start with the easiest part of "${taskDescription}"`,
        "Take small steps without pressure",
        "Finish what you can and celebrate progress"
      ];
    } else if (isHighEnergyMood) {
      return [
        `Create detailed plan for "${taskDescription}"`,
        "Execute with full focus and energy",
        "Review results and plan improvements"
      ];
    }
    return [
      `Plan how to approach "${taskDescription}"`,
      "Work on the main components",
      "Review and finalize"
    ];
  }
}

// Generate task breakdown based on prompt
function generateTaskBreakdown(prompt: string): string {
  const taskMatch = prompt.match(/["']([^"']+)["']/);
  const moodMatch = prompt.match(/mood is (\w+)/i);
  const task = taskMatch ? taskMatch[1] : "task";
  const mood = moodMatch ? moodMatch[1].toLowerCase() : undefined;
  
  // Use the improved breakDownTask function
  const subtasksPromise = breakDownTask(task, mood);
  
  // Since this is synchronous, we'll use a simplified version
  const taskLower = task.toLowerCase();
  let subtasks: string[];
  
  const isLowEnergyMood = mood && ['tired', 'down', 'stressed'].includes(mood);
  const isHighEnergyMood = mood && ['happy', 'energetic', 'focused'].includes(mood);
  
  if (taskLower.includes('email') || taskLower.includes('write')) {
    if (isLowEnergyMood) {
      subtasks = [
        "Start with a simple greeting and main point",
        "Add key details one at a time",
        "Quick proofread and send"
      ];
    } else if (isHighEnergyMood) {
      subtasks = [
        "Create detailed outline with all key points",
        "Write comprehensive draft with examples",
        "Polish, refine, and send with confidence"
      ];
    } else {
      subtasks = [
        "Outline main points to cover",
        "Draft the content",
        "Review and send"
      ];
    }
  } else if (taskLower.includes('clean') || taskLower.includes('organize')) {
    if (isLowEnergyMood) {
      subtasks = [
        "Pick up and sort just the most obvious items",
        "Focus on one small area at a time",
        "Put away what you've sorted"
      ];
    } else if (isHighEnergyMood) {
      subtasks = [
        "Do a complete declutter and deep clean",
        "Create an organized system for everything",
        "Set up maintenance routines"
      ];
    } else {
      subtasks = [
        "Clear out unnecessary items",
        "Sort and categorize what remains",
        "Put everything in its proper place"
      ];
    }
  } else {
    if (isLowEnergyMood) {
      subtasks = [
        `Start with the easiest part of "${task}"`,
        "Take small steps without pressure",
        "Finish what you can and celebrate progress"
      ];
    } else if (isHighEnergyMood) {
      subtasks = [
        `Create detailed plan for "${task}"`,
        "Execute with full focus and energy",
        "Review results and plan improvements"
      ];
    } else {
      subtasks = [
        `Plan how to approach "${task}"`,
        "Work on the main components",
        "Review and finalize"
      ];
    }
  }
  
  return JSON.stringify(subtasks);
}

// Generate motivational message based on prompt
function generateMotivationalMessage(prompt: string): string {
  const moodMatch = prompt.match(/mood is (\w+)/i);
  const completedMatch = prompt.match(/completed (\d+)/i);
  
  const mood = moodMatch ? moodMatch[1].toLowerCase() : "neutral";
  const completed = completedMatch ? parseInt(completedMatch[1]) : 0;
  
  if (mood.includes('happy') || mood.includes('energized')) {
    if (completed === 0) {
      return "You're in a great mood today! Let's channel that energy into some tasks! 🌟";
    } else if (completed < 3) {
      return "You're on fire today! Keep that awesome momentum going! 🔥";
    } else {
      return "Wow! Look at you crushing those tasks! You're unstoppable today! 🚀";
    }
  } else if (mood.includes('neutral') || mood.includes('okay')) {
    if (completed === 0) {
      return "Ready to tackle some tasks? I'm here to help you get started! 👍";
    } else if (completed < 3) {
      return "Steady progress makes perfect! Each completed task is a win! 🌱";
    } else {
      return "You're making great headway today! Keep up the good work! 🌟";
    }
  } else { // sad/overwhelmed
    if (completed === 0) {
      return "Let's take it one tiny step at a time. You've got this! 💪";
    } else if (completed < 3) {
      return "Each small win counts! I'm proud of your progress today! 🌈";
    } else {
      return "Despite feeling overwhelmed, look at what you've accomplished! That's impressive! 🌟";
    }
  }
}

// Generate task suggestion based on prompt
function generateTaskSuggestion(prompt: string): string {
  const moodMatch = prompt.match(/mood is (\w+)/i);
  const mood = moodMatch ? moodMatch[1].toLowerCase() : "neutral";
  
  if (mood.includes('happy') || mood.includes('energized')) {
    const suggestions = [
      "Tackle that challenging project you've been putting off",
      "Learn something new that excites you",
      "Reach out to someone you haven't talked to in a while",
      "Reorganize your workspace for better productivity",
      "Plan your goals for the next month"
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  } else if (mood.includes('neutral') || mood.includes('okay')) {
    const suggestions = [
      "Clear out your email inbox",
      "Organize your digital files",
      "Create a to-do list for the week",
      "Update your calendar and schedule",
      "Review and prioritize your upcoming tasks"
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  } else { // sad/overwhelmed
    const suggestions = [
      "Take a 10-minute walk to clear your mind",
      "Complete one small, easy task to build momentum",
      "Write down three things you're grateful for",
      "Organize just one small area of your workspace",
      "Take a short break to stretch and breathe deeply"
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }
}

// Generate life autopilot response
function generateLifeAutopilot(prompt: string): string {
  const moodMatch = prompt.match(/mood is (\w+)/i);
  const mood = moodMatch ? moodMatch[1].toLowerCase() : "neutral";
  
  let tasks: string[];
  
  if (mood.includes('happy') || mood.includes('energized')) {
    tasks = [
      "Plan your next big project",
      "Learn a new skill that excites you",
      "Connect with someone important to you"
    ];
  } else if (mood.includes('neutral') || mood.includes('okay')) {
    tasks = [
      "Organize your workspace for better focus",
      "Review and update your calendar",
      "Set goals for the upcoming week"
    ];
  } else { // sad/overwhelmed
    tasks = [
      "Take a short walk outside",
      "Complete one small, easy task",
      "Practice 5 minutes of mindfulness"
    ];
  }
  
  return JSON.stringify({
    message: "Here are some tasks tailored to your current state of mind.",
    tasks: tasks,
    reflection: "Remember that progress comes one step at a time."
  });
}

// Mock implementation of other functions from the original file
export async function suggestClarification(taskDescription: string): Promise<string> {
  return "Could you break this down into smaller steps?";
}

export async function prioritizeTasks(tasks: string[]): Promise<string[]> {
  return [...tasks].sort(() => Math.random() - 0.5);
}

export async function estimateTaskTime(task: string): Promise<{ minutes: number, confidence: string }> {
  return {
    minutes: Math.floor(Math.random() * 30) + 15,
    confidence: "medium"
  };
}

export async function getMotivationalMessage(mood: string): Promise<string> {
  if (mood === 'happy') {
    return "You're on fire today! Keep that momentum going! 🔥";
  } else if (mood === 'neutral') {
    return "Making steady progress! Every task completed is a win! 👍";
  } else {
    return "Let's tackle one small task at a time. You've got this! 💪";
  }
}

export async function suggestQuickWin(mood: string): Promise<string> {
  const suggestions = [
    "Clear your email inbox",
    "Organize your desk",
    "Make a to-do list for tomorrow",
    "Take a 10-minute walk",
    "Drink a glass of water"
  ];
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

export async function analyzeProductivity(completedTasks: number, totalTime: number): Promise<{ efficiency: string, suggestion: string }> {
  return {
    efficiency: "good",
    suggestion: "Try breaking larger tasks into smaller chunks for better focus."
  };
}

export async function suggestBreak(workDuration: number): Promise<{ duration: number, activity: string }> {
  return {
    duration: 5,
    activity: "Take a short walk or do some stretching."
  };
}

export async function reflectOnProgress(completedTasks: number, totalTasks: number): Promise<string> {
  const ratio = completedTasks / totalTasks;
  if (ratio >= 0.8) {
    return "You're making excellent progress! Keep up the great work!";
  } else if (ratio >= 0.5) {
    return "You're making good progress. Keep pushing forward!";
  } else {
    return "You've made a start, which is the most important step. Keep going!";
  }
}

export async function createLifeAutopilot(userMood: string, existingTasks: string[] = []): Promise<{ message: string, tasks: string[], reflection: string }> {
  let tasks: string[];
  
  if (userMood.includes('happy') || userMood.includes('energized')) {
    tasks = [
      "Plan your next big project",
      "Learn a new skill that excites you",
      "Connect with someone important to you"
    ];
  } else if (userMood.includes('neutral') || userMood.includes('okay')) {
    tasks = [
      "Organize your workspace for better focus",
      "Review and update your calendar",
      "Set goals for the upcoming week"
    ];
  } else { // sad/overwhelmed
    tasks = [
      "Take a short walk outside",
      "Complete one small, easy task",
      "Practice 5 minutes of mindfulness"
    ];
  }
  
  return {
    message: "Here are some tasks tailored to your current state of mind.",
    tasks: tasks,
    reflection: "Remember that progress comes one step at a time."
  };
}