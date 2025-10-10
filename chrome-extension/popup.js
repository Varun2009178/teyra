// Teyra Chrome Extension - Popup Script with Mike the Cactus

let currentUser = null;
let allTasks = [];
let currentMood = 'neutral';

// Pomodoro Timer State
let pomodoroState = {
  isRunning: false,
  isPaused: false,
  isBreak: false,
  timeRemaining: 25 * 60, // 25 minutes in seconds
  workDuration: 25 * 60, // 25 minutes
  shortBreakDuration: 5 * 60, // 5 minutes
  longBreakDuration: 15 * 60, // 15 minutes
  currentSession: 1,
  totalSessions: 4,
  linkedTaskId: null,
  linkedTaskTitle: null,
  intervalId: null,
  sessionStartTime: null,
  distractionFree: true // Track if user visited blocked sites during session
};

// Mike XP State
let mikeXP = {
  currentXP: 0,
  level: 1,
  xpForNextLevel: 100,
  totalSessions: 0,
  distractionFreeSessions: 0
};

document.addEventListener('DOMContentLoaded', function() {
  console.log('🌵 Teyra popup loaded with Mike!');
  checkAuthState();
  setupEventListeners();
  setupBackgroundListeners();
  loadMikeXP();
});

// Listen for messages from background script
function setupBackgroundListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FOCUS_TIME_UPDATE') {
      const focusTime = message.focusTime || 0;
      const minutes = Math.floor(focusTime / 60000);
      const seconds = Math.floor((focusTime % 60000) / 1000);
      const focusTimeEl = document.getElementById('focus-time');
      if (focusTimeEl) {
        focusTimeEl.textContent =
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    // Listen for distraction detection during Pomodoro
    if (message.type === 'DISTRACTION_DETECTED' && pomodoroState.isRunning && !pomodoroState.isBreak) {
      pomodoroState.distractionFree = false;
      savePomodoroState();
      console.log('⚠️ Distraction detected during Pomodoro session');
    }
  });
}

async function checkAuthState() {
  try {
    // Check if user data is stored in Chrome storage
    const result = await chrome.storage.local.get(['teyra_user', 'teyra_tasks']);

    if (result.teyra_user) {
      currentUser = result.teyra_user;
      allTasks = result.teyra_tasks || [];
      console.log('Found stored user:', currentUser);
      showDashboard();
      await loadUserTasks(); // Refresh from API
    } else {
      console.log('No stored user found, checking if logged in via API...');
      // Try to check if user is already logged in on the website
      await checkWebsiteAuth();
    }
  } catch (error) {
    console.error('Error checking auth state:', error);
    showAuthScreen();
  }
}

async function checkWebsiteAuth() {
  try {
    // Try to fetch user data from the API to see if they're already logged in
    const response = await fetch('https://teyra.app/api/user', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      console.log('User is already logged in:', userData);

      // Store user data for future use
      currentUser = userData;
      await chrome.storage.local.set({ teyra_user: userData });

      showDashboard();
      await loadUserTasks();
    } else {
      console.log('User not logged in, showing auth screen');
      showAuthScreen();
    }
  } catch (error) {
    console.log('API check failed, showing auth screen:', error);
    showAuthScreen();
  }
}

function setupEventListeners() {
  // Google Sign In
  document.getElementById('google-signin').addEventListener('click', handleGoogleSignIn);

  // Sign Out
  document.getElementById('sign-out').addEventListener('click', handleSignOut);

  // Focus Mode Toggle
  document.getElementById('focus-toggle').addEventListener('change', toggleFocusMode);

  // Settings Button
  document.getElementById('settings-btn').addEventListener('click', toggleSettings);

  // View All Tasks
  document.getElementById('view-all-tasks').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://teyra.app/dashboard' });
    window.close();
  });

  // Add task on Enter
  document.getElementById('task-input').addEventListener('keypress', async function(e) {
    if (e.key === 'Enter' && this.value.trim()) {
      await addTask(this.value.trim());
      this.value = '';
    }
  });

  // Focus session action buttons
  document.getElementById('end-focus')?.addEventListener('click', endFocusSession);

  // Focus mode timer controls (integrated into toggle)
  document.getElementById('focus-timer-pause')?.addEventListener('click', () => {
    pausePomodoro();
    updatePomodoroDisplay();
  });

  document.getElementById('focus-timer-reset')?.addEventListener('click', () => {
    resetPomodoro();
    updatePomodoroDisplay();
  });
}

function pauseFocusSession() {
  // For now, just toggle focus mode off
  document.getElementById('focus-toggle').checked = false;
  toggleFocusMode();
}

async function endFocusSession() {
  // End the focus session and show completion
  document.getElementById('focus-toggle').checked = false;

  // Reset the timer completely
  await stopFocusTimer();

  // Toggle focus mode off
  await toggleFocusMode();

  console.log('Focus session ended and timer reset!');
}

async function handleGoogleSignIn() {
  try {
    // Add click animation
    const btn = document.getElementById('google-signin');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 150);

    // Open the main app for sign in with onboarding flow
    chrome.tabs.create({ url: 'https://teyra.app/sign-in?extension=true&onboarding=true' });
    window.close();
  } catch (error) {
    console.error('Error signing in:', error);
  }
}

async function handleSignOut() {
  try {
    // Clear stored user data
    await chrome.storage.local.remove(['teyra_user', 'teyra_tasks']);
    currentUser = null;
    allTasks = [];
    showAuthScreen();

    // Also try to sign out from the website
    try {
      await fetch('https://teyra.app/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (logoutError) {
      console.log('Website logout failed (expected):', logoutError);
    }
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// Current view state
let currentView = 'tasks'; // 'tasks', 'focus', 'settings'

async function toggleFocusMode() {
  const toggle = document.getElementById('focus-toggle');
  const isEnabled = toggle.checked;

  // Store focus mode state and communicate with background script
  await chrome.storage.local.set({ focus_mode_active: isEnabled });

  // Notify background script about focus mode change
  try {
    await chrome.runtime.sendMessage({
      type: 'TOGGLE_FOCUS_MODE',
      enabled: isEnabled
    });
  } catch (error) {
    console.error('Error communicating with background script:', error);
  }

  // Update UI based on focus mode
  updateUI(isEnabled);

  if (isEnabled) {
    console.log('🚫 Focus mode enabled - blocking distracting sites');
    startFocusTimer();
    startPomodoro(); // Start Pomodoro when focus mode starts
    showView('focus');
  } else {
    console.log('✅ Focus mode disabled - showing tasks');
    stopFocusTimer();
    pausePomodoro(); // Pause Pomodoro when focus mode stops
    showView('tasks');
  }
}

function updateUI(focusEnabled) {
  const body = document.body;
  const headerTitle = document.getElementById('header-title');
  const mikeStatus = document.getElementById('mike-status');
  const focusTitle = document.getElementById('focus-title');
  const focusDescription = document.getElementById('focus-description');
  const timerDisplay = document.getElementById('focus-timer-display');

  if (focusEnabled) {
    body.classList.add('focus-mode');
    headerTitle.textContent = 'Focus Active';
    mikeStatus.textContent = 'Staying focused';
    focusTitle.textContent = 'Focus Mode Active';
    focusDescription.textContent = '25min session - distractions blocked';
    if (timerDisplay) timerDisplay.classList.remove('hidden');
  } else {
    body.classList.remove('focus-mode');
    headerTitle.textContent = 'Teyra';
    mikeStatus.textContent = 'Ready to focus';
    if (timerDisplay) timerDisplay.classList.add('hidden');
    focusTitle.textContent = 'Focus Mode';
    focusDescription.textContent = 'Block distractions and stay productive';
  }
}

function showView(viewName) {
  // Hide all views
  document.getElementById('tasks-view').classList.add('hidden');
  document.getElementById('focus-view').classList.add('hidden');
  document.getElementById('settings-view').classList.add('hidden');

  // Show requested view
  document.getElementById(viewName + '-view').classList.remove('hidden');
  currentView = viewName;
}

function toggleSettings() {
  if (currentView === 'settings') {
    // Go back to previous view based on focus mode
    const toggle = document.getElementById('focus-toggle');
    showView(toggle.checked ? 'focus' : 'tasks');
  } else {
    showView('settings');
  }
}

let focusTimer = null;
let focusStartTime = null;

function startFocusTimer() {
  updateFocusTimeDisplay();

  // Update timer every second
  focusTimer = setInterval(() => {
    updateFocusTimeDisplay();
  }, 1000);

  // Load and display website protection stats
  updateProtectionStats();
}

async function stopFocusTimer() {
  if (focusTimer) {
    clearInterval(focusTimer);
    focusTimer = null;
  }

  // Reset focus session in background script
  try {
    await chrome.runtime.sendMessage({
      type: 'RESET_FOCUS_SESSION'
    });
    console.log('Focus session reset successfully');
  } catch (error) {
    console.error('Error resetting focus session:', error);
  }

  // Reset timer display immediately
  const focusTimeEl = document.getElementById('focus-time');
  if (focusTimeEl) {
    focusTimeEl.textContent = '00:00';
  }
}

async function updateFocusTimeDisplay() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_FOCUS_TIME' });
    const focusTime = response?.focusTime || 0;

    const minutes = Math.floor(focusTime / 60000);
    const seconds = Math.floor((focusTime % 60000) / 1000);
    const focusTimeEl = document.getElementById('focus-time');
    if (focusTimeEl) {
      focusTimeEl.textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('Error getting focus time:', error);
    // Fallback to showing 00:00 if there's an error
    const focusTimeEl = document.getElementById('focus-time');
    if (focusTimeEl) focusTimeEl.textContent = '00:00';
  }
}

async function updateProtectionStats() {
  try {
    const result = await chrome.storage.local.get(['website_stats']);
    const stats = result.website_stats || {
      social: { blocked: 0, total: 0 },
      entertainment: { blocked: 0, total: 0 },
      shopping: { blocked: 0, total: 0 }
    };

    // Update the UI with real stats
    const protectionCards = document.querySelectorAll('.protection-card');
    const categories = ['social', 'entertainment', 'shopping'];

    protectionCards.forEach((card, index) => {
      const category = categories[index];
      if (stats[category]) {
        const countElement = card.querySelector('.protection-count');
        if (countElement) {
          const blockedCount = stats[category].blocked;
          const totalCount = stats[category].total;
          countElement.textContent = `${blockedCount} blocked today`;
        }
      }
    });
  } catch (error) {
    console.error('Error updating protection stats:', error);
  }
}

function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('dashboard-screen').classList.add('hidden');

  // Reset Mike to neutral for auth screen
  updateMikeMood('neutral');
}

async function showDashboard() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('dashboard-screen').classList.remove('hidden');

  // Load focus mode state
  const result = await chrome.storage.local.get(['focus_mode_active']);
  const isEnabled = result.focus_mode_active || false;
  document.getElementById('focus-toggle').checked = isEnabled;

  // Update UI and show correct view
  updateUI(isEnabled);
  showView(isEnabled ? 'focus' : 'tasks');

  // Load user-specific Mike state and update mood based on their progress
  await loadUserMikeState();
  updateMikeMoodFromProgress();
}

async function loadUserMikeState() {
  if (!currentUser) {
    console.log('No current user, using default Mike state');
    return;
  }

  try {
    // Load user-specific Mike preferences if they exist
    const mikeKey = `mike_state_${currentUser.id}`;
    const result = await chrome.storage.local.get([mikeKey]);
    const userMikeState = result[mikeKey];

    if (userMikeState) {
      console.log('Loaded user-specific Mike state:', userMikeState);
      // Apply any saved Mike preferences here if needed
    } else {
      console.log('No saved Mike state for user, using defaults');
      // Save initial Mike state for this user
      await chrome.storage.local.set({
        [mikeKey]: {
          lastMood: 'neutral',
          totalTasksCompleted: 0,
          lastActiveDate: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error loading Mike state:', error);
  }
}

async function saveUserMikeState(moodData) {
  if (!currentUser) return;

  try {
    const mikeKey = `mike_state_${currentUser.id}`;
    const activeTasks = allTasks.filter(task => !task.title.includes('[COMPLETED]'));
    const completed = activeTasks.filter(t => t.completed).length;

    await chrome.storage.local.set({
      [mikeKey]: {
        lastMood: currentMood,
        totalTasksCompleted: completed,
        lastActiveDate: new Date().toISOString(),
        ...moodData
      }
    });
  } catch (error) {
    console.error('Error saving Mike state:', error);
  }
}

async function syncSubscriptionStatus() {
  if (!currentUser) {
    console.log('No current user, skipping subscription sync');
    return;
  }

  try {
    console.log('Syncing subscription status for user:', currentUser.email);

    const response = await fetch('https://teyra.app/api/subscription/status', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const { isPremium } = await response.json();
      console.log('Subscription status:', isPremium ? 'Premium' : 'Free');

      // Store premium status in chrome storage
      await chrome.storage.local.set({ teyra_premium: isPremium });

      // Also send to content script
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SUBSCRIPTION_UPDATE',
            isPremium: isPremium
          }).catch(() => {}); // Ignore errors for tabs without content script
        });
      });
    } else {
      console.log('Failed to fetch subscription status:', response.status);
    }
  } catch (error) {
    console.error('Error syncing subscription:', error);
  }
}

async function loadUserTasks() {
  if (!currentUser) {
    console.log('No current user, skipping task load');
    return;
  }

  try {
    console.log('Loading tasks for user:', currentUser.email);

    // Always start with stored tasks for immediate display
    const result = await chrome.storage.local.get(['teyra_tasks']);
    allTasks = result.teyra_tasks || [];
    console.log('Loaded stored tasks:', allTasks.length);

    // Render stored tasks immediately
    renderTasks();
    updateProgress();
    updateMikeMoodFromProgress();

    // Sync subscription status in parallel
    syncSubscriptionStatus();

    // Try to refresh from API in background
    try {
      const response = await fetch('https://teyra.app/api/tasks', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const freshTasks = await response.json();
        console.log('Fetched fresh tasks from API:', freshTasks.length);

        // Only update if we got different data
        if (JSON.stringify(freshTasks) !== JSON.stringify(allTasks)) {
          await chrome.storage.local.set({ teyra_tasks: freshTasks });
          allTasks = freshTasks;
          renderTasks();
          updateProgress();
          updateMikeMoodFromProgress();
        }
      } else {
        console.log('API returned status:', response.status);
      }
    } catch (apiError) {
      console.log('API fetch failed, using stored tasks:', apiError.message);
    }

  } catch (error) {
    console.error('Error loading tasks:', error);
    // Show error in UI with proper styling
    const tasksList = document.getElementById('tasks-list');
    if (tasksList) {
      tasksList.innerHTML = `
        <div class="empty-state">
          <span class="emoji">⚠️</span>
          <p>Error loading tasks</p>
          <p>Please try refreshing the extension</p>
        </div>
      `;
    }
  }
}

function renderTasks() {
  const tasksList = document.getElementById('tasks-list');
  if (!tasksList) return;

  if (allTasks.length === 0) {
    tasksList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #999;">
        <p style="margin-bottom: 8px;">No tasks yet</p>
        <p style="font-size: 13px;">Add your first task above</p>
      </div>
    `;
    return;
  }

  // Filter out [COMPLETED] tasks and show active tasks
  const activeTasks = allTasks.filter(task => !task.title.includes('[COMPLETED]'));
  tasksList.innerHTML = '';

  activeTasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.innerHTML = `
      <div class="task-checkbox ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        ${task.completed ? '✓' : ''}
      </div>
      <span class="task-text ${task.completed ? 'completed' : ''}">${task.title}</span>
      <button class="task-delete" data-task-id="${task.id}" style="
        background: transparent;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 4px 8px;
        font-size: 16px;
        margin-left: auto;
        transition: color 0.2s ease;
      ">×</button>
    `;

    // Add click handler for checkbox
    const checkbox = taskElement.querySelector('.task-checkbox');
    checkbox.addEventListener('click', () => toggleTask(task.id));

    // Add click handler for delete button
    const deleteBtn = taskElement.querySelector('.task-delete');
    deleteBtn.addEventListener('mouseenter', (e) => {
      e.target.style.color = '#ff4444';
    });
    deleteBtn.addEventListener('mouseleave', (e) => {
      e.target.style.color = '#666';
    });
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    tasksList.appendChild(taskElement);
  });
}

function createTaskHTML(task, index) {
  return `
    <div class="task-item-notion" data-task-id="${task.id}">
      <div class="task-checkbox-notion ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        ${task.completed ? '✓' : ''}
      </div>
      <span class="task-text-notion ${task.completed ? 'completed' : ''}">
        ${task.title}
      </span>
    </div>
  `;
}

async function toggleTask(taskId) {
  if (!currentUser) return;

  try {
    const task = allTasks.find(t => t.id === parseInt(taskId));
    if (!task) return;

    console.log('Toggling task:', task.id, 'current completed:', task.completed);

    const newCompleted = !task.completed;

    // Update local state immediately for better performance
    task.completed = newCompleted;

    // Update Chrome storage immediately
    await chrome.storage.local.set({ teyra_tasks: allTasks });

    // Re-render immediately for responsive UI
    renderTasks();
    updateProgress();
    updateMikeMoodFromProgress();

    // Try to sync with API in background, but don't block UI
    try {
      const response = await fetch(`https://teyra.app/api/tasks/${taskId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: newCompleted })
      });

      if (!response.ok) {
        console.log(`API sync failed with status ${response.status}, but local update succeeded`);
        // Don't revert - let the local change persist for offline functionality
      } else {
        console.log('Task synced with API successfully');
      }
    } catch (apiError) {
      console.log('API sync failed, but local update succeeded:', apiError.message);
      // Don't revert - offline functionality
    }

    // Show celebration for task completion with Mike reaction
    if (newCompleted) {
      console.log('Task completed! 🎉');
      showTaskCompletionCelebration();
      // Trigger Mike's happy reaction
      updateMikeMoodFromProgress();
    }

  } catch (error) {
    console.error('Error toggling task:', error);
    // Re-render to ensure correct state
    renderTasks();
    updateProgress();
  }
}

async function deleteTask(taskId) {
  if (!currentUser) return;

  try {
    console.log('Deleting task:', taskId);

    // Remove from local state
    allTasks = allTasks.filter(t => t.id !== parseInt(taskId));

    // Update Chrome storage immediately
    await chrome.storage.local.set({ teyra_tasks: allTasks });

    // Re-render immediately
    renderTasks();
    updateProgress();
    updateMikeMoodFromProgress();

    // Try to sync with API in background
    try {
      const response = await fetch(`https://teyra.app/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Task deleted from API successfully');
      } else {
        console.log('API delete failed, but local delete succeeded');
      }
    } catch (apiError) {
      console.log('API delete failed, but local delete succeeded:', apiError.message);
    }

  } catch (error) {
    console.error('Error deleting task:', error);
    renderTasks();
    updateProgress();
  }
}

function showTaskCompletionCelebration() {
  // Add bounce animation to Mike
  const mikeCactus = document.getElementById('mike-cactus');
  if (mikeCactus) {
    mikeCactus.style.transform = 'scale(1.1)';
    setTimeout(() => {
      mikeCactus.style.transform = 'scale(1)';
    }, 200);
  }

  // Show sparkles immediately for celebration
  const sparkles = document.getElementById('mike-sparkles');
  if (sparkles) {
    sparkles.classList.remove('hidden');
    // Hide after 3 seconds if not in happy state
    setTimeout(() => {
      const activeTasks = allTasks.filter(task => !task.title.includes('[COMPLETED]'));
      const completed = activeTasks.filter(t => t.completed).length;
      const total = activeTasks.length;
      const percentage = total > 0 ? (completed / total) * 100 : 0;

      if (percentage < 75) {
        sparkles.classList.add('hidden');
      }
    }, 3000);
  }

  // Create a subtle celebration element
  const celebration = document.createElement('div');
  celebration.innerHTML = '✓';
  celebration.style.cssText = `
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    color: #007AFF;
    z-index: 1000;
    pointer-events: none;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  document.body.appendChild(celebration);

  // Animate in
  requestAnimationFrame(() => {
    celebration.style.opacity = '1';
    celebration.style.transform = 'translate(-50%, -50%) scale(1.2)';
  });

  // Animate out
  setTimeout(() => {
    if (document.body.contains(celebration)) {
      celebration.style.opacity = '0';
      celebration.style.transform = 'translate(-50%, -50%) scale(0.8) translateY(-20px)';
      setTimeout(() => {
        try {
          if (document.body.contains(celebration)) {
            document.body.removeChild(celebration);
          }
        } catch (error) {
          console.log('Celebration element already removed:', error);
        }
      }, 300);
    }
  }, 800);
}

async function addTask(title) {
  if (!currentUser) return;

  try {
    console.log('Adding task:', title);

    // Optimistic UI update
    const tempTask = {
      id: Date.now(), // Temporary ID
      title: title,
      completed: false,
      created_at: new Date().toISOString()
    };

    allTasks.push(tempTask);

    // Update Chrome storage immediately
    await chrome.storage.local.set({ teyra_tasks: allTasks });

    // Re-render immediately for responsive UI
    renderTasks();
    updateProgress();
    updateMikeMoodFromProgress();

    // Try to sync with API in background
    try {
      const response = await fetch('https://teyra.app/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title })
      });

      if (response.ok) {
        const newTask = await response.json();
        console.log('Task synced with API:', newTask);

        // Replace temp task with real task
        const tempIndex = allTasks.findIndex(t => t.id === tempTask.id);
        if (tempIndex !== -1) {
          allTasks[tempIndex] = newTask;
          await chrome.storage.local.set({ teyra_tasks: allTasks });
        }
      } else {
        console.log(`API sync failed with status ${response.status}, but local task persisted`);
        // Don't remove the task - let it persist locally
      }
    } catch (apiError) {
      console.log('API sync failed, but local task persisted:', apiError.message);
      // Don't remove the task - offline functionality
    }

  } catch (error) {
    console.error('Error adding task:', error);
  }
}

function updateProgress() {
  // Use all tasks, not just today's
  const activeTasks = allTasks.filter(task => !task.title.includes('[COMPLETED]'));
  const completed = activeTasks.filter(t => t.completed).length;
  const total = activeTasks.length;

  const completedTasksEl = document.getElementById('completed-tasks');
  const totalTasksEl = document.getElementById('total-tasks');
  const progressPercentEl = document.getElementById('progress-percent');
  const progressFill = document.getElementById('progress-fill');

  if (completedTasksEl) completedTasksEl.textContent = completed.toString();
  if (totalTasksEl) totalTasksEl.textContent = total.toString();

  const percentage = total > 0 ? (completed / total) * 100 : 0;
  if (progressPercentEl) progressPercentEl.textContent = Math.round(percentage) + '%';
  if (progressFill) progressFill.style.width = percentage + '%';
}

function updateMikeMoodFromProgress() {
  // Use all tasks, not just today's
  const activeTasks = allTasks.filter(task => !task.title.includes('[COMPLETED]'));
  const completed = activeTasks.filter(t => t.completed).length;
  const total = activeTasks.length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  let newMood = 'neutral';
  let moodText = "Ready to focus";
  let greetingText = "Hey there!";
  let motivationText = "Let's get some tasks done today";

  if (total === 0) {
    newMood = 'neutral';
    moodText = "Ready to start";
    greetingText = "Hey there!";
    motivationText = "Add your first task to get started";
  } else if (percentage === 100) {
    newMood = 'happy';
    moodText = "All done! 🎉";
    greetingText = "Amazing work!";
    motivationText = "You've completed all your tasks today!";
  } else if (percentage >= 75) {
    newMood = 'happy';
    moodText = "Almost there!";
    greetingText = "You're crushing it!";
    motivationText = "Just a few more tasks to go!";
  } else if (percentage >= 50) {
    newMood = 'neutral';
    moodText = "Making progress";
    greetingText = "Keep it up!";
    motivationText = "You're halfway through your tasks";
  } else if (percentage > 0) {
    newMood = 'neutral';
    moodText = "Getting started";
    greetingText = "Nice start!";
    motivationText = "Every task completed is progress";
  } else {
    newMood = 'neutral';
    moodText = "Let's begin";
    greetingText = "Ready to be productive?";
    motivationText = "Start with your most important task";
  }

  updateMikeMood(newMood);

  // Update Mike status in header
  const mikeStatus = document.getElementById('mike-status');
  if (mikeStatus) {
    mikeStatus.textContent = moodText;
  }

  // Update Mike hero section
  const mikeGreeting = document.getElementById('mike-greeting');
  const mikeMotivation = document.getElementById('mike-motivation');
  if (mikeGreeting) {
    mikeGreeting.textContent = greetingText;
  }
  if (mikeMotivation) {
    mikeMotivation.textContent = motivationText;
  }

  // Show sparkles when happy
  const sparkles = document.getElementById('mike-sparkles');
  if (sparkles) {
    if (newMood === 'happy') {
      sparkles.classList.remove('hidden');
    } else {
      sparkles.classList.add('hidden');
    }
  }

  // Save Mike's state tied to user account
  saveUserMikeState({
    greeting: greetingText,
    motivation: motivationText,
    progressPercentage: percentage,
    completedTasks: completed,
    totalTasks: total
  });
}

function updateMikeMood(mood) {
  if (currentMood === mood) return;

  currentMood = mood;
  const mikeImg = document.getElementById('mike-cactus');
  const sparkles = document.getElementById('cactus-sparkles');
  const plant = document.getElementById('cactus-plant');

  if (!mikeImg) return;

  // Smooth transition
  mikeImg.style.opacity = '0.7';
  mikeImg.style.transform = 'scale(0.95)';

  setTimeout(() => {
    switch (mood) {
      case 'happy':
        mikeImg.src = 'Happy.gif';
        if (sparkles) sparkles.classList.remove('hidden');
        if (plant) plant.classList.add('hidden');
        break;
      case 'sad':
        mikeImg.src = 'Sad With Tears 2.gif';
        if (sparkles) sparkles.classList.add('hidden');
        if (plant) plant.classList.add('hidden');
        break;
      default: // neutral
        mikeImg.src = 'Neutral Calm.gif';
        if (sparkles) sparkles.classList.add('hidden');
        if (plant) plant.classList.remove('hidden');
        break;
    }

    mikeImg.style.opacity = '1';
    mikeImg.style.transform = 'scale(1)';
  }, 150);
}

// Listen for messages from the main app (when user signs in)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'userSignedIn' && request.user) {
    currentUser = request.user;
    allTasks = request.tasks || [];

    chrome.storage.local.set({
      teyra_user: request.user,
      teyra_tasks: request.tasks || []
    });

    // Check if this is a new user
    if (request.isNewUser) {
      console.log('New user detected, showing welcome message');
      showNewUserWelcome();
    } else {
      showDashboard();
      loadUserTasks();
    }
  }
});

// Show welcome message for new users
function showNewUserWelcome() {
  // Clear existing content
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('dashboard-screen').classList.remove('hidden');

  // Show welcome overlay
  const welcomeOverlay = document.createElement('div');
  welcomeOverlay.id = 'welcome-overlay';
  welcomeOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  welcomeOverlay.innerHTML = `
    <div style="
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 320px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">🌵</div>
      <h2 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0;">Welcome to Teyra!</h2>
      <p style="color: #666; margin: 0 0 24px 0; line-height: 1.5;">
        Meet Mike, your productivity companion. He'll help you stay focused and complete your tasks!
      </p>
      <button id="start-journey" style="
        width: 100%;
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      ">Start your journey</button>
    </div>
  `;

  document.body.appendChild(welcomeOverlay);

  // Add click handler
  document.getElementById('start-journey').onclick = () => {
    welcomeOverlay.remove();
    showDashboard();
    loadUserTasks();
  };
}

// ============================================
// Pomodoro Timer Functions
// ============================================

function updatePomodoroDisplay() {
  const minutes = Math.floor(pomodoroState.timeRemaining / 60);
  const seconds = pomodoroState.timeRemaining % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Update focus mode timer
  const focusTimerEl = document.getElementById('focus-timer-large');
  const focusSessionEl = document.getElementById('focus-session-text');

  if (focusTimerEl) {
    focusTimerEl.textContent = timeString;
  }

  if (focusSessionEl) {
    if (pomodoroState.isBreak) {
      focusSessionEl.textContent = 'Break Time';
    } else {
      focusSessionEl.textContent = `Session ${pomodoroState.currentSession} of ${pomodoroState.totalSessions}`;
    }
  }
}

function startPomodoro() {
  if (pomodoroState.isRunning && !pomodoroState.isPaused) {
    return; // Already running
  }

  pomodoroState.isRunning = true;
  pomodoroState.isPaused = false;
  pomodoroState.sessionStartTime = Date.now();
  pomodoroState.distractionFree = true; // Reset for new session

  // Start countdown
  pomodoroState.intervalId = setInterval(() => {
    pomodoroState.timeRemaining--;

    if (pomodoroState.timeRemaining <= 0) {
      pomodoroTimerComplete();
    }

    updatePomodoroDisplay();
  }, 1000);

  updatePomodoroDisplay();
  savePomodoroState();

  // Notify background script that Pomodoro session started
  chrome.runtime.sendMessage({
    type: 'POMODORO_SESSION_STARTED'
  }).catch(() => {});
}

function pausePomodoro() {
  if (!pomodoroState.isRunning) return;

  pomodoroState.isPaused = !pomodoroState.isPaused;

  const pauseBtn = document.getElementById('focus-timer-pause');

  if (pomodoroState.isPaused) {
    // Pause the timer
    clearInterval(pomodoroState.intervalId);
    if (pauseBtn) {
      pauseBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
    }
  } else {
    // Resume the timer
    pomodoroState.intervalId = setInterval(() => {
      pomodoroState.timeRemaining--;

      if (pomodoroState.timeRemaining <= 0) {
        pomodoroTimerComplete();
      }

      updatePomodoroDisplay();
    }, 1000);

    if (pauseBtn) {
      pauseBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
      `;
    }
  }

  updatePomodoroDisplay();
  savePomodoroState();
}

function resetPomodoro() {
  // Clear interval
  if (pomodoroState.intervalId) {
    clearInterval(pomodoroState.intervalId);
  }

  // Reset state
  pomodoroState.isRunning = false;
  pomodoroState.isPaused = false;
  pomodoroState.isBreak = false;
  pomodoroState.timeRemaining = pomodoroState.workDuration;

  // Update UI
  document.getElementById('pomodoro-start').classList.remove('hidden');
  document.getElementById('pomodoro-pause').classList.add('hidden');

  updatePomodoroDisplay();
  savePomodoroState();
}

async function pomodoroTimerComplete() {
  // Clear interval
  clearInterval(pomodoroState.intervalId);

  // Play notification sound (optional)
  playNotificationSound();

  if (!pomodoroState.isBreak) {
    // Just completed a work session
    const wasDistractionFree = pomodoroState.distractionFree;

    // Award XP for distraction-free sessions
    if (wasDistractionFree) {
      await awardSessionXP(30);

      // Show special notification for distraction-free session
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'teyra-logo-64kb.png',
        title: '🎉 Distraction-Free Session Complete!',
        message: `+30 XP! You've completed session ${pomodoroState.currentSession} without distractions. Mike is proud!`,
        priority: 2
      });
    } else {
      // Show regular notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'teyra-logo-64kb.png',
        title: 'Focus Session Complete!',
        message: `You've completed session ${pomodoroState.currentSession}. Take a break.`,
        priority: 2
      });
    }

    // Move to next session
    pomodoroState.currentSession++;

    if (pomodoroState.currentSession > pomodoroState.totalSessions) {
      // Completed all sessions, long break
      pomodoroState.timeRemaining = pomodoroState.longBreakDuration;
      pomodoroState.currentSession = 1; // Reset for next cycle
    } else {
      // Short break
      pomodoroState.timeRemaining = pomodoroState.shortBreakDuration;
    }

    pomodoroState.isBreak = true;

    // Mark linked task as completed if exists
    if (pomodoroState.linkedTaskId) {
      markTaskComplete(pomodoroState.linkedTaskId);
    }
  } else {
    // Just completed a break, back to work
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'teyra-logo-64kb.png',
      title: 'Break Complete!',
      message: 'Time to get back to work!',
      priority: 2
    });

    pomodoroState.timeRemaining = pomodoroState.workDuration;
    pomodoroState.isBreak = false;
    pomodoroState.distractionFree = true; // Reset for next work session
  }

  // Auto-start next session
  pomodoroState.isRunning = false;
  updatePomodoroDisplay();
  savePomodoroState();

  // Notify background script that session ended
  chrome.runtime.sendMessage({
    type: 'POMODORO_SESSION_ENDED',
    distractionFree: !pomodoroState.isBreak ? pomodoroState.distractionFree : null
  }).catch(() => {});
}

function linkTaskToPomodoro(taskId, taskTitle) {
  pomodoroState.linkedTaskId = taskId;
  pomodoroState.linkedTaskTitle = taskTitle;

  const linkEl = document.getElementById('pomodoro-task-link');
  const textEl = document.getElementById('linked-task-text');

  if (linkEl && textEl) {
    linkEl.classList.remove('hidden');
    textEl.textContent = taskTitle;
  }

  savePomodoroState();
}

function unlinkTask() {
  pomodoroState.linkedTaskId = null;
  pomodoroState.linkedTaskTitle = null;

  const linkEl = document.getElementById('pomodoro-task-link');
  if (linkEl) {
    linkEl.classList.add('hidden');
  }

  savePomodoroState();
}

function markTaskComplete(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (task) {
    task.is_completed = true;
    chrome.storage.local.set({ teyra_tasks: allTasks });
    renderTasks();
    updateProgress();
    updateMikeMoodFromProgress();
  }
}

async function savePomodoroState() {
  await chrome.storage.local.set({ teyra_pomodoro: pomodoroState });
}

async function loadPomodoroState() {
  const result = await chrome.storage.local.get(['teyra_pomodoro']);
  if (result.teyra_pomodoro) {
    Object.assign(pomodoroState, result.teyra_pomodoro);
    // Don't restore interval, just display state
    pomodoroState.intervalId = null;
    pomodoroState.isRunning = false;
    pomodoroState.isPaused = false;
    updatePomodoroDisplay();
  }
}

function playNotificationSound() {
  // Optional: play a subtle notification sound
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2m98OScTgwOUKvm8LRkHAU2kdb0zIEsBSh+zO/eijwKEmK45+ekVRQJR');
  } catch (e) {
    // Fail silently if audio doesn't work
  }
}

// Mike XP Functions
async function loadMikeXP() {
  if (!currentUser) return;

  try {
    const mikeKey = `mike_xp_${currentUser.id}`;
    const result = await chrome.storage.local.get([mikeKey]);

    if (result[mikeKey]) {
      mikeXP = result[mikeKey];
      console.log('Loaded Mike XP:', mikeXP);
    } else {
      // Initialize XP for new user
      await saveMikeXP();
    }

    updateMikeXPDisplay();
  } catch (error) {
    console.error('Error loading Mike XP:', error);
  }
}

async function saveMikeXP() {
  if (!currentUser) return;

  try {
    const mikeKey = `mike_xp_${currentUser.id}`;
    await chrome.storage.local.set({ [mikeKey]: mikeXP });
    console.log('Saved Mike XP:', mikeXP);
  } catch (error) {
    console.error('Error saving Mike XP:', error);
  }
}

async function awardSessionXP(xpAmount) {
  mikeXP.currentXP += xpAmount;
  mikeXP.totalSessions++;
  mikeXP.distractionFreeSessions++;

  // Check for level up
  let leveledUp = false;
  while (mikeXP.currentXP >= mikeXP.xpForNextLevel) {
    mikeXP.level++;
    mikeXP.currentXP -= mikeXP.xpForNextLevel;
    mikeXP.xpForNextLevel = Math.floor(mikeXP.xpForNextLevel * 1.5); // Increase XP needed by 50%
    leveledUp = true;
  }

  // Save locally
  await saveMikeXP();

  // Sync to backend
  await syncMikeXPToBackend();

  // Update UI
  updateMikeXPDisplay();

  // Show level up animation if needed
  if (leveledUp) {
    showLevelUpAnimation();
  } else {
    showXPGainAnimation(xpAmount);
  }

  console.log(`🌵 Mike gained ${xpAmount} XP! Level: ${mikeXP.level}, XP: ${mikeXP.currentXP}/${mikeXP.xpForNextLevel}`);
}

function updateMikeXPDisplay() {
  // Update Mike's status text to show level
  const mikeStatus = document.getElementById('mike-status');
  if (mikeStatus && mikeXP.level > 1) {
    const baseText = mikeStatus.textContent;
    mikeStatus.textContent = `${baseText} • Level ${mikeXP.level}`;
  }

  // Update greeting to include XP info
  const mikeGreeting = document.getElementById('mike-greeting');
  if (mikeGreeting && mikeXP.distractionFreeSessions > 0) {
    const percentage = mikeXP.totalSessions > 0
      ? Math.round((mikeXP.distractionFreeSessions / mikeXP.totalSessions) * 100)
      : 0;

    if (percentage >= 80) {
      mikeGreeting.textContent = `Level ${mikeXP.level} - Focus Master! 🔥`;
    } else if (percentage >= 50) {
      mikeGreeting.textContent = `Level ${mikeXP.level} - Doing Great!`;
    } else {
      mikeGreeting.textContent = `Level ${mikeXP.level} - Keep Going!`;
    }
  }
}

function showXPGainAnimation(xpAmount) {
  const xpGain = document.createElement('div');
  xpGain.innerHTML = `+${xpAmount} XP`;
  xpGain.style.cssText = `
    position: fixed;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    font-weight: 700;
    color: #10b981;
    z-index: 1000;
    pointer-events: none;
    opacity: 0;
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  document.body.appendChild(xpGain);

  requestAnimationFrame(() => {
    xpGain.style.opacity = '1';
    xpGain.style.transform = 'translate(-50%, -80px) scale(1.2)';
  });

  setTimeout(() => {
    xpGain.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(xpGain)) {
        document.body.removeChild(xpGain);
      }
    }, 500);
  }, 1500);
}

function showLevelUpAnimation() {
  // Trigger Mike happy animation
  updateMikeMood('happy');

  // Show sparkles
  const sparkles = document.getElementById('mike-sparkles');
  if (sparkles) {
    sparkles.classList.remove('hidden');
    setTimeout(() => {
      const activeTasks = allTasks.filter(task => !task.title.includes('[COMPLETED]'));
      const completed = activeTasks.filter(t => t.completed).length;
      const total = activeTasks.length;
      const percentage = total > 0 ? (completed / total) * 100 : 0;

      if (percentage < 75) {
        sparkles.classList.add('hidden');
      }
    }, 5000);
  }

  // Show level up notification
  const levelUp = document.createElement('div');
  levelUp.innerHTML = `
    <div style="font-size: 2rem; margin-bottom: 8px;">🎉</div>
    <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">Level Up!</div>
    <div style="font-size: 1rem; color: #666; margin-top: 4px;">Mike reached Level ${mikeXP.level}</div>
  `;
  levelUp.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    z-index: 1000;
    pointer-events: none;
    opacity: 0;
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    text-align: center;
  `;

  document.body.appendChild(levelUp);

  requestAnimationFrame(() => {
    levelUp.style.opacity = '1';
    levelUp.style.transform = 'translate(-50%, -50%) scale(1.05)';
  });

  setTimeout(() => {
    levelUp.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(levelUp)) {
        document.body.removeChild(levelUp);
      }
    }, 500);
  }, 3000);
}

async function syncMikeXPToBackend() {
  if (!currentUser) return;

  try {
    const response = await fetch('https://teyra.app/api/user/mike-xp', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        xp: mikeXP.currentXP,
        level: mikeXP.level,
        xpForNextLevel: mikeXP.xpForNextLevel,
        totalSessions: mikeXP.totalSessions,
        distractionFreeSessions: mikeXP.distractionFreeSessions
      })
    });

    if (response.ok) {
      console.log('✅ Mike XP synced to backend');
    } else {
      console.log('⚠️ Failed to sync Mike XP to backend, but saved locally');
    }
  } catch (error) {
    console.log('⚠️ Error syncing Mike XP to backend:', error.message);
  }
}

// Load pomodoro state on startup
document.addEventListener('DOMContentLoaded', () => {
  loadPomodoroState();
});