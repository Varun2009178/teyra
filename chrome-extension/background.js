// Teyra Chrome Extension - Background Service Worker

console.log('Teyra background script starting...');

// Statistics tracking
let websiteStats = {
  social: { blocked: 0, total: 0 },
  entertainment: { blocked: 0, total: 0 },
  shopping: { blocked: 0, total: 0 },
  news: { blocked: 0, total: 0 }
};

// Focus session tracking
let focusSession = {
  startTime: null,
  isActive: false,
  totalTime: 0
};

// Pomodoro session tracking
let pomodoroSession = {
  isActive: false,
  startTime: null,
  distractionDetected: false
};

// Extension lifecycle
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Teyra extension installed:', details);

  // Set default settings
  chrome.storage.local.set({
    productivityMode: true,
    dailyGoal: 7,
    focus_mode_active: false,
    website_stats: websiteStats,
    focus_session: focusSession
  });

  // Create context menu
  createContextMenu();

  console.log('Teyra extension ready!');
});

// Create context menu for "Add to Teyra"
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'add-to-teyra',
      title: 'Add to Teyra',
      contexts: ['selection', 'page'],
      documentUrlPatterns: ['<all_urls>']
    });
  });
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'userSignedIn' && request.user) {
    console.log('User signed in:', request.user);
    console.log('Tasks received:', request.tasks);

    // Store user data and tasks
    chrome.storage.local.set({
      teyra_user: request.user,
      teyra_tasks: request.tasks || []
    });

    console.log('User data and tasks stored for extension');
  }

  if (request.action === 'productivityModeChanged') {
    console.log('Productivity mode changed:', request.enabled);
  }

  // Handle website detection from content script
  if (request.type === 'WEBSITE_DETECTED') {
    handleWebsiteDetection(request, sender);
    sendResponse({ success: true });
  }

  // Handle focus mode toggle
  if (request.type === 'TOGGLE_FOCUS_MODE') {
    toggleFocusMode(request.enabled);
    sendResponse({ success: true });
  }

  // Handle focus session updates
  if (request.type === 'GET_FOCUS_TIME') {
    const currentTime = getFocusTime();
    sendResponse({ focusTime: currentTime });
  }

  // Handle focus session reset
  if (request.type === 'RESET_FOCUS_SESSION') {
    resetFocusSession();
    sendResponse({ success: true });
  }

  // Handle open extension popup and close tab
  if (request.type === 'OPEN_EXTENSION_AND_CLOSE_TAB') {
    handleOpenExtensionAndCloseTab(sender.tab.id, request.taskId);
    sendResponse({ success: true });
  }

  // Handle task completion
  if (request.type === 'COMPLETE_TASK') {
    handleCompleteTask(request.taskId);
    sendResponse({ success: true });
  }

  // Handle quick add task
  if (request.type === 'QUICK_ADD_TASK') {
    handleQuickAddTask(request.text, request.url, request.title);
    sendResponse({ success: true });
  }

  // Handle Pomodoro session start
  if (request.type === 'POMODORO_SESSION_STARTED') {
    pomodoroSession.isActive = true;
    pomodoroSession.startTime = Date.now();
    pomodoroSession.distractionDetected = false;
    console.log('🍅 Pomodoro session started - tracking distractions');
    sendResponse({ success: true });
  }

  // Handle Pomodoro session end
  if (request.type === 'POMODORO_SESSION_ENDED') {
    pomodoroSession.isActive = false;
    pomodoroSession.startTime = null;
    console.log('🍅 Pomodoro session ended');
    sendResponse({ success: true });
  }

  // Handle blocking rules update
  if (request.type === 'UPDATE_BLOCKING_RULES') {
    chrome.storage.local.get(['focus_mode_active'], async (result) => {
      if (result.focus_mode_active) {
        await applyBlockingRules();
      }
    });
    sendResponse({ success: true });
  }

  // Handle Google Calendar event creation
  if (request.type === 'CREATE_CALENDAR_EVENT') {
    createCalendarEvent(request.taskTitle, request.dateTime)
      .then(result => sendResponse({ success: true, event: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  // Handle Google Calendar authentication
  if (request.type === 'GET_CALENDAR_AUTH') {
    authenticateGoogle()
      .then(token => sendResponse({ success: true, token }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Only return true for messages that need async responses
  return request.type === 'GET_FOCUS_TIME' || request.type === 'RESET_FOCUS_SESSION' || request.type === 'TOGGLE_FOCUS_MODE' || request.type === 'WEBSITE_DETECTED' || request.type === 'OPEN_EXTENSION_AND_CLOSE_TAB' || request.type === 'COMPLETE_TASK' || request.type === 'QUICK_ADD_TASK';
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === 'add-to-teyra') {
    const text = info.selectionText || info.pageUrl || 'New task';
    const url = tab.url;
    const title = tab.title;
    
    handleQuickAddTask(text, url, title);
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(function(command) {
  if (command === 'add-task') {
    // Get the active tab and selected text
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const tab = tabs[0];

        // Check if URL is injectable
        if (!isInjectableUrl(tab.url)) {
          console.log('Cannot inject on this page:', tab.url);
          showNotification('Teyra is not available on this page', 'Try on a regular webpage');
          return;
        }

        // Send message to content script to get selected text
        chrome.tabs.sendMessage(tab.id, {action: 'getSelectedText'}, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Content script not ready, injecting...', chrome.runtime.lastError.message);
            // Inject content script if not loaded
            chrome.scripting.executeScript({
              target: { tabId: tab.id, allFrames: true },
              files: ['content.js']
            }).then(() => {
              // Try again after injection
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, {action: 'getSelectedText'}, function(response) {
                  if (response && response.text) {
                    handleQuickAddTask(response.text, tab.url, tab.title);
                  } else {
                    chrome.tabs.sendMessage(tab.id, {action: 'openQuickAddModal'});
                  }
                });
              }, 200);
            }).catch((error) => {
              console.error('Failed to inject content script:', error);
              showNotification('Teyra Extension Error', 'Could not activate on this page');
            });
            return;
          }

          if (response && response.text) {
            handleQuickAddTask(response.text, tab.url, tab.title);
          } else {
            // If no text selected, open quick add modal
            chrome.tabs.sendMessage(tab.id, {action: 'openQuickAddModal'});
          }
        });
      }
    });
  } else if (command === 'highlight-mode') {
    // Toggle highlight mode
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const tab = tabs[0];

        // Check if URL is injectable
        if (!isInjectableUrl(tab.url)) {
          console.log('Cannot inject on this page:', tab.url);
          showNotification('Teyra is not available on this page', 'Try on a regular webpage');
          return;
        }

        chrome.tabs.sendMessage(tab.id, {action: 'toggleHighlightMode'}, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Content script not ready for highlight mode, injecting...', chrome.runtime.lastError.message);
            // Inject content script if not loaded
            chrome.scripting.executeScript({
              target: { tabId: tab.id, allFrames: true },
              files: ['content.js']
            }).then(() => {
              // Try again after injection
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, {action: 'toggleHighlightMode'});
              }, 200);
            }).catch((error) => {
              console.error('Failed to inject content script:', error);
              showNotification('Teyra Extension Error', 'Could not activate on this page');
            });
          }
        });
      }
    });
  } else if (command === 'quick-add-task') {
    // Quick add task modal
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const tab = tabs[0];

        // Check if URL is injectable
        if (!isInjectableUrl(tab.url)) {
          console.log('Cannot inject on this page:', tab.url);
          showNotification('Teyra is not available on this page', 'Try on a regular webpage');
          return;
        }

        chrome.tabs.sendMessage(tab.id, {action: 'openQuickAddModal'}, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Content script not ready for quick add, injecting...', chrome.runtime.lastError.message);
            // Inject content script if not loaded
            chrome.scripting.executeScript({
              target: { tabId: tab.id, allFrames: true },
              files: ['content.js']
            }).then(() => {
              // Try again after injection
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, {action: 'openQuickAddModal'});
              }, 200);
            }).catch((error) => {
              console.error('Failed to inject content script:', error);
              showNotification('Teyra Extension Error', 'Could not activate on this page');
            });
          }
        });
      }
    });
  }
});

// Check if URL can have content scripts injected
function isInjectableUrl(url) {
  if (!url) return false;

  // Chrome internal pages
  if (url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('edge://') ||
      url.startsWith('about:')) {
    return false;
  }

  // Chrome Web Store
  if (url.includes('chrome.google.com/webstore')) {
    return false;
  }

  return true;
}

// Show notification to user
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'teyra-logo-64kb.png',
    title: title,
    message: message,
    priority: 1
  });
}

// Handle website detection and statistics
function handleWebsiteDetection(request, sender) {
  const { category, hostname, url, title } = request;

  // Update statistics
  if (websiteStats[category]) {
    websiteStats[category].total++;

    // Check if focus mode is active
    chrome.storage.local.get(['focus_mode_active'], (result) => {
      if (result.focus_mode_active) {
        websiteStats[category].blocked++;

        // If Pomodoro session is active, mark as distraction detected
        if (pomodoroSession.isActive && !pomodoroSession.distractionDetected) {
          pomodoroSession.distractionDetected = true;
          console.log('⚠️ Distraction detected during Pomodoro session:', hostname);

          // Notify popup about distraction
          chrome.runtime.sendMessage({
            type: 'DISTRACTION_DETECTED',
            category: category,
            hostname: hostname
          }).catch(() => {
            // Popup might not be open, that's okay
          });
        }
      }

      // Update stored stats
      chrome.storage.local.set({ website_stats: websiteStats });
    });
  }

  console.log(`Website detected: ${hostname} (${category})`);
}

// Toggle focus mode
async function toggleFocusMode(enabled) {
  console.log('Focus mode toggled:', enabled);

  if (enabled) {
    // Start fresh focus session
    focusSession.startTime = Date.now();
    focusSession.isActive = true;
    focusSession.totalTime = 0; // Start fresh each time

    // Apply website blocking
    await applyBlockingRules();
  } else {
    // End focus session but don't accumulate time
    focusSession.isActive = false;
    focusSession.startTime = null;
    // Don't accumulate totalTime - each session starts fresh

    // Remove website blocking
    await removeBlockingRules();
  }

  // Update storage
  chrome.storage.local.set({
    focus_mode_active: enabled,
    focus_session: focusSession
  });
}

// Default blocked sites
const DEFAULT_BLOCKED_SITES = [
  { name: 'YouTube', url: 'youtube.com', id: 1 },
  { name: 'Twitter/X', url: 'twitter.com', id: 2 },
  { name: 'Twitter/X', url: 'x.com', id: 3 },
  { name: 'LinkedIn', url: 'linkedin.com', id: 4 },
  { name: 'Instagram', url: 'instagram.com', id: 5 },
  { name: 'TikTok', url: 'tiktok.com', id: 6 }
];

// Apply blocking rules based on user settings
async function applyBlockingRules() {
  try {
    console.log('📋 Applying website blocking rules...');

    // Get user settings
    const result = await chrome.storage.local.get(['blocked_sites_settings', 'custom_blocked_sites']);
    const blockedSettings = result.blocked_sites_settings || {};
    const customSites = result.custom_blocked_sites || [];

    console.log('🔍 Blocked settings:', blockedSettings);
    console.log('🔍 Custom sites:', customSites);

    const rules = [];
    let ruleId = 1;

    // Add default sites (only if explicitly enabled)
    for (const site of DEFAULT_BLOCKED_SITES) {
      // FIXED: Only block if explicitly set to true, not by default
      const isEnabled = blockedSettings[site.url] === true;

      console.log(`📌 ${site.url}: isEnabled = ${isEnabled} (stored value: ${blockedSettings[site.url]})`);

      if (isEnabled) {
        rules.push({
          id: ruleId++,
          priority: 1,
          action: { type: 'redirect', redirect: { url: 'https://teyra.app/dashboard?blocked=true' } },
          condition: {
            urlFilter: `*://*.${site.url}/*`,
            resourceTypes: ['main_frame']
          }
        });
        console.log(`  ✅ Added blocking rule for ${site.url}`);
      } else {
        console.log(`  ⏭️  Skipping ${site.url} (not enabled)`);
      }
    }

    // Add custom sites (only if explicitly enabled)
    for (const site of customSites) {
      const isEnabled = site.enabled === true;

      console.log(`📌 Custom: ${site.url}: isEnabled = ${isEnabled} (stored value: ${site.enabled})`);

      if (isEnabled) {
        rules.push({
          id: ruleId++,
          priority: 1,
          action: { type: 'redirect', redirect: { url: 'https://teyra.app/dashboard?blocked=true' } },
          condition: {
            urlFilter: `*://*.${site.url}/*`,
            resourceTypes: ['main_frame']
          }
        });
        console.log(`  ✅ Added blocking rule for custom site ${site.url}`);
      } else {
        console.log(`  ⏭️  Skipping custom site ${site.url} (not enabled)`);
      }
    }

    // Remove all existing rules first
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    if (existingRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds
      });
    }

    // Add new rules
    if (rules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules
      });
      console.log(`✅ Applied ${rules.length} blocking rules`);
    } else {
      console.log('ℹ️ No blocking rules to apply');
    }

  } catch (error) {
    console.error('❌ Error applying blocking rules:', error);
  }
}

// Remove all blocking rules
async function removeBlockingRules() {
  try {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = rules.map(rule => rule.id);

    if (ruleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
      });
      console.log('✅ Removed all blocking rules');
    }
  } catch (error) {
    console.error('❌ Error removing blocking rules:', error);
  }
}

// Get current focus time
function getFocusTime() {
  if (!focusSession.isActive || !focusSession.startTime) {
    return 0; // Always return 0 when not active
  }

  const currentSessionTime = Date.now() - focusSession.startTime;
  return currentSessionTime; // Only return current session time, not accumulated
}

// Reset focus session completely
function resetFocusSession() {
  console.log('Resetting focus session');
  focusSession = {
    startTime: null,
    isActive: false,
    totalTime: 0
  };

  // Update storage
  chrome.storage.local.set({
    focus_session: focusSession
  });
}

// Update focus time every second for active sessions
setInterval(() => {
  if (focusSession.isActive) {
    // Notify popup to update display
    chrome.runtime.sendMessage({
      type: 'FOCUS_TIME_UPDATE',
      focusTime: getFocusTime()
    }).catch(() => {
      // Popup might not be open, ignore error
    });
  }
}, 1000);

// Handle task completion
async function handleCompleteTask(taskId) {
  try {
    console.log('Completing task:', taskId);

    // Get current tasks from storage
    const result = await chrome.storage.local.get(['teyra_tasks']);
    let tasks = result.teyra_tasks || [];

    // Find and update the task
    const taskIndex = tasks.findIndex(t => t.id === parseInt(taskId));
    if (taskIndex !== -1) {
      tasks[taskIndex].completed = true;

      // Update local storage immediately
      await chrome.storage.local.set({ teyra_tasks: tasks });
      console.log('Task marked as completed in local storage');

      // Try to sync with API in background
      try {
        const response = await fetch(`https://teyra.app/api/tasks/${taskId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ completed: true })
        });

        if (response.ok) {
          console.log('Task synced with API successfully');
        } else {
          console.log('API sync failed, but local update succeeded');
        }
      } catch (apiError) {
        console.log('API sync failed, but local update succeeded:', apiError.message);
      }
    }
  } catch (error) {
    console.log('Error completing task:', error);
  }
}

// Handle opening extension popup and going back
async function handleOpenExtensionAndCloseTab(tabId, taskId) {
  try {
    console.log('Opening extension popup and going back:', tabId);

    // Navigate back to a productive page (Chrome new tab or previous page)
    try {
      await chrome.tabs.update(tabId, { url: 'chrome://newtab/' });
      console.log('Navigated to new tab page');
    } catch (error) {
      console.log('Could not navigate to new tab, trying history back:', error);
      // If we can't go to new tab, try to go back in history
      await chrome.tabs.executeScript(tabId, {
        code: 'if (window.history.length > 1) { window.history.back(); } else { window.location.href = "https://teyra.app/dashboard"; }'
      });
    }

    // Try to open the extension popup
    // Note: We can't programmatically open the popup, but we can try
    try {
      await chrome.action.openPopup();
      console.log('Opened extension popup');
    } catch (error) {
      console.log('Could not open popup programmatically:', error);
      // Popup opening might not work in all contexts, that's okay
    }

  } catch (error) {
    console.log('Error handling open extension and go back:', error);
  }
}

// Handle quick add task functionality
async function handleQuickAddTask(text, url, title) {
  try {
    console.log('Quick adding task:', text);
    
    // Check if user is logged in
    const result = await chrome.storage.local.get(['teyra_user']);
    if (!result.teyra_user) {
      // User not logged in, show sign-in prompt
      showSignInNotification();
      return;
    }

    // Create task object
    const task = {
      id: Date.now(), // Temporary ID
      title: text,
      completed: false,
      created_at: new Date().toISOString(),
      source: {
        url: url,
        pageTitle: title,
        addedVia: 'extension'
      }
    };

    // Get current tasks and add new one
    const tasksResult = await chrome.storage.local.get(['teyra_tasks']);
    let tasks = tasksResult.teyra_tasks || [];
    tasks.push(task);

    // Update local storage immediately
    await chrome.storage.local.set({ teyra_tasks: tasks });

    // Show success notification
    showTaskAddedNotification(text);

    // Try to sync with API in background
    try {
      const response = await fetch('https://teyra.app/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title: text,
          source: task.source
        })
      });

      if (response.ok) {
        const newTask = await response.json();
        console.log('Task synced with API:', newTask);
        
        // Replace temp task with real task
        const tempIndex = tasks.findIndex(t => t.id === task.id);
        if (tempIndex !== -1) {
          tasks[tempIndex] = newTask;
          await chrome.storage.local.set({ teyra_tasks: tasks });
        }
      } else {
        console.log('API sync failed, but local task persisted');
      }
    } catch (apiError) {
      console.log('API sync failed, but local task persisted:', apiError.message);
    }

  } catch (error) {
    console.error('Error adding task:', error);
    showErrorNotification('Failed to add task');
  }
}

// Show sign-in notification
function showSignInNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'teyra-logo-64kb.png',
    title: 'Teyra - Sign In Required',
    message: 'Please sign in to Teyra to add tasks from anywhere!',
    buttons: [
      { title: 'Sign In' }
    ]
  });
}

// Show task added notification
function showTaskAddedNotification(taskText) {
  const truncatedText = taskText.length > 50 ? taskText.substring(0, 50) + '...' : taskText;
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'teyra-logo-64kb.png',
    title: 'Task Added to Teyra!',
    message: `"${truncatedText}" added to your tasks`,
    buttons: [
      { title: 'View Tasks' }
    ]
  });
}

// Show error notification
function showErrorNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'teyra-logo-64kb.png',
    title: 'Teyra Error',
    message: message
  });
}

// Handle notification clicks
chrome.notifications.onClicked.addListener(function(notificationId) {
  if (notificationId.includes('Sign In Required')) {
    chrome.tabs.create({ url: 'https://teyra.app/sign-in?extension=true' });
  } else if (notificationId.includes('Task Added')) {
    chrome.tabs.create({ url: 'https://teyra.app/dashboard' });
  }
});

// Load saved data on startup
chrome.storage.local.get(['website_stats', 'focus_session', 'focus_mode_active'], async (result) => {
  if (result.website_stats) {
    websiteStats = result.website_stats;
  }
  if (result.focus_session) {
    focusSession = result.focus_session;
    // Don't resume active sessions after restart
    focusSession.isActive = false;
    focusSession.startTime = null;
  }

  // Clean up any leftover blocking rules on startup
  if (!result.focus_mode_active) {
    console.log('🧹 Cleaning up any leftover blocking rules...');
    await removeBlockingRules();
  }
});

// Google Calendar integration
let googleAuthToken = null;

// Log redirect URI for debugging
const redirectUri = chrome.identity.getRedirectURL();
console.log('========================================');
console.log('CHROME EXTENSION REDIRECT URI:');
console.log(redirectUri);
console.log('Add this EXACT URL to your Google Cloud Console OAuth client redirect URIs');
console.log('========================================');

async function authenticateGoogle() {
  const clientId = '492936812701-2rskrog5uemo7rvvki0jboqk37267bpc.apps.googleusercontent.com';
  const scopes = 'https://www.googleapis.com/auth/calendar.events';

  const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
    `client_id=${clientId}&` +
    `response_type=token&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}`;

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true
      },
      function(redirectUrl) {
        if (chrome.runtime.lastError) {
          console.error('Auth error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        // Extract access token from URL
        const urlParams = new URL(redirectUrl);
        const hashParams = new URLSearchParams(urlParams.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          googleAuthToken = accessToken;
          console.log('Successfully authenticated with Google Calendar');
          resolve(accessToken);
        } else {
          reject(new Error('Failed to get access token'));
        }
      }
    );
  });
}

async function createCalendarEvent(taskTitle, dateTime) {
  if (!googleAuthToken) {
    await authenticateGoogle();
  }

  const { date, time } = dateTime;

  // Set default time if not specified (9 AM)
  const eventTime = time || { hours: 9, minutes: 0 };

  const startDateTime = new Date(date);
  startDateTime.setHours(eventTime.hours, eventTime.minutes, 0, 0);

  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(startDateTime.getHours() + 1); // 1 hour duration

  const event = {
    summary: taskTitle,
    description: `Created by Teyra`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 15 }
      ]
    }
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAuthToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Calendar event created:', result);
    return result;
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    throw error;
  }
}

console.log('Teyra background script loaded successfully');