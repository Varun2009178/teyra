// Teyra Chrome Extension - Content Script
// Runs on all websites to provide context and gentle productivity nudges

console.log('Teyra content script loading...');

(function() {
  'use strict';

  let productivityMode = true;
  let currentDomain = window.location.hostname;
  let pageStartTime = Date.now();
  let isUserActive = true;
  let inactivityTimer = null;

  // Initialize content script
  init();

  function init() {
    console.log('Teyra content script loaded on:', currentDomain);

    // Get productivity mode setting
    chrome.storage.sync.get(['productivityMode'], function(result) {
      productivityMode = result.productivityMode !== false;

      if (productivityMode) {
        startProductivityMonitoring();
      }
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener(function(changes) {
      if (changes.productivityMode) {
        productivityMode = changes.productivityMode.newValue;

        if (productivityMode) {
          startProductivityMonitoring();
        } else {
          stopProductivityMonitoring();
        }
      }
    });

    // Track user activity
    setupActivityTracking();
  }

  function startProductivityMonitoring() {
    // Check if this is a potentially distracting site
    if (isDistractingSite(currentDomain)) {
      scheduleProductivityCheck();
    }

    // Add subtle visual indicator (optional)
    addProductivityIndicator();
  }

  function stopProductivityMonitoring() {
    clearTimeout(window.teyraProductivityTimer);
    removeProductivityIndicator();
  }

  function isDistractingSite(domain) {
    const distractingSites = [
      'youtube.com',
      'tiktok.com',
      'twitter.com',
      'instagram.com',
      'facebook.com',
      'reddit.com',
      'twitch.tv',
      'netflix.com'
    ];

    return distractingSites.some(site => domain.includes(site));
  }

  function scheduleProductivityCheck() {
    // Clear any existing timer
    clearTimeout(window.teyraProductivityTimer);

    // Schedule check after 10 minutes on distracting sites
    window.teyraProductivityTimer = setTimeout(() => {
      if (isUserActive && productivityMode) {
        showGentleNudge();
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  function showGentleNudge() {
    // Create a non-intrusive overlay
    const nudge = createNudgeElement();
    document.body.appendChild(nudge);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (nudge.parentNode) {
        nudge.remove();
      }
    }, 10000);
  }

  function createNudgeElement() {
    const nudge = document.createElement('div');
    nudge.id = 'teyra-nudge';
    nudge.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideInFromRight 0.3s ease;
      ">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span style="font-size: 18px;">🌵</span>
          <span style="font-weight: 600;">teyra</span>
          <button id="teyra-close" style="
            margin-left: auto;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            width: 20px;
            height: 20px;
          ">×</button>
        </div>
        <div style="color: rgba(255, 255, 255, 0.8); margin-bottom: 12px;">
          Taking a break? Ready to tackle your next task?
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="teyra-view-tasks" style="
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.3);
            color: #22c55e;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
          ">View Tasks</button>
          <button id="teyra-later" style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.7);
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
          ">Later</button>
        </div>
      </div>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInFromRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    // Add event listeners
    nudge.querySelector('#teyra-close').addEventListener('click', () => {
      nudge.remove();
    });

    nudge.querySelector('#teyra-view-tasks').addEventListener('click', () => {
      // Open Teyra dashboard or extension popup
      window.open('https://teyra.app/dashboard', '_blank');
      nudge.remove();
    });

    nudge.querySelector('#teyra-later').addEventListener('click', () => {
      nudge.remove();
      // Schedule another check in 30 minutes
      window.teyraProductivityTimer = setTimeout(() => {
        if (isUserActive && productivityMode) {
          showGentleNudge();
        }
      }, 30 * 60 * 1000);
    });

    return nudge;
  }

  function addProductivityIndicator() {
    // Add a very subtle indicator that Teyra is active (optional)
    if (document.getElementById('teyra-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'teyra-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      z-index: 999998;
      opacity: 0.3;
      pointer-events: none;
    `;

    document.body.appendChild(indicator);
  }

  function removeProductivityIndicator() {
    const indicator = document.getElementById('teyra-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  function setupActivityTracking() {
    // Track user activity to avoid showing nudges when user is inactive
    let activityTimer;

    function resetActivityTimer() {
      isUserActive = true;
      clearTimeout(activityTimer);

      activityTimer = setTimeout(() => {
        isUserActive = false;
      }, 5 * 60 * 1000); // 5 minutes of inactivity
    }

    // Listen for user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetActivityTimer, true);
    });

    // Initialize
    resetActivityTimer();
  }

  // Page visibility changes
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      pageStartTime = Date.now();
      if (productivityMode && isDistractingSite(currentDomain)) {
        scheduleProductivityCheck();
      }
    } else {
      clearTimeout(window.teyraProductivityTimer);
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', function() {
    clearTimeout(window.teyraProductivityTimer);
  });

})();