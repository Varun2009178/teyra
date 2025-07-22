// Function to split a task into subtasks
export async function splitTask(taskTitle: string): Promise<string[]> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'splitTask',
        data: { taskTitle }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.subtasks || [];
    
  } catch (error) {
    console.error("Error splitting task:", error);
    return ["Break down task", "Work on individual parts", "Review and complete"];
  }
}

// Function to get a motivational message based on mood and progress
export async function getMotivationalMessage(mood: string, completedTasks: number): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getMotivationalMessage',
        data: { mood, completedTasks }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message || getDefaultMessage(mood);
    
  } catch (error) {
    console.error("Error getting motivational message:", error);
    return getDefaultMessage(mood);
  }
}

// Default messages if API fails
function getDefaultMessage(mood: string): string {
  if (mood === 'happy') {
    return "You're on fire today! Keep that momentum going! 🔥";
  } else if (mood === 'neutral') {
    return "Making steady progress! Every task completed is a win! 👍";
  } else {
    return "Let's tackle one small task at a time. You've got this! 💪";
  }
}

// Function to suggest a task based on user's mood
export async function suggestTask(mood: string, existingTasks: string[]): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'suggestTask',
        data: { mood, existingTasks }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestion || "";
    
  } catch (error) {
    console.error("Error suggesting task:", error);
    if (mood === 'happy') {
      return "Tackle that challenging project you've been putting off";
    } else if (mood === 'neutral') {
      return "Organize your workspace for better focus";
    } else {
      return "Take a 10-minute walk to clear your mind";
    }
  }
}

// Function to generate multiple tasks based on mood and explanation
export async function generateTasksFromMood(mood: string, explanation: string, existingTasks: string[]): Promise<string[]> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generateTasksFromMood',
        data: { mood, explanation, existingTasks }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.tasks || [];
    
  } catch (error) {
    console.error("Error generating tasks from mood:", error);
    // Fallback suggestions based on mood
    const fallbackTasks = {
      overwhelmed: [
        "Break down one big task into 3 smaller steps",
        "Take a 10-minute break to clear your mind",
        "Write down your top 3 priorities for today"
      ],
      tired: [
        "Take a short 15-minute power nap",
        "Do some light stretching or walking",
        "Complete one simple task to build momentum"
      ],
      stressed: [
        "Practice 5 deep breathing exercises",
        "Write down what's causing stress",
        "Take a short walk outside"
      ],
      neutral: [
        "Organize your workspace for better focus",
        "Review and update your task list",
        "Take a moment to plan your next steps"
      ],
      focused: [
        "Tackle your most challenging task now",
        "Set a timer for focused work",
        "Review your progress and celebrate wins"
      ],
      excited: [
        "Channel your energy into a creative project",
        "Reach out to someone you haven't talked to",
        "Start working on a goal you're passionate about"
      ],
      energized: [
        "Tackle that challenging project you've been putting off",
        "Learn something new that excites you",
        "Help someone else with their tasks"
      ]
    };

    return fallbackTasks[mood as keyof typeof fallbackTasks] || [
      "Complete one task that will make you feel accomplished",
      "Take a moment to reflect on your progress",
      "Do something kind for yourself today"
    ];
  }
}