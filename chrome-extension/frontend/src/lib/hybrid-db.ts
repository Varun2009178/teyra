// Hybrid database implementation for MVP
// This simulates database operations without requiring a real database connection
// Works in both server and client environments

// In-memory storage for server-side
const tasksStore = new Map<string, any[]>();
const progressStore = new Map<string, any>();

// Helper function to determine environment
const isClient = () => typeof window !== 'undefined';

// Milestone configuration
export const MILESTONES = [
  { threshold: 0, mood: 'overwhelmed', maxValue: 10 },      // Initial milestone - sad cactus
  { threshold: 10, mood: 'neutral', maxValue: 15 },         // After 10 tasks - neutral cactus
  { threshold: 25, mood: 'energized', maxValue: 20 },       // After 25 tasks - happy cactus
  { threshold: 45, mood: 'energized', maxValue: 20 }        // Final milestone (capped) - happy cactus
];

// Helper function to determine current milestone based on all-time completed tasks
export function getCurrentMilestone(allTimeCompleted: number): number {
  console.log(`[getCurrentMilestone] allTimeCompleted: ${allTimeCompleted}`);
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (allTimeCompleted >= MILESTONES[i].threshold) {
      console.log(`[getCurrentMilestone] Found milestone ${i} for ${allTimeCompleted} tasks`);
      return i;
    }
  }
  console.log(`[getCurrentMilestone] Defaulting to milestone 0 for ${allTimeCompleted} tasks`);
  return 0; // Default to first milestone
}

// Task-related operations
export async function getUserTasks(userId: string) {
  console.log(`[DEBUG] getUserTasks called with: userId=${userId}`);
  let userTasks: any[] = [];

  // Always check localStorage first for persistence
  if (isClient()) {
    const key = `tasks_${userId}`;
    userTasks = JSON.parse(localStorage.getItem(key) || '[]');
    console.log(`[DEBUG] Client tasks:`, userTasks.length, 'tasks found');
    console.log(`[DEBUG] localStorage content:`, userTasks.map(t => `${t.id}:${t.completed}`).join(', '));
    
    // Sync to server for consistency
    if (userTasks.length > 0) {
      tasksStore.set(userId, userTasks);
      console.log(`[DEBUG] Synced ${userTasks.length} tasks to server`);
    }
  }
  
  // Fallback to server if no client data
  if (userTasks.length === 0) {
    userTasks = tasksStore.get(userId) || [];
    console.log(`[DEBUG] Server tasks:`, userTasks.length, 'tasks found');
    
    // Sync to client if we have server data
    if (userTasks.length > 0 && isClient()) {
      const key = `tasks_${userId}`;
      localStorage.setItem(key, JSON.stringify(userTasks));
      console.log(`[DEBUG] Synced ${userTasks.length} tasks to client`);
    }
  }

  console.log(`[DEBUG] Returning ${userTasks.length} tasks`);
  return userTasks;
}

export async function createTask(userId: string, title: string) {
  console.log(`[DEBUG] createTask called with: userId=${userId}, title=${title}`);
  const newTask = {
    id: String(Date.now()),
    userId,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  console.log(`[DEBUG] Created task with ID: ${newTask.id}`);
  
  // Always update both client and server storage
  if (isClient()) {
    const key = `tasks_${userId}`;
    const userTasks = JSON.parse(localStorage.getItem(key) || '[]');
    userTasks.unshift(newTask);
    localStorage.setItem(key, JSON.stringify(userTasks));
    console.log(`[DEBUG] Added task to localStorage, now have ${userTasks.length} tasks`);
    
    // Update progress
    const progressKey = `progress_${userId}`;
    const progress = JSON.parse(localStorage.getItem(progressKey) || JSON.stringify({
      id: userId, userId, completedTasks: 0, totalTasks: 0, allTimeCompleted: 0, mood: 'overwhelmed',
      streak: Math.floor(Math.random() * 5) + 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }));
    progress.totalTasks += 1;
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem(progressKey, JSON.stringify(progress));
  }
  
  // Server-side: use in-memory Map (this will run on both client and server)
  const userTasks = tasksStore.get(userId) || [];
  userTasks.unshift(newTask);
  tasksStore.set(userId, userTasks);
  console.log(`[DEBUG] Added task to in-memory Map, now have ${userTasks.length} tasks`);
  
  // Update progress
  const progress = progressStore.get(userId) || {
    id: userId, userId, completedTasks: 0, totalTasks: 0, allTimeCompleted: 0, mood: 'overwhelmed',
    streak: Math.floor(Math.random() * 5) + 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  progress.totalTasks += 1;
  progress.updatedAt = new Date().toISOString();
  progressStore.set(userId, progress);
  
  console.log(`[DEBUG] Returning task:`, newTask);
  return newTask;
}

export async function updateTask(userId: string, taskId: number | string, data: { completed?: boolean }) {
  console.log(`[DEBUG] updateTask called with: userId=${userId}, taskId=${taskId}, data=`, data);
  let userTasks: any[] = [];
  let updatedTask: any;

  // Get tasks from localStorage (client) or server
  if (isClient()) {
    const key = `tasks_${userId}`;
    userTasks = JSON.parse(localStorage.getItem(key) || '[]');
    console.log(`[DEBUG] Client tasks:`, userTasks.length, 'tasks found');
  } else {
    userTasks = tasksStore.get(userId) || [];
    console.log(`[DEBUG] Server tasks:`, userTasks.length, 'tasks found');
  }

  console.log(`[DEBUG] Using ${userTasks.length} tasks for update`);
  console.log(`Updating task: userId=${userId}, taskId=${taskId}, completed=${data.completed}`);
  console.log(`Available tasks:`, userTasks.map(t => `${t.id} (${typeof t.id})`).join(', '));

  const taskIndex = userTasks.findIndex(task => String(task.id) === String(taskId));

  if (taskIndex === -1) {
    console.error(`Task not found: userId=${userId}, taskId=${taskId}`);
    console.error(`User tasks:`, userTasks.map(t => `${t.id} (${typeof t.id})`).join(', '));
    throw new Error('Task not found');
  }

  console.log(`Found task at index ${taskIndex}:`, userTasks[taskIndex]);
  
  // Store the previous completion status BEFORE updating
  const wasCompleted = userTasks[taskIndex].completed;
  
  updatedTask = { ...userTasks[taskIndex], ...data, updatedAt: new Date().toISOString() };
  userTasks[taskIndex] = updatedTask;

  // Update storage based on environment
  if (isClient()) {
    const key = `tasks_${userId}`;
    localStorage.setItem(key, JSON.stringify(userTasks));
    console.log(`[DEBUG] Updated localStorage for user ${userId} with ${userTasks.length} tasks`);
  } else {
    tasksStore.set(userId, userTasks);
    console.log(`[DEBUG] Updated in-memory Map for user ${userId} with ${userTasks.length} tasks`);
  }

  // Update progress
  let progress;
  if (isClient()) {
    const progressKey = `progress_${userId}`;
    progress = JSON.parse(localStorage.getItem(progressKey) || JSON.stringify({
      id: userId, userId, completedTasks: 0, totalTasks: 0, allTimeCompleted: 0, mood: 'overwhelmed',
      streak: Math.floor(Math.random() * 5) + 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }));
  } else {
    progress = progressStore.get(userId) || {
      id: userId, userId, completedTasks: 0, totalTasks: 0, allTimeCompleted: 0, mood: 'overwhelmed',
      streak: Math.floor(Math.random() * 5) + 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
  }

  const isNowCompleted = data.completed;

  if (isNowCompleted && !wasCompleted) {
    progress.completedTasks += 1;
    progress.allTimeCompleted = (progress.allTimeCompleted || 0) + 1;
    progress.dailyCompletedTasks = (progress.dailyCompletedTasks || 0) + 1;
  } else if (!isNowCompleted && wasCompleted) {
    progress.completedTasks = Math.max(0, progress.completedTasks - 1);
    progress.allTimeCompleted = Math.max(0, (progress.allTimeCompleted || 0) - 1);
    progress.dailyCompletedTasks = Math.max(0, (progress.dailyCompletedTasks || 0) - 1);
  }

  // Calculate current milestone and progress
  const currentMilestoneIndex = getCurrentMilestone(progress.allTimeCompleted || 0);
  const currentMilestone = MILESTONES[currentMilestoneIndex];
  const displayCompleted = Math.min((progress.allTimeCompleted || 0) - currentMilestone.threshold, currentMilestone.maxValue);
  const maxValue = currentMilestone.maxValue;

  // Update progress with calculated values
  progress.currentMilestone = currentMilestoneIndex;
  progress.mood = currentMilestone.mood;
  progress.displayCompleted = displayCompleted;
  progress.maxValue = maxValue;
  progress.totalTasks = userTasks.length;
  progress.updatedAt = new Date().toISOString();

  // Save progress based on environment
  if (isClient()) {
    const progressKey = `progress_${userId}`;
    localStorage.setItem(progressKey, JSON.stringify(progress));
  } else {
    progressStore.set(userId, progress);
  }

  console.log(`[DEBUG] Returning updated task:`, updatedTask);
  return {
    ...updatedTask,
    completedTasks: progress.completedTasks,
    newMood: progress.mood,
    displayCompleted: progress.displayCompleted,
    maxValue: progress.maxValue,
    allTimeCompleted: progress.allTimeCompleted,
    currentMilestone: progress.currentMilestone
  };
}

export async function deleteTask(userId: string, taskId: number | string) {
  console.log(`[DEBUG] deleteTask called with: userId=${userId}, taskId=${taskId}`);
  let userTasks: any[];
  let deletedTask: any;
  let clientTasks: any[] = [];
  let serverTasks: any[] = [];

  if (isClient()) {
    const key = `tasks_${userId}`;
    clientTasks = JSON.parse(localStorage.getItem(key) || '[]');
    console.log(`[DEBUG] Client tasks:`, clientTasks.length, 'tasks found');
  }
  serverTasks = tasksStore.get(userId) || [];
  console.log(`[DEBUG] Server tasks:`, serverTasks.length, 'tasks found');

  // Always prioritize client tasks if server is empty
  if (serverTasks.length === 0 && clientTasks.length > 0) {
    console.log(`[DEBUG] Syncing ${clientTasks.length} tasks from client to server before delete`);
    tasksStore.set(userId, clientTasks);
    userTasks = clientTasks;
  } else {
    userTasks = serverTasks.length > 0 ? serverTasks : clientTasks;
  }

  console.log(`[DEBUG] Using ${userTasks.length} tasks for delete`);
  const taskIndex = userTasks.findIndex(task => String(task.id) === String(taskId));

  if (taskIndex === -1) {
    console.error(`Task not found: userId=${userId}, taskId=${taskId}`);
    throw new Error('Task not found');
  }

  deletedTask = userTasks[taskIndex];
  const isCompleted = deletedTask.completed;
  userTasks.splice(taskIndex, 1);

  // Update both client and server storage
  if (isClient()) {
    const key = `tasks_${userId}`;
    localStorage.setItem(key, JSON.stringify(userTasks));
  }
  tasksStore.set(userId, userTasks);

  // Update progress
  const progress = progressStore.get(userId) || {
    id: userId, userId, completedTasks: 0, totalTasks: 0, allTimeCompleted: 0, mood: 'overwhelmed',
    streak: Math.floor(Math.random() * 5) + 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };

  if (isCompleted) {
    progress.completedTasks = Math.max(0, progress.completedTasks - 1);
    progress.allTimeCompleted = Math.max(0, (progress.allTimeCompleted || 0) - 1);
  }
  progress.totalTasks = Math.max(0, progress.totalTasks - 1);

  // Calculate current milestone and progress
  const currentMilestoneIndex = getCurrentMilestone(progress.allTimeCompleted || 0);
  const currentMilestone = MILESTONES[currentMilestoneIndex];
  const displayCompleted = Math.min((progress.allTimeCompleted || 0) - currentMilestone.threshold, currentMilestone.maxValue);
  const maxValue = currentMilestone.maxValue;

  // Update milestone data
  progress.currentMilestone = currentMilestoneIndex;
  progress.mood = currentMilestone.mood;
  progress.displayCompleted = displayCompleted;
  progress.maxValue = maxValue;
  progress.updatedAt = new Date().toISOString();
  progressStore.set(userId, progress);

  if (isClient()) {
    const progressKey = `progress_${userId}`;
    localStorage.setItem(progressKey, JSON.stringify(progress));
  }

  return { 
    ...deletedTask, 
    newMood: progress.mood, 
    completedTasks: progress.completedTasks,
    displayCompleted: progress.displayCompleted,
    maxValue: progress.maxValue,
    allTimeCompleted: progress.allTimeCompleted,
    currentMilestone: progress.currentMilestone
  };
}

// User progress related operations
export async function getUserProgress(userId: string) {
  console.log(`[DEBUG] getUserProgress called with: userId=${userId}`);
  let progress;
  
  // Always check localStorage first for persistence
  if (isClient()) {
    const progressKey = `progress_${userId}`;
    const storedProgress = localStorage.getItem(progressKey);
    if (storedProgress) {
      progress = JSON.parse(storedProgress);
      console.log(`[DEBUG] Loaded progress from localStorage for user ${userId}`);
      
      // Sync to server for consistency
      progressStore.set(userId, progress);
    }
  }
  
  // Fallback to server if no localStorage data
  if (!progress) {
    progress = progressStore.get(userId);
    if (progress) {
      console.log(`[DEBUG] Loaded progress from server for user ${userId}`);
      
      // Sync to localStorage if we have server data
      if (isClient()) {
        const progressKey = `progress_${userId}`;
        localStorage.setItem(progressKey, JSON.stringify(progress));
      }
    }
  }
  
  if (!progress) {
    // New user - start with overwhelmed mood and 0 progress
    progress = {
      id: userId,
      userId,
      completedTasks: 0,
      totalTasks: 0,
      allTimeCompleted: 0,
      mood: 'overwhelmed', // Start with sad cactus
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
      dailyCompletedTasks: 0,
      dailyMoodChecks: 0,
      dailyAISplits: 0
    };
    console.log(`[DEBUG] Created new progress for user ${userId} with mood: ${progress.mood}`);
  }

  // Check if we need to do a daily reset
  const now = new Date();
  const lastReset = new Date(progress.lastResetDate || progress.createdAt);
  const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceReset >= 1) {
    console.log(`[DEBUG] Performing daily reset for user ${userId}. Days since reset: ${daysSinceReset}`);
    
    // Reset daily progress
    progress.dailyCompletedTasks = 0;
    progress.completedTasks = 0; // Reset daily completed tasks
    progress.dailyMoodChecks = 0; // Reset daily mood checks
    progress.dailyAISplits = 0; // Reset daily AI splits
    progress.lastResetDate = now.toISOString();
    
    console.log(`[DEBUG] Daily reset completed.`);
  }

  // Get current tasks to calculate total
  const userTasks = await getUserTasks(userId);
  progress.totalTasks = userTasks.length;

  // Calculate current milestone and progress
  const currentMilestoneIndex = getCurrentMilestone(progress.allTimeCompleted || 0);
  const currentMilestone = MILESTONES[currentMilestoneIndex];
  const displayCompleted = Math.min((progress.allTimeCompleted || 0) - currentMilestone.threshold, currentMilestone.maxValue);
  const maxValue = currentMilestone.maxValue;

  // Update progress with calculated values
  progress.currentMilestone = currentMilestoneIndex;
  progress.mood = currentMilestone.mood;
  progress.displayCompleted = displayCompleted;
  progress.maxValue = maxValue;

  // Save to both localStorage and server
  if (isClient()) {
    const progressKey = `progress_${userId}`;
    localStorage.setItem(progressKey, JSON.stringify(progress));
  }
  progressStore.set(userId, progress);

  return {
    ...progress,
    displayCompleted,
    maxValue,
    allTimeCompleted: progress.allTimeCompleted || 0,
    currentMilestone: currentMilestoneIndex,
    dailyCompletedTasks: progress.dailyCompletedTasks || 0,
    dailyMoodChecks: progress.dailyMoodChecks || 0,
    dailyAISplits: progress.dailyAISplits || 0,
    lastResetDate: progress.lastResetDate
  };
}

export async function updateUserMood(userId: string, mood: string) {
  let progress: any;
  
  if (isClient()) {
    // Client-side: use localStorage
    const progressKey = `progress_${userId}`;
    progress = JSON.parse(localStorage.getItem(progressKey) || 'null');
  } else {
    // Server-side: use in-memory Map
    progress = progressStore.get(userId);
  }
  
  if (!progress) {
    progress = {
      id: userId,
      userId,
      completedTasks: 0,
      totalTasks: 0,
      mood,
      streak: Math.floor(Math.random() * 5) + 1, // Mock streak between 1-5 for demo
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } else {
    progress.mood = mood;
    progress.updatedAt = new Date().toISOString();
  }
  
  if (isClient()) {
    // Save to localStorage
    const progressKey = `progress_${userId}`;
    localStorage.setItem(progressKey, JSON.stringify(progress));
  } else {
    // Save to in-memory Map
    progressStore.set(userId, progress);
  }
  
  return progress;
}

export async function incrementDailyMoodChecks(userId: string): Promise<{ success: boolean; dailyMoodChecks: number; limitReached: boolean }> {
  const progress = progressStore.get(userId) || {
    id: userId, userId, dailyMoodChecks: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  
  const currentMoodChecks = progress.dailyMoodChecks || 0;
  const limitReached = currentMoodChecks >= 1; // Limit: 1 mood check per day
  
  if (!limitReached) {
    progress.dailyMoodChecks = currentMoodChecks + 1;
    progress.updatedAt = new Date().toISOString();
    progressStore.set(userId, progress);
    
    // Update localStorage if on client
    if (isClient()) {
      const progressKey = `progress_${userId}`;
      const storedProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
      storedProgress.dailyMoodChecks = progress.dailyMoodChecks;
      localStorage.setItem(progressKey, JSON.stringify(storedProgress));
    }
  }
  
  return {
    success: !limitReached,
    dailyMoodChecks: progress.dailyMoodChecks,
    limitReached
  };
}

export async function incrementDailyAISplits(userId: string): Promise<{ success: boolean; dailyAISplits: number; limitReached: boolean }> {
  const progress = progressStore.get(userId) || {
    id: userId, userId, dailyAISplits: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  
  const currentAISplits = progress.dailyAISplits || 0;
  const limitReached = currentAISplits >= 1; // Limit: 1 AI split per day
  
  if (!limitReached) {
    progress.dailyAISplits = currentAISplits + 1;
    progress.updatedAt = new Date().toISOString();
    progressStore.set(userId, progress);
    
    // Update localStorage if on client
    if (isClient()) {
      const progressKey = `progress_${userId}`;
      const storedProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
      storedProgress.dailyAISplits = progress.dailyAISplits;
      localStorage.setItem(progressKey, JSON.stringify(storedProgress));
    }
  }
  
  return {
    success: !limitReached,
    dailyAISplits: progress.dailyAISplits,
    limitReached
  };
}

// Helper function to sync client tasks to server
export async function syncClientToServer(userId: string) {
  if (isClient()) {
    const key = `tasks_${userId}`;
    const clientTasks = JSON.parse(localStorage.getItem(key) || '[]');
    const serverTasks = tasksStore.get(userId) || [];
    
    console.log(`[SYNC] Client has ${clientTasks.length} tasks, Server has ${serverTasks.length} tasks`);
    
    // If client has tasks but server doesn't, sync client to server
    if (clientTasks.length > 0 && serverTasks.length === 0) {
      console.log(`[SYNC] Syncing ${clientTasks.length} tasks from client to server`);
      tasksStore.set(userId, clientTasks);
      return clientTasks;
    }
    
    // If server has tasks but client doesn't, sync server to client
    if (serverTasks.length > 0 && clientTasks.length === 0) {
      console.log(`[SYNC] Syncing ${serverTasks.length} tasks from server to client`);
      localStorage.setItem(key, JSON.stringify(serverTasks));
      return serverTasks;
    }
    
    // If both have tasks, use the one with more tasks (likely more up-to-date)
    if (clientTasks.length > 0 && serverTasks.length > 0) {
      if (clientTasks.length > serverTasks.length) {
        console.log(`[SYNC] Client has more tasks, syncing to server`);
        tasksStore.set(userId, clientTasks);
        return clientTasks;
      } else if (serverTasks.length > clientTasks.length) {
        console.log(`[SYNC] Server has more tasks, syncing to client`);
        localStorage.setItem(key, JSON.stringify(serverTasks));
        return serverTasks;
      }
    }
    
    return serverTasks.length > 0 ? serverTasks : clientTasks;
  }
  
  return tasksStore.get(userId) || [];
}

export async function syncServerToClient(userId: string) {
  if (!isClient()) return;
  
  // This function would be called from client to get latest server data
  // In a real implementation, this would make API calls to get data
  // For our mock implementation, we'll just log that sync would happen
  console.log(`[Mock] Syncing data for user ${userId} from server to client`);
}

export async function deleteUserData(userId: string): Promise<void> {
  console.log(`[DELETE_USER_DATA] Starting deletion for user: ${userId}`);
  
  try {
    // Delete from server-side stores
    tasksStore.delete(userId);
    progressStore.delete(userId);
    
    console.log(`[DELETE_USER_DATA] Deleted from server stores for user: ${userId}`);
    
    // Note: localStorage cleanup will happen automatically when the user's session ends
    // But we can't access localStorage from server-side webhook handlers
    
    console.log(`[DELETE_USER_DATA] Successfully deleted all data for user: ${userId}`);
  } catch (error) {
    console.error(`[DELETE_USER_DATA] Error deleting data for user ${userId}:`, error);
    throw error;
  }
}

export function cleanupUserDataClient(userId: string): void {
  if (isClient()) {
    console.log(`[CLEANUP_CLIENT] Cleaning up localStorage for user: ${userId}`);
    
    try {
      // Remove all user-specific data from localStorage
      localStorage.removeItem(`tasks_${userId}`);
      localStorage.removeItem(`progress_${userId}`);
      localStorage.removeItem(`onboarded_${userId}`);
      localStorage.removeItem(`lastMoodCheck_${userId}`);
      
      console.log(`[CLEANUP_CLIENT] Successfully cleaned up localStorage for user: ${userId}`);
    } catch (error) {
      console.error(`[CLEANUP_CLIENT] Error cleaning up localStorage for user ${userId}:`, error);
    }
  }
}