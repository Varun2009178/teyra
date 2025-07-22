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

// AI Task Breakdown - Generate 3 simple, standalone tasks
export async function breakDownTask(taskDescription: string, userMood?: string): Promise<string[]> {
  const taskLower = taskDescription.toLowerCase();
  
  // Common subtask patterns based on task type
  if (taskLower.includes('email') || taskLower.includes('write')) {
    return [
      "Outline main points to cover",
      "Draft the content",
      "Review and send"
    ];
  } else if (taskLower.includes('clean') || taskLower.includes('organize')) {
    return [
      "Clear out unnecessary items",
      "Sort and categorize what remains",
      "Put everything in its proper place"
    ];
  } else if (taskLower.includes('research') || taskLower.includes('study')) {
    return [
      "Identify key topics to explore",
      "Gather and review relevant resources",
      "Take notes and summarize findings"
    ];
  } else if (taskLower.includes('presentation') || taskLower.includes('meeting')) {
    return [
      "Create an outline or agenda",
      "Prepare visual materials or talking points",
      "Practice delivery and timing"
    ];
  } else if (taskLower.includes('project') || taskLower.includes('develop')) {
    return [
      "Define project requirements and scope",
      "Create initial implementation plan",
      "Set up development environment"
    ];
  } else {
    // Generic subtasks for any task
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
  const task = taskMatch ? taskMatch[1] : "task";
  
  const taskLower = task.toLowerCase();
  let subtasks: string[];
  
  if (taskLower.includes('email') || taskLower.includes('write')) {
    subtasks = [
      "Outline main points to cover",
      "Draft the content",
      "Review and send"
    ];
  } else if (taskLower.includes('clean') || taskLower.includes('organize')) {
    subtasks = [
      "Clear out unnecessary items",
      "Sort and categorize what remains",
      "Put everything in its proper place"
    ];
  } else {
    subtasks = [
      `Plan how to approach "${task}"`,
      "Work on the main components",
      "Review and finalize"
    ];
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