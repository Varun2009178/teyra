import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();
    
    switch (action) {
      case 'splitTask':
        return await handleSplitTask(data.taskTitle);
      case 'getMotivationalMessage':
        return await handleGetMotivationalMessage(data.mood, data.completedTasks);
      case 'suggestTask':
        return await handleSuggestTask(data.mood, data.existingTasks);
      case 'generateTasksFromMood':
        return await handleGenerateTasksFromMood(data.mood, data.explanation, data.existingTasks);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in AI route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSplitTask(taskTitle: string) {
  try {
    // For MVP, we'll use hardcoded responses instead of API calls
    // This simulates AI responses without requiring the API
    const subtasks = generateSubtasks(taskTitle);
    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("Error splitting task:", error);
    return NextResponse.json({ 
      subtasks: ["Break down task", "Work on individual parts", "Review and complete"],
      error: 'Failed to split task'
    });
  }
}

async function handleGetMotivationalMessage(mood: string, completedTasks: number) {
  try {
    // For MVP, we'll use hardcoded responses instead of API calls
    const message = getMotivationalMessage(mood, completedTasks);
    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error getting motivational message:", error);
    return NextResponse.json({ 
      message: getDefaultMessage(mood),
      error: 'Failed to get motivational message'
    });
  }
}

async function handleSuggestTask(mood: string, existingTasks: string[]) {
  try {
    // For MVP, we'll use hardcoded responses instead of API calls
    const suggestion = suggestTask(mood, existingTasks);
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Error suggesting task:", error);
    let fallbackSuggestion;
    if (mood === 'happy') {
      fallbackSuggestion = "Tackle that challenging project you've been putting off";
    } else if (mood === 'neutral') {
      fallbackSuggestion = "Organize your workspace for better focus";
    } else {
      fallbackSuggestion = "Take a 10-minute walk to clear your mind";
    }
    return NextResponse.json({ 
      suggestion: fallbackSuggestion,
      error: 'Failed to suggest task'
    });
  }
}

async function handleGenerateTasksFromMood(mood: string, explanation: string, existingTasks: string[]) {
  try {
    // For MVP, we'll use hardcoded responses instead of API calls
    const tasks = generateTasksFromMood(mood, explanation, existingTasks);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error generating tasks from mood:", error);
    let fallbackTasks;
    
    // Try to extract context from explanation for fallback
    const explanationLower = explanation.toLowerCase();
    
    if (explanationLower.includes('startup') || explanationLower.includes('business')) {
      fallbackTasks = [
        "Conduct customer interviews and gather feedback",
        "Create a pitch deck for investors",
        "Set up financial projections and budgeting",
        "Research competitors and market positioning"
      ];
    } else if (explanationLower.includes('coding') || explanationLower.includes('programming')) {
      fallbackTasks = [
        "Set up the development environment",
        "Create the database schema",
        "Implement the core API endpoints",
        "Design the user interface components"
      ];
    } else if (explanationLower.includes('design') || explanationLower.includes('ui')) {
      fallbackTasks = [
        "Create wireframes for the main user flows",
        "Design the color scheme and typography",
        "Build interactive prototypes",
        "Conduct user testing sessions"
      ];
    } else if (explanationLower.includes('study') || explanationLower.includes('learn')) {
      fallbackTasks = [
        "Create a study schedule for the week",
        "Take detailed notes on the current topic",
        "Practice with hands-on exercises",
        "Review and summarize what you've learned"
      ];
    } else if (mood === 'energized' || mood === 'excited') {
      fallbackTasks = [
        "Tackle that challenging project you've been putting off",
        "Learn something new that excites you",
        "Reach out to someone you haven't talked to in a while",
        "Start working on a goal you're passionate about"
      ];
    } else if (mood === 'focused') {
      fallbackTasks = [
        "Set a timer for focused work and tackle your most important task",
        "Review your progress and celebrate your wins",
        "Create a detailed plan for your next big project"
      ];
    } else if (mood === 'neutral') {
      fallbackTasks = [
        "Organize your workspace for better focus",
        "Review and update your task list",
        "Take a moment to plan your next steps"
      ];
    } else if (mood === 'tired') {
      fallbackTasks = [
        "Take a short 15-minute power nap",
        "Do some light stretching or walking",
        "Complete one simple task to build momentum"
      ];
    } else if (mood === 'stressed') {
      fallbackTasks = [
        "Practice 5 deep breathing exercises",
        "Write down what's causing stress",
        "Take a short walk outside"
      ];
    } else { // overwhelmed
      fallbackTasks = [
        "Break down one big task into 3 smaller steps",
        "Take a 10-minute break to clear your mind",
        "Write down your top 3 priorities for today"
      ];
    }
    return NextResponse.json({ 
      tasks: fallbackTasks,
      error: 'Failed to generate tasks'
    });
  }
}

// Helper functions for generating responses without API calls

function generateSubtasks(taskTitle: string): string[] {
  const taskTitleLower = taskTitle.toLowerCase();
  
  // Common subtask patterns based on task type
  if (taskTitleLower.includes('email') || taskTitleLower.includes('write')) {
    return [
      "Outline main points to cover",
      "Draft the content",
      "Review and send"
    ];
  } else if (taskTitleLower.includes('clean') || taskTitleLower.includes('organize')) {
    return [
      "Clear out unnecessary items",
      "Sort and categorize what remains",
      "Put everything in its proper place"
    ];
  } else if (taskTitleLower.includes('research') || taskTitleLower.includes('study')) {
    return [
      "Identify key topics to explore",
      "Gather and review relevant resources",
      "Take notes and summarize findings"
    ];
  } else if (taskTitleLower.includes('presentation') || taskTitleLower.includes('meeting')) {
    return [
      "Create an outline or agenda",
      "Prepare visual materials or talking points",
      "Practice delivery and timing"
    ];
  } else if (taskTitleLower.includes('project') || taskTitleLower.includes('develop')) {
    return [
      "Define project requirements and scope",
      "Create initial implementation plan",
      "Set up development environment"
    ];
  } else {
    // Generic subtasks for any task
    return [
      `Plan how to approach "${taskTitle}"`,
      "Work on the main components",
      "Review and finalize"
    ];
  }
}

function getMotivationalMessage(mood: string, completedTasks: number): string {
  // Different messages based on mood and completed tasks
  if (mood === 'energized' || mood === 'excited') {
    if (completedTasks === 0) {
      return "You're in a great mood today! Let's channel that energy into some tasks! 🌟";
    } else if (completedTasks < 3) {
      return "You're on fire today! Keep that awesome momentum going! 🔥";
    } else {
      return "Wow! Look at you crushing those tasks! You're unstoppable today! 🚀";
    }
  } else if (mood === 'focused' || mood === 'neutral') {
    if (completedTasks === 0) {
      return "Ready to tackle some tasks? I'm here to help you get started! 👍";
    } else if (completedTasks < 3) {
      return "Steady progress makes perfect! Each completed task is a win! 🌱";
    } else {
      return "You're making great headway today! Keep up the good work! 🌟";
    }
  } else { // overwhelmed, tired, stressed
    if (completedTasks === 0) {
      return "Let's take it one tiny step at a time. You've got this! 💪";
    } else if (completedTasks < 3) {
      return "Each small win counts! I'm proud of your progress today! 🌈";
    } else {
      return "Despite feeling overwhelmed, look at what you've accomplished! That's impressive! 🌟";
    }
  }
}

function getDefaultMessage(mood: string): string {
  if (mood === 'energized' || mood === 'excited') {
    return "You're on fire today! Keep that momentum going! 🔥";
  } else if (mood === 'focused' || mood === 'neutral') {
    return "Making steady progress! Every task completed is a win! 👍";
  } else {
    return "Let's tackle one small task at a time. You've got this! 💪";
  }
}

function suggestTask(mood: string, existingTasks: string[]): string {
  // Different task suggestions based on mood
  if (mood === 'energized' || mood === 'excited') {
    const suggestions = [
      "Tackle that challenging project you've been putting off",
      "Learn something new that excites you",
      "Reach out to someone you haven't talked to in a while",
      "Reorganize your workspace for better productivity",
      "Plan your goals for the next month"
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  } else if (mood === 'focused' || mood === 'neutral') {
    const suggestions = [
      "Clear out your email inbox",
      "Organize your digital files",
      "Create a to-do list for the week",
      "Update your calendar and schedule",
      "Review and prioritize your upcoming tasks"
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  } else if (mood === 'tired') {
    const suggestions = [
      "Take a short 10-minute break to rest",
      "Complete one small, easy task to build momentum",
      "Organize just one small area of your workspace",
      "Write down your thoughts in a journal",
      "Take a short walk to refresh your mind"
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  } else if (mood === 'stressed') {
    const suggestions = [
      "Take 5 deep breaths to center yourself",
      "Write down what's causing stress",
      "Complete one simple task to feel accomplished",
      "Take a short break to stretch and move",
      "Prioritize just 3 most important tasks for today"
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  } else { // overwhelmed
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

function generateTasksFromMood(mood: string, explanation: string, existingTasks: string[]): string[] {
  const suggestions: string[] = [];
  const explanationLower = explanation.toLowerCase();

  // Extract specific projects, companies, or topics mentioned
  const projectMatches = explanation.match(/(?:working on|building|developing|creating)\s+([^,\s]+)/i);
  const companyMatches = explanation.match(/(?:startup|company|business)\s+(?:called\s+)?([^,\s]+)/i);
  const topicMatches = explanation.match(/(?:studying|learning|researching)\s+([^,\s]+)/i);

  // If user mentions a specific project/company, create contextual tasks
  if (projectMatches || companyMatches || topicMatches) {
    const projectName = projectMatches?.[1] || companyMatches?.[1] || topicMatches?.[1];
    
    if (projectName && projectName.toLowerCase() !== 'teyra') {
      // For other projects/companies
      if (mood === 'focused' || mood === 'energized' || mood === 'excited') {
        suggestions.push(`Research market opportunities for ${projectName}`);
        suggestions.push(`Create a business plan outline for ${projectName}`);
        suggestions.push(`Design the user interface for ${projectName}`);
        suggestions.push(`Set up the technical infrastructure for ${projectName}`);
      } else if (mood === 'overwhelmed' || mood === 'stressed') {
        suggestions.push(`Break down ${projectName} into smaller, manageable tasks`);
        suggestions.push(`Prioritize the most critical features for ${projectName}`);
        suggestions.push(`Create a timeline for ${projectName} development`);
      }
    } else if (projectName && projectName.toLowerCase() === 'teyra') {
      // Special handling for Teyra (since it's the current project)
      if (mood === 'focused' || mood === 'energized' || mood === 'excited') {
        suggestions.push("Design the user onboarding flow for Teyra");
        suggestions.push("Implement the task splitting AI feature");
        suggestions.push("Create the mood-based task suggestion system");
        suggestions.push("Set up the database schema for user progress");
        suggestions.push("Design the cactus mood animation system");
        suggestions.push("Implement the milestone achievement system");
      } else if (mood === 'overwhelmed' || mood === 'stressed') {
        suggestions.push("Break down Teyra's core features into smaller tasks");
        suggestions.push("Prioritize the most important user stories");
        suggestions.push("Create a development roadmap for Teyra");
        suggestions.push("Set up project management tools for Teyra");
      }
    }
  }

  // Check for specific activities or domains
  if (explanationLower.includes('startup') || explanationLower.includes('business')) {
    if (mood === 'focused' || mood === 'energized') {
      suggestions.push("Conduct customer interviews and gather feedback");
      suggestions.push("Create a pitch deck for investors");
      suggestions.push("Set up financial projections and budgeting");
      suggestions.push("Research competitors and market positioning");
    } else if (mood === 'overwhelmed' || mood === 'stressed') {
      suggestions.push("Prioritize the top 3 business goals for this week");
      suggestions.push("Break down the business plan into actionable steps");
      suggestions.push("Create a simple project timeline");
    }
  }

  if (explanationLower.includes('coding') || explanationLower.includes('programming') || explanationLower.includes('development')) {
    if (mood === 'focused' || mood === 'energized') {
      suggestions.push("Set up the development environment");
      suggestions.push("Create the database schema");
      suggestions.push("Implement the core API endpoints");
      suggestions.push("Design the user interface components");
    } else if (mood === 'overwhelmed' || mood === 'stressed') {
      suggestions.push("Break down the coding project into smaller modules");
      suggestions.push("Create a simple development roadmap");
      suggestions.push("Set up version control and project structure");
    }
  }

  if (explanationLower.includes('design') || explanationLower.includes('ui') || explanationLower.includes('ux')) {
    if (mood === 'focused' || mood === 'energized') {
      suggestions.push("Create wireframes for the main user flows");
      suggestions.push("Design the color scheme and typography");
      suggestions.push("Build interactive prototypes");
      suggestions.push("Conduct user testing sessions");
    } else if (mood === 'overwhelmed' || mood === 'stressed') {
      suggestions.push("Focus on designing one key feature at a time");
      suggestions.push("Create a simple design system");
      suggestions.push("Prioritize the most important user interfaces");
    }
  }

  if (explanationLower.includes('marketing') || explanationLower.includes('social media') || explanationLower.includes('content')) {
    if (mood === 'focused' || mood === 'energized') {
      suggestions.push("Create a content calendar for the next month");
      suggestions.push("Design social media graphics and templates");
      suggestions.push("Write blog posts or social media content");
      suggestions.push("Set up email marketing campaigns");
    } else if (mood === 'overwhelmed' || mood === 'stressed') {
      suggestions.push("Focus on one marketing channel at a time");
      suggestions.push("Create a simple content strategy");
      suggestions.push("Set up basic social media profiles");
    }
  }

  if (explanationLower.includes('study') || explanationLower.includes('learn') || explanationLower.includes('course')) {
    if (mood === 'focused' || mood === 'energized') {
      suggestions.push("Create a study schedule for the week");
      suggestions.push("Take detailed notes on the current topic");
      suggestions.push("Practice with hands-on exercises");
      suggestions.push("Review and summarize what you've learned");
    } else if (mood === 'overwhelmed' || mood === 'stressed') {
      suggestions.push("Break down the study material into smaller sections");
      suggestions.push("Focus on one topic at a time");
      suggestions.push("Create simple flashcards or study aids");
    }
  }

  if (explanationLower.includes('health') || explanationLower.includes('fitness') || explanationLower.includes('exercise')) {
    if (mood === 'focused' || mood === 'energized') {
      suggestions.push("Create a workout plan for the week");
      suggestions.push("Research healthy meal prep recipes");
      suggestions.push("Set up a fitness tracking system");
      suggestions.push("Schedule regular exercise sessions");
    } else if (mood === 'overwhelmed' || mood === 'stressed') {
      suggestions.push("Start with simple 10-minute daily exercises");
      suggestions.push("Focus on one health goal at a time");
      suggestions.push("Create a basic meal planning system");
    }
  }

  if (explanationLower.includes('creative') || explanationLower.includes('art') || explanationLower.includes('music') || explanationLower.includes('writing')) {
    if (mood === 'focused' || mood === 'energized') {
      suggestions.push("Set up a dedicated creative workspace");
      suggestions.push("Create a portfolio of your best work");
      suggestions.push("Practice your creative skill daily");
      suggestions.push("Share your work with others for feedback");
    } else if (mood === 'overwhelmed' || mood === 'stressed') {
      suggestions.push("Focus on one creative project at a time");
      suggestions.push("Create simple daily creative exercises");
      suggestions.push("Set up a basic creative routine");
    }
  }

  // If no specific context was found, provide mood-based general suggestions
  if (suggestions.length === 0) {
    if (mood === 'energized' || mood === 'excited') {
      suggestions.push("Tackle that challenging project you've been putting off");
      suggestions.push("Learn something new that excites you");
      suggestions.push("Reach out to someone you haven't talked to in a while");
      suggestions.push("Start working on a goal you're passionate about");
    } else if (mood === 'focused') {
      suggestions.push("Set a timer for focused work and tackle your most important task");
      suggestions.push("Review your progress and celebrate your wins");
      suggestions.push("Create a detailed plan for your next big project");
    } else if (mood === 'neutral') {
      suggestions.push("Organize your workspace for better focus");
      suggestions.push("Review and update your task list");
      suggestions.push("Take a moment to plan your next steps");
    } else if (mood === 'tired') {
      suggestions.push("Take a short 15-minute power nap");
      suggestions.push("Do some light stretching or walking");
      suggestions.push("Complete one simple task to build momentum");
    } else if (mood === 'stressed') {
      suggestions.push("Practice 5 deep breathing exercises");
      suggestions.push("Write down what's causing stress");
      suggestions.push("Take a short walk outside");
    } else { // overwhelmed
      suggestions.push("Break down one big task into 3 smaller steps");
      suggestions.push("Take a 10-minute break to clear your mind");
      suggestions.push("Write down your top 3 priorities for today");
    }
  }

  // Return unique suggestions (remove duplicates)
  const uniqueSuggestions = [...new Set(suggestions)];
  return uniqueSuggestions.slice(0, 5); // Return up to 5 tasks
}