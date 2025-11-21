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

// ============================================
// SMART TEMPLATES & QUICK ACTIONS
// ============================================

// Built-in templates (ALL FREE! Pro users get custom templates)
const BUILTIN_TEMPLATES = {
  morning: {
    name: 'Morning Routine',
    icon: '☀️',
    tasks: [
      'Check emails and respond to urgent messages',
      'Review calendar for today',
      'Identify top 3 priorities for the day'
    ],
    proOnly: false
  },
  eod: {
    name: 'End of Day',
    icon: '🌙',
    tasks: [
      'Review completed tasks',
      'Plan tomorrow\'s priorities',
      'Clear inbox and archive',
      'Update team on progress'
    ],
    proOnly: false
  },
  focus: {
    name: 'Deep Work Session',
    icon: '🎯',
    tasks: ['[FOCUS_TASK]'], // Special placeholder
    actions: {
      startPomodoro: true,
      enableFocusMode: true,
      duration: 25 // 25 minute Pomodoro session
    },
    proOnly: false
  },
  weekly: {
    name: 'Weekly Review',
    icon: '📊',
    tasks: [
      'Review weekly goals and achievements',
      'Plan next week\'s priorities',
      'Archive completed projects',
      'Schedule important meetings'
    ],
    proOnly: false
  },
  meeting: {
    name: 'Meeting Prep',
    icon: '🤝',
    tasks: [
      'Review meeting agenda',
      'Prepare talking points',
      'Gather necessary documents',
      'Send calendar invite'
    ],
    proOnly: false
  },
  workout: {
    name: 'Workout Session',
    icon: '💪',
    tasks: [
      'Warm up for 5-10 minutes',
      'Complete main workout routine',
      'Cool down and stretch',
      'Log workout in tracker'
    ],
    proOnly: false
  },
  study: {
    name: 'Study Session',
    icon: '📚',
    tasks: [
      'Review lecture notes',
      'Complete practice problems',
      'Make flashcards for key concepts',
      'Summarize main takeaways'
    ],
    proOnly: false
  },
  launch: {
    name: 'Product Launch',
    icon: '🚀',
    tasks: [
      'Final testing and bug fixes',
      'Prepare launch announcement',
      'Notify stakeholders and team',
      'Monitor initial user feedback'
    ],
    proOnly: false
  },
  blog: {
    name: 'Blog Post Workflow',
    icon: '✍️',
    tasks: [
      'Research topic and gather sources',
      'Write first draft',
      'Edit and proofread',
      'Add images and format',
      'Schedule and promote'
    ],
    proOnly: false
  },
  cleanup: {
    name: 'Digital Cleanup',
    icon: '🧹',
    tasks: [
      'Organize desktop and downloads folder',
      'Clear browser tabs and bookmarks',
      'Update and organize notes',
      'Unsubscribe from unwanted emails'
    ],
    proOnly: false
  }
};

let customTemplates = {}; // User-created templates (Pro only)
let templateAutocomplete = null; // Reference to autocomplete dropdown

// Load custom templates from storage
async function loadCustomTemplates() {
  try {
    const result = await chrome.storage.local.get(['custom_templates']);
    customTemplates = result.custom_templates || {};
  } catch (error) {
    console.error('Error loading custom templates:', error);
  }
}

// Save custom templates to storage
async function saveCustomTemplates() {
  try {
    await chrome.storage.local.set({ custom_templates: customTemplates });
  } catch (error) {
    console.error('Error saving custom templates:', error);
  }
}

// Create custom template
async function createCustomTemplate() {
  // Check if Pro user
  if (!(typeof isProUser !== 'undefined' && isProUser)) {
    try { showUpgradePrompt('Custom templates are a Pro feature! Upgrade to create unlimited custom templates with your own commands.'); } catch(_) { alert('Custom templates are a Pro feature.'); }
    return;
  }

  // Simple prompt-based creation (can be enhanced with a modal later)
  const command = prompt('Enter command name (e.g., "deploy" for /deploy):');
  if (!command || !command.trim()) return;

  const commandKey = command.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!commandKey) {
    alert('Command must contain letters or numbers');
    return;
  }

  // Check if command already exists
  if (BUILTIN_TEMPLATES[commandKey] || customTemplates[commandKey]) {
    alert('This command already exists. Choose a different name.');
    return;
  }

  const name = prompt('Enter template name (e.g., "Deploy to Production"):');
  if (!name || !name.trim()) return;

  const tasksInput = prompt('Enter tasks (one per line, separated by | ):');
  if (!tasksInput || !tasksInput.trim()) return;

  const tasks = tasksInput.split('|').map(t => t.trim()).filter(t => t);
  if (tasks.length === 0) {
    alert('You must enter at least one task');
    return;
  }

  // Create template
  customTemplates[commandKey] = {
    name: name.trim(),
    icon: '⚡',
    tasks: tasks,
    proOnly: true
  };

  await saveCustomTemplates();
  renderCustomTemplates();
  showTemplateSuccess(`Created /${commandKey}`, tasks.length);
}

// Delete custom template
async function deleteCustomTemplate(commandKey) {
  if (confirm(`Delete template /${commandKey}?`)) {
    delete customTemplates[commandKey];
    await saveCustomTemplates();
    renderCustomTemplates();
  }
}

// Render custom templates list
function renderCustomTemplates() {
  const container = document.getElementById('custom-templates-list');
  if (!container) return;

  // Show section only for Pro users
  const section = document.getElementById('custom-templates-section');
  if (section) {
    if (typeof isProUser !== 'undefined' && isProUser) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
      return;
    }
  }

  const templateKeys = Object.keys(customTemplates);

  if (templateKeys.length === 0) {
    container.innerHTML = '<p class="empty-templates">Create your own task templates with quick commands</p>';
    return;
  }

  container.innerHTML = templateKeys.map(key => {
    const template = customTemplates[key];
    return `
      <div class="custom-template-item">
        <div class="custom-template-info">
          <div class="custom-template-name">${template.name}</div>
          <div class="custom-template-command">/${key} · ${template.tasks.length} tasks</div>
        </div>
        <div class="custom-template-actions">
          <button class="template-action-btn delete" onclick="deleteCustomTemplate('${key}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// CUSTOM SITE BLOCKING (Pro Feature)
// ============================================

let customBlockedSites = []; // User-added sites

// Load custom blocked sites
async function loadCustomBlockedSites() {
  try {
    const result = await chrome.storage.local.get(['custom_blocked_sites']);
    customBlockedSites = result.custom_blocked_sites || [];
  } catch (error) {
    console.error('Error loading custom blocked sites:', error);
  }
}

// Save custom blocked sites
async function saveCustomBlockedSites() {
  try {
    await chrome.storage.local.set({ custom_blocked_sites: customBlockedSites });
  } catch (error) {
    console.error('Error saving custom blocked sites:', error);
  }
}

// Legacy function - now handled by custom-site-input field and addCustomSite()
// This function is kept for backwards compatibility but redirects to the proper UI

// Delete custom blocked site
async function deleteCustomBlockedSite(index) {
  if (confirm(`Remove ${customBlockedSites[index].name} from blocked sites?`)) {
    customBlockedSites.splice(index, 1);
    await saveCustomBlockedSites();
    renderCustomBlockedSites();
  }
}

// Render custom blocked sites
function renderCustomBlockedSites() {
  const container = document.getElementById('custom-sites-list');
  if (!container) return;

  // Show/hide sections based on Pro status
  const section = document.getElementById('custom-sites-section');
  const lockedSection = document.getElementById('custom-sites-locked');

  if (typeof isProUser !== 'undefined' && isProUser) {
    if (section) section.classList.remove('hidden');
    if (lockedSection) lockedSection.classList.add('hidden');
  } else {
    if (section) section.classList.add('hidden');
    if (lockedSection) lockedSection.classList.remove('hidden');
    return;
  }

  if (customBlockedSites.length === 0) {
    container.innerHTML = '<p class="empty-templates">Add websites to block during focus mode</p>';
    return;
  }

  container.innerHTML = customBlockedSites.map((site, index) => `
    <div class="custom-template-item">
      <div class="custom-template-info">
        <div class="custom-template-name">${site.icon} ${site.name}</div>
        <div class="custom-template-command">${site.url}</div>
      </div>
      <div class="custom-template-actions">
        <button class="template-action-btn delete" onclick="deleteCustomBlockedSite(${index})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Get available templates based on Pro status
function getAvailableTemplates() {
  const templates = {};

  // Add built-in templates
  for (const [key, template] of Object.entries(BUILTIN_TEMPLATES)) {
    // Free users only get non-Pro templates
    if (!template.proOnly || (typeof isProUser !== 'undefined' && isProUser)) {
      templates[key] = template;
    }
  }

  // Pro users get custom templates
  if (typeof isProUser !== 'undefined' && isProUser) {
    Object.assign(templates, customTemplates);
  }

  return templates;
}

// Parse command from input
function parseCommand(input) {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  // Extract command and args
  const parts = trimmed.slice(1).split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  return { command, args };
}

// Execute template command
async function executeTemplate(templateKey, args = '') {
  const templates = getAvailableTemplates();
  const template = templates[templateKey];

  if (!template) {
    showTemplateError(`Template "/${templateKey}" not found`);
    return false;
  }

  // Check if Pro-only template
  if (template.proOnly && !(typeof isProUser !== 'undefined' && isProUser)) {
    try { showUpgradePrompt('This template is a Pro feature! Upgrade to unlock unlimited templates and quick actions.'); } catch(_) { alert('Pro feature'); }
    return false;
  }

  console.log(`📝 Executing template: ${template.name}`);

  // Add tasks from template
  for (let taskTitle of template.tasks) {
    // Replace placeholder with args
    if (taskTitle === '[FOCUS_TASK]') {
      taskTitle = args || 'Deep work session';
    }

    await addTask(taskTitle);
  }

  // Execute actions if present
  if (template.actions) {
    if (template.actions.startPomodoro) {
      // Set custom duration if specified
      if (template.actions.duration) {
        pomodoroState.workDuration = template.actions.duration * 60;
        pomodoroState.timeRemaining = template.actions.duration * 60;
      }
      startPomodoro();
    }

    if (template.actions.enableFocusMode) {
      const toggle = document.getElementById('focus-toggle');
      if (toggle && !toggle.checked) {
        toggle.checked = true;
        await toggleFocusMode();
      }
    }
  }

  // Show success feedback
  showTemplateSuccess(template.name, template.tasks.length);

  return true;
}

// Show template autocomplete dropdown
function showTemplateAutocomplete(input, cursorPosition) {
  const parsed = parseCommand(input);
  if (!parsed) {
    hideTemplateAutocomplete();
    return;
  }

  const templates = getAvailableTemplates();
  const matchingTemplates = Object.entries(templates).filter(([key, template]) => {
    return key.startsWith(parsed.command) || template.name.toLowerCase().includes(parsed.command);
  });

  if (matchingTemplates.length === 0) {
    hideTemplateAutocomplete();
    return;
  }

  // Create or update autocomplete dropdown
  if (!templateAutocomplete) {
    templateAutocomplete = document.createElement('div');
    templateAutocomplete.id = 'template-autocomplete';
    templateAutocomplete.className = 'template-autocomplete';
    document.body.appendChild(templateAutocomplete);
  }

  // Position below task input
  const taskInput = document.getElementById('task-input');
  const rect = taskInput.getBoundingClientRect();
  templateAutocomplete.style.top = (rect.bottom + 4) + 'px';
  templateAutocomplete.style.left = rect.left + 'px';
  templateAutocomplete.style.width = rect.width + 'px';

  // Render template options
  templateAutocomplete.innerHTML = matchingTemplates.map(([key, template]) => {
    const isLocked = template.proOnly && !(typeof isProUser !== 'undefined' && isProUser);
    return `
      <div class="template-option ${isLocked ? 'locked' : ''}" data-template="${key}">
        <div class="template-option-left">
          <span class="template-icon">${template.icon || '📝'}</span>
          <div class="template-info">
            <div class="template-name">
              <span class="template-command">/${key}</span>
              ${template.name}
              ${isLocked ? '<span class="pro-badge-mini">PRO</span>' : ''}
            </div>
            <div class="template-desc">${template.tasks.length} task${template.tasks.length > 1 ? 's' : ''} • ${template.tasks[0].substring(0, 50)}${template.tasks[0].length > 50 ? '...' : ''}</div>
          </div>
        </div>
        ${isLocked ? '<div class="template-lock">🔒</div>' : ''}
      </div>
    `;
  }).join('');

  // Add click handlers
  templateAutocomplete.querySelectorAll('.template-option').forEach(option => {
    option.addEventListener('click', async () => {
      const key = option.dataset.template;
      const taskInput = document.getElementById('task-input');

      // Execute template
      await executeTemplate(key, parsed.args);

      // Clear input and hide autocomplete
      taskInput.value = '';
      hideTemplateAutocomplete();
    });
  });

  templateAutocomplete.classList.add('show');
}

// Hide autocomplete
function hideTemplateAutocomplete() {
  if (templateAutocomplete) {
    templateAutocomplete.classList.remove('show');
  }
}

// Show template success message
function showTemplateSuccess(templateName, taskCount) {
  const toast = document.createElement('div');
  toast.className = 'template-toast success';
  toast.innerHTML = `
    <div class="template-toast-icon">✨</div>
    <div class="template-toast-content">
      <div class="template-toast-title">${templateName}</div>
      <div class="template-toast-desc">Added ${taskCount} task${taskCount > 1 ? 's' : ''}</div>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Show template error message
function showTemplateError(message) {
  const toast = document.createElement('div');
  toast.className = 'template-toast error';
  toast.innerHTML = `
    <div class="template-toast-icon">⚠️</div>
    <div class="template-toast-content">
      <div class="template-toast-title">Template Error</div>
      <div class="template-toast-desc">${message}</div>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🌵 Teyra popup loaded with Mike!');

  // Track popup open
  if (typeof trackEvent === 'function') {
    trackEvent('popup_opened');
  }

  checkAuthState();
  setupEventListeners();
  setupBackgroundListeners();
  loadMikeXP();
  loadCustomTemplates();
  loadCustomBlockedSites();

  // Live demo: Highlight → Task handlers
  const demoParagraph = document.getElementById('demo-paragraph');
  const demoAddTaskBtn = document.getElementById('demo-add-task');
  const demoAddCalendarBtn = document.getElementById('demo-add-calendar');
  const demoFeedback = document.getElementById('demo-feedback');

  function getSelectionText() {
    const sel = window.getSelection();
    return sel && sel.toString().trim();
  }

  function showFeedback(msg, type='info') {
    if (!demoFeedback) return;
    demoFeedback.textContent = msg;
    demoFeedback.style.color = type === 'success' ? '#0f766e' : 'rgba(0,0,0,0.6)';
  }

  if (demoAddTaskBtn) {
    demoAddTaskBtn.addEventListener('click', async () => {
      const text = getSelectionText() || (demoParagraph ? demoParagraph.textContent.trim() : '');
      if (!text) return showFeedback('Select some text first.');
      try {
        if (typeof addTaskFromText === 'function') {
          await addTaskFromText(text);
        } else {
          await addTask(text); // fallback to existing add flow if present
        }
        showFeedback('Added to Teyra!', 'success');
      } catch (e) {
        showFeedback('Failed to add to Teyra.');
      }
    });
  }

  if (demoAddCalendarBtn) {
    demoAddCalendarBtn.addEventListener('click', async () => {
      const text = getSelectionText() || (demoParagraph ? demoParagraph.textContent.trim() : '');
      if (!text) return showFeedback('Select some text first.');
      try {
        if (typeof addCalendarEventFromText === 'function') {
          await addCalendarEventFromText(text);
        }
        showFeedback('Sent to Google Calendar!', 'success');
      } catch (e) {
        showFeedback('Failed to add to Calendar.');
      }
    });
  }

  // Initialize Pro features only if user is logged in
  if (typeof initializeProFeatures === 'function') {
    setTimeout(async () => {
      if (currentUser) {
        await initializeProFeatures();
      }
    }, 500);
  }

  // Setup dismiss showcase button
  setupShowcaseDismiss();
  setupDemoDismiss();

  // Initialize XP/Level display
  if (typeof initializeXPSystem === 'function') {
    initializeXPSystem();
  }

  // Setup upgrade buttons
  setupUpgradeButtons();

  // Start random pro popups (if not Pro user)
  if (currentUser && typeof startRandomProPopups === 'function') {
    setTimeout(() => {
      startRandomProPopups();
    }, 30000); // Start after 30 seconds
  }
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
    // Check if we're waiting for Google auth completion
    const storage = await chrome.storage.local.get(['teyra_user', 'teyra_tasks', 'awaiting_google_auth']);

    if (storage.awaiting_google_auth) {
      console.log('Checking for Google auth completion...');
      // Show loading overlay WITHOUT destroying the HTML structure
      const authScreen = document.getElementById('auth-screen');
      if (authScreen && !document.getElementById('auth-loading-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'auth-loading-overlay';
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 40px;
          text-align: center;
        `;
        overlay.innerHTML = `
          <img src="Neutral Calm.gif" alt="Mike" style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 16px;">
          <h2 style="color: white; margin-bottom: 10px; text-align: center;">Checking authentication...</h2>
          <p style="color: rgba(255,255,255,0.6); font-size: 14px; text-align: center;">Please wait a moment</p>
        `;
        authScreen.appendChild(overlay);
      }

      // Poll for auth status
      await pollForAuth();
      return;
    }

    if (storage.teyra_user) {
      currentUser = storage.teyra_user;
      allTasks = storage.teyra_tasks || [];
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

async function pollForAuth() {
  let attempts = 0;
  const maxAttempts = 10; // Poll for 10 seconds

  const poll = async () => {
    attempts++;
    console.log(`Polling for auth (attempt ${attempts}/${maxAttempts})...`);

    try {
      const response = await fetch('APP_URL_PLACEHOLDER/api/user', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User is now logged in:', userData);

        // Store user data
        currentUser = userData;
        await chrome.storage.local.set({
          teyra_user: userData,
          awaiting_google_auth: false
        });

        // Remove loading overlay
        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) overlay.remove();

        showDashboard();
        await loadUserTasks();
      } else {
        console.log(`Auth polling attempt ${attempts}: ${response.status}`);
        if (attempts < maxAttempts) {
          // Try again in 1 second
          setTimeout(poll, 1000);
        } else {
          // Max attempts reached, clear flag and show auth screen
          await chrome.storage.local.set({ awaiting_google_auth: false });
          showAuthScreen();
    showToast('please try signing in again');
        }
      }
    } catch (error) {
      console.log(`Auth polling attempt ${attempts} failed:`, error);
      if (attempts < maxAttempts) {
        // Try again in 1 second
        setTimeout(poll, 1000);
      } else {
        // Max attempts reached, clear flag and show auth screen
        await chrome.storage.local.set({ awaiting_google_auth: false });
        showAuthScreen();
          showToast('connection error. please try again');
      }
    }
  };

  poll();
}

async function checkWebsiteAuth() {
  try {
    // Try to fetch user data from the API to see if they're already logged in
    const response = await fetch('APP_URL_PLACEHOLDER/api/user', {
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
  // Auth Tab Switching
  document.getElementById('tab-signin')?.addEventListener('click', () => switchAuthTab('signin'));
  document.getElementById('tab-signup')?.addEventListener('click', () => switchAuthTab('signup'));

  // Google Sign In/Sign Up
  document.getElementById('google-signin')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('google-signup')?.addEventListener('click', handleGoogleSignIn);

  // Email Sign In
  document.getElementById('email-signin')?.addEventListener('click', handleEmailSignIn);
  document.getElementById('signin-password')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleEmailSignIn();
  });

  // Email Sign Up
  document.getElementById('email-signup')?.addEventListener('click', handleEmailSignUp);
  document.getElementById('signup-confirm')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleEmailSignUp();
  });

  // Sign Out
  document.getElementById('sign-out')?.addEventListener('click', handleSignOut);

  // Focus Mode Toggle
  document.getElementById('focus-toggle').addEventListener('change', toggleFocusMode);

  // Settings Button
  document.getElementById('settings-btn').addEventListener('click', toggleSettings);

  // View All Tasks
  document.getElementById('view-all-tasks').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://teyra.app/dashboard' });
    window.close();
  });

  // Add task on Enter with smooth animation + template support
  const taskInput = document.getElementById('task-input');

  // Show autocomplete as user types (debounced for performance)
  let autocompleteTimeout;
  taskInput.addEventListener('input', function(e) {
    const value = this.value;

    // Clear previous timeout
    clearTimeout(autocompleteTimeout);

    // Debounce autocomplete to reduce lag
    autocompleteTimeout = setTimeout(() => {
    if (value.startsWith('/')) {
      showTemplateAutocomplete(value, this.selectionStart);
    } else {
      hideTemplateAutocomplete();
    }
    }, 150);
  });

  // Handle Enter key
  taskInput.addEventListener('keypress', async function(e) {
    if (e.key === 'Enter' && this.value.trim()) {
      const input = this.value.trim();

      // Check if it's a template command
      const parsed = parseCommand(input);
      if (parsed) {
        // Execute template
        const success = await executeTemplate(parsed.command, parsed.args);

        if (success) {
          // Clear input
          this.value = '';
          hideTemplateAutocomplete();
        }
        return;
      }

      // Regular task addition
      const taskTitle = input;

      // Clear input immediately for better UX
      this.value = '';
      hideTemplateAutocomplete();

      // Add the task (no animation delay)
      await addTask(taskTitle);
    }
  });

  // Hide autocomplete on blur (with slight delay for click handling)
  taskInput.addEventListener('blur', function() {
    setTimeout(() => hideTemplateAutocomplete(), 200);
  });

  // Support arrow keys and Escape in autocomplete
  taskInput.addEventListener('keydown', function(e) {
    if (!templateAutocomplete || !templateAutocomplete.classList.contains('show')) {
      return;
    }

    if (e.key === 'Escape') {
      hideTemplateAutocomplete();
      e.preventDefault();
    }
  });

  // Focus session action buttons
  document.getElementById('end-focus')?.addEventListener('click', endFocusSession);

  // Pomodoro timer controls
  document.getElementById('focus-timer-start')?.addEventListener('click', () => {
    startPomodoro();
    // Auto-enable focus mode when Pomodoro starts
    const focusToggle = document.getElementById('focus-toggle');
    if (focusToggle && !focusToggle.checked) {
      focusToggle.checked = true;
      toggleFocusMode();
    }
  });

  // Make timer display editable
  document.getElementById('focus-timer-large')?.addEventListener('click', function() {
    // Don't allow editing while timer is running
    if (pomodoroState.isRunning) return;

    const currentText = this.textContent;
    this.classList.add('editing');

    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pomodoro-timer-input';
    input.value = currentText;
    input.style.width = '200px';

    // Replace text with input
    this.textContent = '';
    this.appendChild(input);
    input.focus();
    input.select();

    // Handle input completion
    const finishEdit = () => {
      const value = input.value.trim();
      const minutes = parseTimeInput(value);

      if (minutes !== null) {
        // Update pomodoro state
        pomodoroState.workDuration = minutes * 60;
        pomodoroState.timeRemaining = minutes * 60;
        savePomodoroState();
      }

      // Remove input and restore display
      this.removeChild(input);
      this.classList.remove('editing');
      updatePomodoroDisplay();
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        finishEdit();
      }
    });
  });

  document.getElementById('focus-timer-pause')?.addEventListener('click', () => {
    pausePomodoro();
    updatePomodoroDisplay();
  });

  document.getElementById('focus-timer-reset')?.addEventListener('click', () => {
    resetPomodoro();
    updatePomodoroDisplay();
    // Disable focus mode when reset
    const focusToggle = document.getElementById('focus-toggle');
    if (focusToggle && focusToggle.checked) {
      focusToggle.checked = false;
      toggleFocusMode();
    }
  });

  // Custom template creation (Pro feature)
  document.getElementById('create-template-btn')?.addEventListener('click', createCustomTemplate);

  // Custom site blocking (Pro feature)
  document.getElementById('add-blocked-site-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('custom-site-input');
    if (input && input.value.trim()) {
      await addCustomSite(input.value.trim());
      input.value = '';
    }
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

// Switch between Sign In and Sign Up tabs
function switchAuthTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`tab-${tab}`).classList.add('active');

  // Update form visibility
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.remove('active');
  });
  document.getElementById(`${tab}-form`).classList.add('active');
}

async function handleGoogleSignIn() {
  try {
    // Add click animation
    const btn = event.target.closest('button');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 150);

    // Open the main app for sign in with onboarding flow
    chrome.tabs.create({ url: 'https://teyra.app/sign-in?extension=true&onboarding=true' });

    // Store a flag that we're waiting for Google auth
    await chrome.storage.local.set({ awaiting_google_auth: true });

    window.close();
  } catch (error) {
    console.error('Error signing in:', error);
    showToast('failed to open sign in page');
  }
}

async function handleEmailSignIn() {
  const email = document.getElementById('signin-email')?.value.trim();
  const password = document.getElementById('signin-password')?.value;

  if (!email || !password) {
    showToast('please enter both email and password');
    return;
  }

  if (!email.includes('@')) {
    showToast('please enter a valid email address');
    return;
  }

  // Open Teyra sign-in page (uses Clerk)
  chrome.tabs.create({ url: 'https://teyra.app/sign-in?extension=true' });

  // Store a flag that we're waiting for auth
  await chrome.storage.local.set({ waiting_for_auth: true });

  showToast('opening teyra sign-in...');
  window.close();
}

async function handleEmailSignUp() {
  const email = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value;
  const confirm = document.getElementById('signup-confirm')?.value;

  if (!email || !password || !confirm) {
    showToast('please fill in all fields');
    return;
  }

  if (!email.includes('@')) {
    showToast('please enter a valid email address');
    return;
  }

  if (password.length < 8) {
    showToast('password must be at least 8 characters');
    return;
  }

  if (password !== confirm) {
    showToast('passwords do not match');
    return;
  }

  // Open Teyra sign-up page (uses Clerk)
  chrome.tabs.create({ url: 'https://teyra.app/sign-up?extension=true' });

  // Store a flag that we're waiting for auth
  await chrome.storage.local.set({ waiting_for_auth: true });

  showToast('opening teyra sign-up...');
  window.close();
}

async function handleSignOut() {
  try {
    console.log('🚪 Signing out...');

    // Clear ALL stored user data including Pro status, AI usage, etc.
    await chrome.storage.local.clear();

    console.log('✅ All local storage cleared');

    // Reset state variables
    currentUser = null;
    allTasks = [];

    // Reset Mike XP
    mikeXP = {
      currentXP: 0,
      level: 1,
      xpForNextLevel: 100,
      totalSessions: 0,
      distractionFreeSessions: 0
    };

    // Reset Pomodoro state
    if (pomodoroState.intervalId) {
      clearInterval(pomodoroState.intervalId);
    }
    pomodoroState = {
      isRunning: false,
      isPaused: false,
      isBreak: false,
      timeRemaining: 25 * 60,
      workDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      currentSession: 1,
      totalSessions: 4,
      linkedTaskId: null,
      linkedTaskTitle: null,
      intervalId: null,
      sessionStartTime: null,
      distractionFree: true
    };

    // Show auth screen
    showAuthScreen();

    showToast('signed out successfully');
    console.log('✅ Sign out complete');
  } catch (error) {
    console.error('❌ Error signing out:', error);
    showToast('error signing out. please try again.');
  }
}

// Current view state
let currentView = 'tasks'; // 'tasks', 'focus', 'settings'

async function toggleFocusMode() {
  const toggle = document.getElementById('focus-toggle');
  const isEnabled = toggle.checked;

  if (isEnabled) {
    // Show "LOCK IN" overlay animation
    await showLockInAnimation();
  }

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
    // Pomodoro is now manually controlled - don't auto-start
  } else {
    console.log('✅ Focus mode disabled - showing tasks');
    stopFocusTimer();
    // Don't auto-pause Pomodoro - let it continue if user wants
  }
}

async function showLockInAnimation() {
  const overlay = document.getElementById('lock-in-overlay');
  if (!overlay) return;

  // Show overlay
  overlay.classList.remove('hidden');

  // Reduced animation time for better UX (800ms total)
  await new Promise(resolve => setTimeout(resolve, 800));

  // Hide overlay immediately
  overlay.classList.add('hidden');
}

function updateUI(focusEnabled) {
  const body = document.body;
  const headerTitle = document.getElementById('header-title');
  const mikeStatus = document.getElementById('mike-status');
  const focusTitle = document.getElementById('focus-title');
  const focusDescription = document.getElementById('focus-description');
  const timerDisplay = document.getElementById('focus-timer-display');

  if (focusEnabled) {
    body.classList.add('focus-mode-active');
    headerTitle.textContent = 'Mike';
    mikeStatus.textContent = '🔒 Focus mode active';
    if (focusTitle) focusTitle.textContent = 'Focus Mode Active';
    if (focusDescription) focusDescription.textContent = '25min session - distractions blocked';
    if (timerDisplay) timerDisplay.classList.remove('hidden');
  } else {
    body.classList.remove('focus-mode-active');
    headerTitle.textContent = 'Mike';
    mikeStatus.textContent = 'Ready to focus';
    if (timerDisplay) timerDisplay.classList.add('hidden');
    if (focusTitle) focusTitle.textContent = 'Focus Mode';
    if (focusDescription) focusDescription.textContent = 'Block distractions and stay productive';
  }
}

function showView(viewName) {
  // Hide all views
  const tv = document.getElementById('tasks-view');
  const fv = document.getElementById('focus-view');
  const sv = document.getElementById('settings-view');
  if (tv) tv.classList.add('hidden');
  if (fv) fv.classList.add('hidden');
  if (sv) sv.classList.add('hidden');

  // Show requested view
  const target = document.getElementById(viewName + '-view');
  if (target) target.classList.remove('hidden');
  currentView = viewName;
}

function toggleSettings() {
  if (currentView === 'settings') {
    // Always go back to tasks view
    showView('tasks');
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
  const authScreen = document.getElementById('auth-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');

  if (authScreen) {
    authScreen.classList.remove('hidden');
    authScreen.style.visibility = 'visible';
    authScreen.style.position = 'relative';
    authScreen.style.zIndex = '1';
  }

  if (dashboardScreen) {
    dashboardScreen.classList.add('hidden');
    dashboardScreen.style.visibility = 'hidden';
    dashboardScreen.style.position = 'absolute';
    dashboardScreen.style.zIndex = '-1';
  }

  // Reset Mike to neutral for auth screen
  updateMikeMood('neutral');
}

async function showDashboard() {
  console.log('🎯 showDashboard() called');

  // Remove any loading overlays
  const overlay = document.getElementById('auth-loading-overlay');
  if (overlay) {
    console.log('Removing auth overlay');
    overlay.remove();
  }

  const authScreen = document.getElementById('auth-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');

  console.log('Auth screen:', authScreen ? 'found' : 'NOT FOUND');
  console.log('Dashboard screen:', dashboardScreen ? 'found' : 'NOT FOUND');

  // Hide auth screen using visibility and position
  if (authScreen) {
    authScreen.classList.add('hidden');
    authScreen.style.visibility = 'hidden';
    authScreen.style.position = 'absolute';
    authScreen.style.zIndex = '-1';
    console.log('✅ Auth screen hidden');
  }

  // Show dashboard screen
  if (dashboardScreen) {
    dashboardScreen.classList.remove('hidden');
    dashboardScreen.style.visibility = 'visible';
    dashboardScreen.style.position = 'relative';
    dashboardScreen.style.zIndex = '1';
    console.log('✅ Dashboard screen shown');
  }

  // Load focus mode state
  const result = await chrome.storage.local.get(['focus_mode_active']);
  const isEnabled = result.focus_mode_active || false;
  document.getElementById('focus-toggle').checked = isEnabled;

  // Update UI - always stay on tasks view
  updateUI(isEnabled);
  showView('tasks');

  // Resume focus timer if focus mode is active
  if (isEnabled) {
    startFocusTimer();
  }

  // Load user-specific Mike state and update mood based on their progress
  await loadUserMikeState();
  updateMikeMoodFromProgress();

  // Initialize Pro features when dashboard loads
  if (typeof initializeProFeatures === 'function') {
    await initializeProFeatures();
  }

  // Render custom templates (Pro users only)
  renderCustomTemplates();

  // Render custom blocked sites (Pro users only)
  renderCustomBlockedSites();
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
    }
    // Silently fail if API not available
  } catch (error) {
    // Silently fail - API not available or user not logged in
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
          <p>error loading tasks</p>
          <p>please try refreshing the extension</p>
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
      <div style="text-align: center; padding: 60px 20px;">
        <p style="margin-bottom: 8px; color: rgba(255, 255, 255, 0.6); font-size: 15px;">no tasks yet</p>
        <p style="font-size: 13px; color: rgba(255, 255, 255, 0.4);">add your first task above</p>
      </div>
    `;
    return;
  }

  // Filter out [COMPLETED] tasks and show active tasks
  const activeTasks = allTasks.filter(task => !task.title.includes('[COMPLETED]'));
  
  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();

  activeTasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item liquid-glass-task';

    taskElement.innerHTML = `
      <button class="task-checkbox ${task.completed ? 'completed' : ''}" data-task-id="${task.id}"></button>
      <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</span>
      <button class="task-delete" data-task-id="${task.id}" title="Delete task">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    `;

    // Add click handler for checkbox
    const checkbox = taskElement.querySelector('.task-checkbox');
    checkbox.addEventListener('click', () => toggleTask(task.id));

    // Add click handler for delete button
    const deleteBtn = taskElement.querySelector('.task-delete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    fragment.appendChild(taskElement);
  });

  // Single DOM update for better performance
  tasksList.innerHTML = '';
  tasksList.appendChild(fragment);
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
  // Simplified celebration - just update Mike's mood
  // No heavy animations that cause lag
  updateMikeMoodFromProgress();
}

async function addTask(title) {
  if (!currentUser) return;

  try {
    console.log('Adding task:', title);

    // Track task creation
    if (typeof trackEvent === 'function') {
      trackEvent('task_created', { method: 'manual' });
    }

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

    // Re-render immediately for responsive UI (no animation delay)
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

  // Update header counters
  const headerCompletedEl = document.getElementById('header-completed-tasks');
  const headerTotalEl = document.getElementById('header-total-tasks');
  if (headerCompletedEl) headerCompletedEl.textContent = completed.toString();
  if (headerTotalEl) headerTotalEl.textContent = total.toString();

  // Update progress card counters
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
  // Calculate total points using the SAME system as the dashboard
  // Regular tasks = 10 points, Sustainable tasks = 20 points
  const completedTasks = allTasks.filter(task => {
    return task.title.includes('[COMPLETED]') || (task.completed && !task.title.includes('[COMPLETED]'));
  });

  const sustainableTasks = [
    "🌱 Use a reusable water bottle",
    "♻️ Put one item in recycling",
    "🚶 Take stairs instead of elevator",
    "💡 Turn off one light you're not using",
    "🌿 Save food scraps for composting",
    "📱 Choose digital receipt at store",
    "🚿 Reduce shower time by 1 minute",
    "🌍 Buy one local product if shopping",
    "🔌 Unplug one device when done",
    "🥬 Add vegetables to one meal"
  ];

  let totalPoints = 0;
  completedTasks.forEach(task => {
    const taskTitle = task.title.replace(/^\[COMPLETED\]\s*/, '');
    const isSustainable = sustainableTasks.includes(taskTitle);
    totalPoints += isSustainable ? 20 : 10;
  });

  // Determine Mike's mood based on POINTS not percentage
  // Same thresholds as dashboard: 0-99 = sad, 100-249 = neutral, 250+ = happy
  let newMood = 'sad';
  let moodText = "Ready to focus";
  let greetingText = "Hey there!";
  let motivationText = "Let's get some tasks done today";

  if (totalPoints === 0) {
    newMood = 'sad';
    moodText = "Ready to start";
    greetingText = "Hey there!";
    motivationText = "Add your first task to get started";
  } else if (totalPoints >= 250) {
    newMood = 'happy';
    moodText = "Happy! 🎉";
    greetingText = "Amazing work!";
    motivationText = "You've earned " + totalPoints + " points!";
  } else if (totalPoints >= 100) {
    newMood = 'neutral';
    moodText = "Making progress";
    greetingText = "Keep it up!";
    motivationText = "You have " + totalPoints + " points";
  } else {
    newMood = 'sad';
    moodText = "Getting started";
    greetingText = "Nice start!";
    motivationText = "You have " + totalPoints + " points";
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
    totalPoints: totalPoints,
    completedTasks: completedTasks.length
  });
}

function updateMikeMood(mood) {
  if (currentMood === mood) return;

  currentMood = mood;
  const mikeImg = document.getElementById('mike-cactus');
  const sparkles = document.getElementById('cactus-sparkles');
  const plant = document.getElementById('cactus-plant');

  if (!mikeImg) return;

  // Instant update - no transition delay for better performance
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

// Parse time input - supports formats like "25", "25:00", "90", "1:30"
function parseTimeInput(input) {
  if (!input) return null;

  // Remove any spaces
  input = input.trim();

  // Check for MM:SS format
  if (input.includes(':')) {
    const parts = input.split(':');
    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1] || 0);

    if (isNaN(minutes) || isNaN(seconds)) return null;
    if (seconds >= 60) return null;

    return minutes + (seconds / 60);
  }

  // Just a number - treat as minutes
  const minutes = parseInt(input);
  if (isNaN(minutes) || minutes <= 0 || minutes > 999) return null;

  return minutes;
}

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

  // Update SVG progress ring
  const progressRing = document.querySelector('.pomodoro-progress-ring-fill');
  if (progressRing) {
    const totalTime = pomodoroState.isBreak ?
      (pomodoroState.currentSession > pomodoroState.totalSessions ? pomodoroState.longBreakDuration : pomodoroState.shortBreakDuration) :
      pomodoroState.workDuration;

    const progress = pomodoroState.timeRemaining / totalTime;
    const radius = 57; // r attribute of circle
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);

    progressRing.style.strokeDasharray = `${circumference}`;
    progressRing.style.strokeDashoffset = `${offset}`;
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

  // Show/hide buttons
  const startBtn = document.getElementById('focus-timer-start');
  const pauseBtn = document.getElementById('focus-timer-pause');
  if (startBtn) startBtn.classList.add('hidden');
  if (pauseBtn) pauseBtn.classList.remove('hidden');

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
  pomodoroState.currentSession = 1; // Reset session counter

  // Show start button, hide pause button
  const startBtn = document.getElementById('focus-timer-start');
  const pauseBtn = document.getElementById('focus-timer-pause');
  if (startBtn) startBtn.classList.remove('hidden');
  if (pauseBtn) {
    pauseBtn.classList.add('hidden');
    // Reset pause button icon to pause (not play)
    pauseBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="2"/>
        <rect x="14" y="4" width="4" height="16" rx="2"/>
      </svg>
    `;
  }

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

    // Award XP for distraction-free sessions AND award 30 points to cactus
    if (wasDistractionFree) {
      await awardSessionXP(30);
      await awardPomodoroPointsToCactus(true); // Award 30 points to cactus

      // Show special notification for distraction-free session
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'teyra-logo-64kb.png',
        title: '🎉 Distraction-Free Session Complete!',
        message: `+30 points! You've completed session ${pomodoroState.currentSession} without distractions. Mike is happy!`,
        priority: 2
      });
    } else {
      await awardPomodoroPointsToCactus(false); // Still award 30 points even with distractions

      // Show regular notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'teyra-logo-64kb.png',
        title: 'Focus Session Complete!',
        message: `+30 points! You've completed session ${pomodoroState.currentSession}. Take a break.`,
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

async function awardPomodoroPointsToCactus(distractionFree) {
  if (!currentUser) return;

  try {
    console.log('🌵 Awarding 30 points to cactus for pomodoro completion...');

    const response = await fetch('https://teyra.app/api/extension/pomodoro-complete', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        distractionFree
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cactus points awarded:', data);

      // Reload tasks to update progress/cactus mood
      await loadUserTasks();

      return data;
    } else {
      console.log('⚠️ Failed to award cactus points, but saved locally');
    }
  } catch (error) {
    console.log('⚠️ Error awarding cactus points:', error.message);
  }
}

// Load pomodoro state on startup
document.addEventListener('DOMContentLoaded', () => {
  // Demo toggle
  // Demo removed

  loadPomodoroState();
});

// ============================================
// Focus Mode Website Customization
// ============================================

const DEFAULT_BLOCKED_SITES = [
  { name: 'YouTube', url: '*.youtube.com/*', icon: '📺' },
  { name: 'Twitter / X', url: '*.twitter.com/*,*.x.com/*', icon: '🐦' },
  { name: 'LinkedIn', url: '*.linkedin.com/*', icon: '💼' },
  { name: 'Instagram', url: '*.instagram.com/*', icon: '📷' },
  { name: 'TikTok', url: '*.tiktok.com/*', icon: '🎵' },
  { name: 'Facebook', url: '*.facebook.com/*', icon: '👥' }
];

async function initializeFocusCustomization() {
  // Populate default blocked sites
  await populateDefaultBlockedSites();

  // Load and display custom sites
  await loadCustomBlockedSites();

  // Setup event listeners
  setupFocusCustomizationListeners();
}

async function populateDefaultBlockedSites() {
  const container = document.getElementById('default-blocked-sites');
  if (!container) return;

  // Load user's blocked sites preferences
  const result = await chrome.storage.local.get(['blocked_sites_settings']);
  let blockedSettings = result.blocked_sites_settings || {};

  // Initialize default values if not set
  let needsSave = false;
  DEFAULT_BLOCKED_SITES.forEach((site) => {
    if (blockedSettings[site.url] === undefined) {
      blockedSettings[site.url] = true; // Default to blocked
      needsSave = true;
    }
  });

  if (needsSave) {
    await chrome.storage.local.set({ blocked_sites_settings: blockedSettings });
    console.log('✅ Initialized default blocked sites settings');
  }

  container.innerHTML = '';

  DEFAULT_BLOCKED_SITES.forEach((site, index) => {
    const isBlocked = blockedSettings[site.url] === true; // Explicitly check for true

    const siteItem = document.createElement('div');
    siteItem.className = 'blocked-site-item';
    siteItem.innerHTML = `
      <div class="blocked-site-info">
        <span class="site-icon">${site.icon}</span>
        <div>
          <div class="site-name">${site.name}</div>
          <div class="site-url">${site.url.replace(/\*/g, '')}</div>
        </div>
      </div>
      <label class="site-toggle">
        <input type="checkbox" ${isBlocked ? 'checked' : ''} data-site-url="${site.url}">
        <span class="site-toggle-slider"></span>
      </label>
    `;

    // Add toggle listener
    const toggle = siteItem.querySelector('input[type="checkbox"]');
    toggle.addEventListener('change', async (e) => {
      await toggleDefaultSite(site.url, e.target.checked);
    });

    container.appendChild(siteItem);
  });
}

async function toggleDefaultSite(siteUrl, isBlocked) {
  const result = await chrome.storage.local.get(['blocked_sites_settings']);
  const blockedSettings = result.blocked_sites_settings || {};

  blockedSettings[siteUrl] = isBlocked;

  await chrome.storage.local.set({ blocked_sites_settings: blockedSettings });

  // Notify background script to update blocking rules
  chrome.runtime.sendMessage({
    type: 'UPDATE_BLOCKED_SITES',
    settings: blockedSettings
  }).catch(() => {});

  console.log(`${isBlocked ? 'Blocked' : 'Unblocked'} ${siteUrl}`);
}

async function loadCustomBlockedSites() {
  const container = document.getElementById('custom-sites-container');
  if (!container) return;

  const result = await chrome.storage.local.get(['custom_blocked_sites']);
  const customSites = result.custom_blocked_sites || [];

  container.innerHTML = '';

  if (customSites.length === 0) {
    container.innerHTML = '<p style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 20px;">No custom sites added yet</p>';
    return;
  }

  customSites.forEach((site, index) => {
    const siteItem = document.createElement('div');
    siteItem.className = 'blocked-site-item';
    siteItem.innerHTML = `
      <div class="blocked-site-info">
        <span class="site-icon">🚫</span>
        <div>
          <div class="site-name">${site.name || site.url}</div>
          <div class="site-url">${site.url}</div>
        </div>
      </div>
      <label class="site-toggle">
        <input type="checkbox" ${site.enabled !== false ? 'checked' : ''} data-custom-index="${index}">
        <span class="site-toggle-slider"></span>
      </label>
      <button class="custom-site-remove" data-custom-index="${index}">×</button>
    `;

    // Add toggle listener
    const toggle = siteItem.querySelector('input[type="checkbox"]');
    toggle.addEventListener('change', async (e) => {
      await toggleCustomSite(index, e.target.checked);
    });

    // Add remove listener
    const removeBtn = siteItem.querySelector('.custom-site-remove');
    removeBtn.addEventListener('click', async () => {
      await removeCustomSite(index);
    });

    container.appendChild(siteItem);
  });
}

async function toggleCustomSite(index, isEnabled) {
  const result = await chrome.storage.local.get(['custom_blocked_sites']);
  const customSites = result.custom_blocked_sites || [];

  if (customSites[index]) {
    customSites[index].enabled = isEnabled;
    await chrome.storage.local.set({ custom_blocked_sites: customSites });

    // Notify background script
    chrome.runtime.sendMessage({
      type: 'UPDATE_CUSTOM_SITES',
      sites: customSites
    }).catch(() => {});

    console.log(`${isEnabled ? 'Enabled' : 'Disabled'} custom site: ${customSites[index].url}`);
  }
}

async function removeCustomSite(index) {
  const result = await chrome.storage.local.get(['custom_blocked_sites']);
  let customSites = result.custom_blocked_sites || [];

  customSites.splice(index, 1);

  await chrome.storage.local.set({ custom_blocked_sites: customSites });

  // Reload the display
  await loadCustomBlockedSites();

  // Notify background script
  chrome.runtime.sendMessage({
    type: 'UPDATE_CUSTOM_SITES',
    sites: customSites
  }).catch(() => {});

  console.log('Removed custom site at index', index);
}

async function addCustomSite(url) {
  // Clean up URL
  url = url.trim().toLowerCase();
  if (!url) return;

  // Remove protocol if present
  url = url.replace(/^https?:\/\//, '');
  url = url.replace(/^www\./, '');

  // Remove trailing slash
  url = url.replace(/\/$/, '');

  if (!url) return;

  // Add wildcard pattern
  const pattern = `*.${url}/*`;

  const result = await chrome.storage.local.get(['custom_blocked_sites']);
  const customSites = result.custom_blocked_sites || [];

  // Check if already exists
  if (customSites.some(site => site.url === url)) {
    showToast('this site is already in your custom list');
    return;
  }

  customSites.push({
    name: url,
    url: url,
    pattern: pattern,
    enabled: true
  });

  await chrome.storage.local.set({ custom_blocked_sites: customSites });

  // Reload the display
  await loadCustomBlockedSites();

  // Notify background script
  chrome.runtime.sendMessage({
    type: 'UPDATE_CUSTOM_SITES',
    sites: customSites
  }).catch(() => {});

  console.log('Added custom site:', url);
    showToast(`added ${url} to blocked sites`);
}

async function clearAllCustomSites() {
  await chrome.storage.local.set({ custom_blocked_sites: [] });
  await loadCustomBlockedSites();

  // Notify background script
  chrome.runtime.sendMessage({
    type: 'UPDATE_CUSTOM_SITES',
    sites: []
  }).catch(() => {});

  console.log('Cleared all custom sites');
  showToast('all custom sites cleared');
}

function setupFocusCustomizationListeners() {
  // Add custom site button
  const addBtn = document.getElementById('add-custom-site-btn');
  const input = document.getElementById('custom-site-input');

  if (addBtn && input) {
    addBtn.addEventListener('click', async () => {
      // Check Pro status
      const isPro = await checkProStatus();
      if (!isPro) {
        // Show Pro overlay (it's already visible in HTML)
        return;
      }

      const url = input.value.trim();
      if (url) {
        await addCustomSite(url);
        input.value = '';
      }
    });

    // Also allow Enter key
    input.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const isPro = await checkProStatus();
        if (!isPro) return;

        const url = input.value.trim();
        if (url) {
          await addCustomSite(url);
          input.value = '';
        }
      }
    });
  }

  // Clear all button
  const clearBtn = document.getElementById('clear-custom-sites-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const isPro = await checkProStatus();
      if (!isPro) return;

      if (confirm('Are you sure you want to remove all custom sites?')) {
        await clearAllCustomSites();
      }
    });
  }

  // Upgrade buttons
  const upgradeBtn = document.getElementById('upgrade-custom-sites-btn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', async () => {
      await initiateCheckout();
    });
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message.toLowerCase();
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(20px);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    z-index: 10001;
    animation: slideUp 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2000);
}

// Call initialization when settings view is shown
const originalToggleSettings = toggleSettings;
toggleSettings = function() {
  originalToggleSettings();

  // If we're now showing settings, initialize focus customization
  if (currentView === 'settings') {
    initializeFocusCustomization();
  }
};

// ============================================
// Feature Showcase Dismiss
// ============================================

async function setupShowcaseDismiss() {
  // Check if user has dismissed the showcase
  const result = await chrome.storage.local.get(['showcase_dismissed']);
  const isDismissed = result.showcase_dismissed || false;

  const showcase = document.getElementById('feature-showcase');
  const dismissBtn = document.getElementById('dismiss-showcase');

  if (!showcase) return;

  // Hide if already dismissed
  if (isDismissed) {
    showcase.style.display = 'none';
  }

  // Setup dismiss button
  if (dismissBtn) {
    dismissBtn.addEventListener('click', async () => {
      // Fade out animation
      showcase.style.opacity = '0';
      showcase.style.transform = 'translateY(-10px)';

      setTimeout(async () => {
        showcase.style.display = 'none';

        // Save dismissed state
        await chrome.storage.local.set({ showcase_dismissed: true });
      }, 200);
    });
  }
}

async function initializeXPSystem() {
    if (!currentUser) {
      console.log('No user logged in, skipping XP initialization');
      return;
    }
    await fetchMikeXP();
  }

async function fetchMikeXP() {
  try {
    const response = await fetch('APP_URL_PLACEHOLDER/api/user/mike-xp', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
  if (response.ok) {
    const data = await response.json();
    updateXPDisplay(data.xp,data.level, data.xpForNextLevel);
      }
    } 
    catch (error) {
      console.error('Error fetching Mike XP:', error);
    }
  }

function updateXPDisplay(currentXP, level, xpForNextLevel) {
  const levelEl = document.getElementById('mike-level');
  const xpProgressEl = document.getElementById('xp-progress');
    if (levelEl) {
      levelEl.textContent = `Level ${level}`;
    }
    if (xpProgressEl) {
      const progress = (currentXP / xpForNextLevel) * 100;
      xpProgressEl.style.width = `${progress}%`;
    }
  }

  async function awardXP(amount, source) {
  if (!currentUser) {console.log('No user logged in, skipping XP award');
    return;
    }
    try {
      const response = await fetch('APP_URL_PLACEHOLDER/api/user/mike-xp/award', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({ xp: amount, source })
      });

    if (response.ok) { 
      const data = await response.json();
      updateXPDisplay(data.xp, data.level, data.xpForNext);
    
      if (data.leveledUp) {
        showNotification(`🎉 Level Up! You're now Level ${data.level}!`);
        }
        return data;
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }

// ============================================
// Demo and Upgrade Button Handlers
// ============================================

async function setupDemoDismiss() {
  const result = await chrome.storage.local.get(['demo_dismissed']);
  const isDismissed = result.demo_dismissed || false;

  const demo = document.getElementById('highlight-demo');
  const dismissBtn = document.getElementById('dismiss-demo');
  const demoToggleBtn = document.getElementById('demo-toggle');

  if (!demo) return;

  if (isDismissed) {
    demo.style.display = 'none';
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', async () => {
      demo.style.opacity = '0';
      demo.style.transform = 'translateY(-10px)';

      setTimeout(async () => {
        demo.style.display = 'none';
        // Clear inline styles
        demo.style.removeProperty('opacity');
        demo.style.removeProperty('transform');
        await chrome.storage.local.set({ demo_dismissed: true });
      }, 200);
    });
  }

  // Demo toggle button - show demo again
  if (demoToggleBtn) {
    demoToggleBtn.addEventListener('click', async () => {
      if (demo.style.display === 'none' || !demo.style.display) {
        // Show demo - remove display none, let CSS handle the rest
        demo.style.removeProperty('display');
        demo.style.removeProperty('opacity');
        demo.style.removeProperty('transform');

        await chrome.storage.local.set({ demo_dismissed: false });
      } else {
        // Hide demo with animation
        demo.style.opacity = '0';
        demo.style.transform = 'translateY(-10px)';

        setTimeout(async () => {
          demo.style.display = 'none';
          await chrome.storage.local.set({ demo_dismissed: true });
        }, 200);
      }
    });
  }
}

function setupUpgradeButtons() {
  // Pomodoro upgrade button
  document.getElementById('upgrade-pomodoro-btn')?.addEventListener('click', async () => {
    await initiateCheckout();
  });

  // Custom sites upgrade button
  document.getElementById('upgrade-sites-btn')?.addEventListener('click', async () => {
    await initiateCheckout();
  });
}

// ============================================
// Random Pro Feature Popups
// ============================================

let proPopupInterval = null;

async function startRandomProPopups() {
  // Check if user is Pro
  if (typeof isProUser !== 'undefined' && isProUser) {
    return; // Don't show popups to Pro users
  }

  // Show popup every 3-5 minutes randomly
  const showPopup = () => {
    const randomDelay = Math.random() * (5 * 60 * 1000 - 3 * 60 * 1000) + 3 * 60 * 1000;

    setTimeout(() => {
      showRandomProPopup();
      showPopup(); // Schedule next popup
    }, randomDelay);
  };

  showPopup();
}

function showRandomProPopup() {
  const popups = [
    {
      icon: '🎯',
      title: 'Block Custom Websites?',
      description: 'Choose exactly which sites distract you',
      feature: 'Custom Site Blocking'
    },
    {
      icon: '∞',
      title: 'Unlimited AI Tasks?',
      description: 'Turn any text into tasks with no daily limit',
      feature: 'Unlimited AI'
    }
  ];

  const randomPopup = popups[Math.floor(Math.random() * popups.length)];

  // Create popup
  const popup = document.createElement('div');
  popup.className = 'pro-popup-toast';
  popup.innerHTML = `
    <div class="pro-popup-content">
      <div class="pro-popup-icon">${randomPopup.icon}</div>
      <div class="pro-popup-text">
        <h4>${randomPopup.title}</h4>
        <p>${randomPopup.description}</p>
      </div>
      <div class="pro-popup-actions">
        <button class="pro-popup-upgrade">Upgrade to Pro</button>
        <button class="pro-popup-dismiss">×</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // Animate in
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);

  // Setup buttons
  popup.querySelector('.pro-popup-upgrade').addEventListener('click', async () => {
    await initiateCheckout();
    removePopup(popup);
  });

  popup.querySelector('.pro-popup-dismiss').addEventListener('click', () => {
    removePopup(popup);
  });

  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    removePopup(popup);
  }, 8000);
}

function removePopup(popup) {
  popup.classList.remove('show');
  popup.classList.add('hide');
  setTimeout(() => {
    if (popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
  }, 300);
}