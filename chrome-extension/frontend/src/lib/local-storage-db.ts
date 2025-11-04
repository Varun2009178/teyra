// Local storage based mock database implementation
// This simulates database operations and persists data in browser localStorage

// Helper functions for localStorage
const getFromStorage = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const setToStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

// Task-related operations
export async function getUserTasks(userId: string) {
  const key = `tasks_${userId}`;
  return getFromStorage(key, []);
}

export async function createTask(userId: string, title: string) {
  const key = `tasks_${userId}`;
  const userTasks = getFromStorage(key, []);
  
  const newTask = {
    id: String(Date.now()),
    userId,
    title,
    completed: false,
    has_been_split: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  userTasks.unshift(newTask); // Add to beginning of array
  setToStorage(key, userTasks);
  
  // Update user progress
  const progressKey = `progress_${userId}`;
  const progress = getFromStorage(progressKey, {
    id: userId,
    userId,
    completedTasks: 0,
    totalTasks: 0,
    mood: 'neutral',
    streak: Math.floor(Math.random() * 5) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  progress.totalTasks += 1;
  progress.updatedAt = new Date().toISOString();
  setToStorage(progressKey, progress);
  
  return newTask;
}

export async function updateTask(userId: string, taskId: number | string, data: { completed?: boolean }) {
  const key = `tasks_${userId}`;
  const userTasks = getFromStorage(key, []);
  
  // Find the task with flexible ID comparison
  const taskIndex = userTasks.findIndex((task: any) => 
    String(task.id) === String(taskId)
  );
  
  if (taskIndex === -1) {
    console.error(`Task not found: userId=${userId}, taskId=${taskId}`);
    throw new Error('Task not found');
  }
  
  const updatedTask = {
    ...userTasks[taskIndex],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  userTasks[taskIndex] = updatedTask;
  setToStorage(key, userTasks);
  
  // Update user progress if completion status changed
  if (data.completed !== undefined) {
    const progressKey = `progress_${userId}`;
    const progress = getFromStorage(progressKey, {
      id: userId,
      userId,
      completedTasks: 0,
      totalTasks: userTasks.length,
      mood: 'neutral',
      streak: Math.floor(Math.random() * 5) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
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
    
    progress.updatedAt = new Date().toISOString();
    setToStorage(progressKey, progress);
  }
  
  return updatedTask;
}

export async function deleteTask(userId: string, taskId: number | string) {
  const key = `tasks_${userId}`;
  const userTasks = getFromStorage(key, []);
  
  // Find the task with flexible ID comparison
  const taskIndex = userTasks.findIndex((task: any) => 
    String(task.id) === String(taskId)
  );
  
  if (taskIndex === -1) {
    console.error(`Task not found: userId=${userId}, taskId=${taskId}`);
    throw new Error('Task not found');
  }
  
  const deletedTask = userTasks[taskIndex];
  const isCompleted = deletedTask.completed;
  
  // Remove the task
  userTasks.splice(taskIndex, 1);
  setToStorage(key, userTasks);
  
  // Update user progress
  const progressKey = `progress_${userId}`;
  const progress = getFromStorage(progressKey, {
    id: userId,
    userId,
    completedTasks: 0,
    totalTasks: 0,
    mood: 'neutral',
    streak: Math.floor(Math.random() * 5) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
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
  
  progress.updatedAt = new Date().toISOString();
  setToStorage(progressKey, progress);
  
  return {
    ...deletedTask,
    newMood: progress.mood,
    completedTasks: progress.completedTasks
  };
}

// User progress related operations
export async function getUserProgress(userId: string) {
  const key = `progress_${userId}`;
  const progress = getFromStorage(key, {
    id: userId,
    userId,
    completedTasks: 0,
    totalTasks: 0,
    mood: 'neutral',
    streak: Math.floor(Math.random() * 5) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  return progress;
}

export async function updateUserMood(userId: string, mood: string) {
  const key = `progress_${userId}`;
  const progress = getFromStorage(key, {
    id: userId,
    userId,
    completedTasks: 0,
    totalTasks: 0,
    mood: 'neutral',
    streak: Math.floor(Math.random() * 5) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  progress.mood = mood;
  progress.updatedAt = new Date().toISOString();
  setToStorage(key, progress);
  
  return progress;
}