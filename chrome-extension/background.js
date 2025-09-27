// Teyra Chrome Extension - Background Service Worker

console.log('Teyra background script starting...');

// Extension lifecycle
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Teyra extension installed:', details);

  // Set default settings
  chrome.storage.sync.set({
    productivityMode: true,
    dailyGoal: 7
  });

  console.log('Teyra extension ready!');
});

// Listen for messages from content scripts
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
});

console.log('Teyra background script loaded successfully');