// Teyra Chrome Extension - Popup Script

// Supabase configuration - will be injected by build process
const SUPABASE_URL = 'SUPABASE_URL_PLACEHOLDER';
const SUPABASE_ANON_KEY = 'SUPABASE_ANON_KEY_PLACEHOLDER';

// Initialize Supabase
const supabase = window.supabase ?
  window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) :
  (window.Supabase ? window.Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);

let currentUser = null;
let tasks = [];

document.addEventListener('DOMContentLoaded', function() {
  console.log('Teyra popup loaded');

  if (!supabase) {
    console.error('Supabase failed to initialize');
    showAuthScreen();
    return;
  }

  checkAuthState();
  setupEventListeners();
});

async function checkAuthState() {
  try {
    // Check if user data is stored in Chrome storage
    const result = await chrome.storage.local.get(['teyra_user']);

    if (result.teyra_user) {
      currentUser = result.teyra_user;
      showDashboard();
      await loadUserTasks();
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

async function loadUserTasks() {
  if (!currentUser) return;

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Fetch tasks from Supabase
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('date', today)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading tasks:', error);
      return;
    }

    tasks = data || [];
    renderTasks();
    updateProgress();

  } catch (error) {
    console.error('Error loading tasks:', error);
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

    // Update in Supabase
    const { error } = await supabase
      .from('tasks')
      .update({ completed: newCompleted })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      return;
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
    const today = new Date().toISOString().split('T')[0];

    // Add to Supabase
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        user_id: currentUser.id,
        title: title,
        completed: false,
        date: today
      }])
      .select();

    if (error) {
      console.error('Error adding task:', error);
      return;
    }

    // Add to local state
    tasks.push(data[0]);
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