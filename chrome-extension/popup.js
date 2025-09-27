// Teyra Chrome Extension - Popup Script

// Extension now uses Teyra's API instead of direct Supabase connection

let currentUser = null;
let tasks = [];

document.addEventListener('DOMContentLoaded', function() {
  console.log('Teyra popup loaded');
  checkAuthState();
  setupEventListeners();
});

async function checkAuthState() {
  try {
    // Check if user data is stored in Chrome storage
    const result = await chrome.storage.local.get(['teyra_user', 'teyra_tasks']);

    if (result.teyra_user) {
      currentUser = result.teyra_user;
      tasks = result.teyra_tasks || [];
      showDashboard();
      loadUserTasks(); // This will now use stored tasks
    } else {
      showAuthScreen();
    }
  } catch (error) {
    console.error('Error checking auth state:', error);
    showAuthScreen();
  }
}

function setupEventListeners() {
  // Google Sign In
  document.getElementById('google-signin').addEventListener('click', handleGoogleSignIn);

  // Sign Out
  document.getElementById('sign-out').addEventListener('click', handleSignOut);

  // View All Tasks
  document.getElementById('view-all-tasks').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://teyra.app/dashboard' });
    window.close();
  });

  // Add Task
  document.getElementById('add-task-btn').addEventListener('click', function() {
    const input = document.getElementById('add-task-input');
    if (input.style.display === 'none') {
      input.style.display = 'block';
      input.focus();
      this.textContent = 'cancel';
    } else {
      input.style.display = 'none';
      this.textContent = '+ add task';
      input.value = '';
    }
  });

  // Add task on Enter
  document.getElementById('add-task-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && this.value.trim()) {
      addTask(this.value.trim());
      this.value = '';
      this.style.display = 'none';
      document.getElementById('add-task-btn').textContent = '+ add task';
    }
  });
}

async function handleGoogleSignIn() {
  try {
    // For now, we'll use a simplified auth flow
    // In a real implementation, you'd use Chrome's identity API

    // Simulate Google auth - open the main app for sign in
    chrome.tabs.create({ url: 'https://teyra.app/sign-in?extension=true' });
    window.close();

  } catch (error) {
    console.error('Error signing in:', error);
  }
}

async function handleSignOut() {
  try {
    // Clear stored user data
    await chrome.storage.local.remove(['teyra_user']);
    currentUser = null;
    tasks = [];
    showAuthScreen();
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('dashboard-screen').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('dashboard-screen').classList.remove('hidden');
}

function loadUserTasks() {
  if (!currentUser) return;

  try {
    console.log('Loading tasks from storage:', tasks);

    // Filter for today's tasks
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at).toISOString().split('T')[0];
      return taskDate === today;
    });

    console.log('Today\'s tasks:', todayTasks);
    tasks = todayTasks;

    renderTasks();
    updateProgress();

  } catch (error) {
    console.error('Error loading tasks:', error);
    // Show error in UI
    const tasksList = document.getElementById('tasks-list');
    if (tasksList) {
      tasksList.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 14px; text-align: center; padding: 20px;">Error loading tasks. Please refresh.</div>';
    }
  }
}

function renderTasks() {
  const tasksList = document.getElementById('tasks-list');

  if (tasks.length === 0) {
    tasksList.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 14px; text-align: center; padding: 20px;">No tasks for today</div>';
    return;
  }

  tasksList.innerHTML = tasks.map(task => `
    <div class="task-item">
      <div class="task-checkbox ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        ${task.completed ? '✓' : ''}
      </div>
      <div class="task-text ${task.completed ? 'completed' : ''}">${task.title}</div>
    </div>
  `).join('');

  // Add click listeners for checkboxes
  tasksList.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('click', function() {
      const taskId = this.dataset.taskId;
      toggleTask(taskId);
    });
  });
}

async function toggleTask(taskId) {
  if (!currentUser) return;

  try {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

    // Update via API
    const response = await fetch(`https://teyra.app/api/tasks/${taskId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed: newCompleted })
    });

    if (!response.ok) {
      throw new Error(`API response: ${response.status}`);
    }

    // Update local state
    task.completed = newCompleted;
    renderTasks();
    updateProgress();

  } catch (error) {
    console.error('Error toggling task:', error);
  }
}

async function addTask(title) {
  if (!currentUser) return;

  try {
    // Add via API
    const response = await fetch('https://teyra.app/api/tasks', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: title })
    });

    if (!response.ok) {
      throw new Error(`API response: ${response.status}`);
    }

    const newTask = await response.json();
    console.log('Task added via API:', newTask);

    // Add to local state
    tasks.push(newTask);
    renderTasks();
    updateProgress();

  } catch (error) {
    console.error('Error adding task:', error);
  }
}

function updateProgress() {
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;

  document.getElementById('task-progress').textContent = `${completed}/${total}`;

  const percentage = total > 0 ? (completed / total) * 100 : 0;
  document.getElementById('progress-fill').style.width = percentage + '%';
}

// Listen for messages from the main app (when user signs in)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'userSignedIn' && request.user) {
    currentUser = request.user;
    chrome.storage.local.set({ teyra_user: request.user });
    showDashboard();
    loadUserTasks();
  }
});