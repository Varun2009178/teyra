// Mock database implementation for MVP
// This simulates database operations without requiring a real database connection

// In-memory storage
const tasksStore = new Map<string, any[]>();
const progressStore = new Map<string, any>();

// Task-related operations
export async function getUserTasks(userId: string) {
  return tasksStore.get(userId) || [];
}

export async function createTask(userId: string, title: string) {
  // Use string IDs consistently to avoid type mismatches
  const newTask = {
    id: String(Date.now()),
    userId,
    title,
    completed: false,
    has_been_split: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log(`Creating task with ID: ${newTask.id} for user: ${userId}`);
  
  const userTasks = tasksStore.get(userId) || [];
  userTasks.unshift(newTask); // Add to beginning of array
  tasksStore.set(userId, userTasks);
  
  // Update user progress
  const progress = progressStore.get(userId) || {
    id: userId,
    userId,
    completedTasks: 0,
    totalTasks: 0,
    mood: 'neutral',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  progress.totalTasks += 1;
  progress.updatedAt = new Date();
  progressStore.set(userId, progress);
  
  return newTask;
}

export async function updateTask(userId: string, taskId: number | string, data: { completed?: boolean }) {
  const userTasks = tasksStore.get(userId) || [];
  // Convert taskId to number if it's a string that contains only digits
  const normalizedTaskId = typeof taskId === 'string' && /^\d+$/.test(taskId) ? parseInt(taskId, 10) : taskId;
  const taskIndex = userTasks.findIndex(task => 
    task.id === normalizedTaskId || task.id === taskId || task.id.toString() === taskId.toString()
  );
  
  if (taskIndex === -1) {
    console.error(`Task not found: userId=${userId}, taskId=${taskId}, normalizedId=${normalizedTaskId}`);
    throw new Error('Task not found');
  }
  
  const updatedTask = {
    ...userTasks[taskIndex],
    ...data,
    updatedAt: new Date()
  };
  
  userTasks[taskIndex] = updatedTask;
  tasksStore.set(userId, userTasks);
  
  // Update user progress if completion status changed
  if (data.completed !== undefined) {
    const progress = progressStore.get(userId) || {
      id: userId,
      userId,
      completedTasks: 0,
      totalTasks: userTasks.length,
      mood: 'neutral',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const completedChange = data.completed ? 1 : -1;
    progress.completedTasks = Math.max(0, progress.completedTasks + completedChange);
    
    // Update mood based on completion percentage
    const completionRatio = progress.completedTasks / progress.totalTasks;
    if (completionRatio >= 0.7) {
      progress.mood = 'happy';
    } else if (completionRatio >= 0.3) {
      progress.mood = 'neutral';
    } else {
      progress.mood = 'sad';
    }
    
    progress.updatedAt = new Date();
    progressStore.set(userId, progress);
  }
  
  return updatedTask;
}

export async function deleteTask(userId: string, taskId: number | string) {
  const userTasks = tasksStore.get(userId) || [];
  // Convert taskId to number if it's a string that contains only digits
  const normalizedTaskId = typeof taskId === 'string' && /^\d+$/.test(taskId) ? parseInt(taskId, 10) : taskId;
  const taskIndex = userTasks.findIndex(task => 
    task.id === normalizedTaskId || task.id === taskId || task.id.toString() === taskId.toString()
  );
  
  if (taskIndex === -1) {
    console.error(`Task not found: userId=${userId}, taskId=${taskId}, normalizedId=${normalizedTaskId}`);
    throw new Error('Task not found');
  }
  
  const deletedTask = userTasks[taskIndex];
  const isCompleted = deletedTask.completed;
  
  // Remove the task
  userTasks.splice(taskIndex, 1);
  tasksStore.set(userId, userTasks);
  
  // Update user progress
  const progress = progressStore.get(userId) || {
    id: userId,
    userId,
    completedTasks: 0,
    totalTasks: 0,
    mood: 'neutral',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  progress.totalTasks = Math.max(0, progress.totalTasks - 1);
  if (isCompleted) {
    progress.completedTasks = Math.max(0, progress.completedTasks - 1);
  }
  
  // Update mood based on completion percentage
  if (progress.totalTasks > 0) {
    const completionRatio = progress.completedTasks / progress.totalTasks;
    if (completionRatio >= 0.7) {
      progress.mood = 'happy';
    } else if (completionRatio >= 0.3) {
      progress.mood = 'neutral';
    } else {
      progress.mood = 'sad';
    }
  }
  
  progress.updatedAt = new Date();
  progressStore.set(userId, progress);
  
  return {
    ...deletedTask,
    newMood: progress.mood,
    completedTasks: progress.completedTasks
  };
}

// User progress related operations
export async function getUserProgress(userId: string) {
  let progress = progressStore.get(userId);
  
  if (!progress) {
    progress = {
      id: userId,
      userId,
      completedTasks: 0,
      totalTasks: 0,
      mood: 'neutral',
      streak: Math.floor(Math.random() * 5) + 1, // Mock streak between 1-5 for demo
      createdAt: new Date(),
      updatedAt: new Date()
    };
    progressStore.set(userId, progress);
  }
  
  return progress;
}

export async function updateUserMood(userId: string, mood: string) {
  let progress = progressStore.get(userId);
  
  if (!progress) {
    progress = {
      id: userId,
      userId,
      completedTasks: 0,
      totalTasks: 0,
      mood,
      streak: Math.floor(Math.random() * 5) + 1, // Mock streak between 1-5 for demo
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } else {
    progress.mood = mood;
    progress.updatedAt = new Date();
  }
  
  progressStore.set(userId, progress);
  return progress;
}