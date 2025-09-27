// Teyra Chrome Extension - Persistent UI Overlay

(function() {
  'use strict';

  let teyraUI = null;
  let isUIVisible = false;
  let productivityMode = true;
  let currentDomain = window.location.hostname;

  // Initialize the UI
  console.log('Teyra UI script loaded on:', window.location.hostname);
  init();

  function init() {
    console.log('Teyra UI initializing...');
    // Get initial settings
    chrome.storage.sync.get(['productivityMode', 'uiVisible'], function(result) {
      productivityMode = result.productivityMode !== false;
      isUIVisible = result.uiVisible !== false;

      createUI();
      if (isUIVisible) {
        showUI();
      }
    });

    // Listen for extension icon clicks
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      console.log('Teyra UI received message:', request);
      if (request.action === 'toggleTeyraUI') {
        console.log('Toggling Teyra UI...');
        toggleUI();
      }
    });
  }

  function createUI() {
    console.log('createUI called');
    if (teyraUI) {
      console.log('UI already exists, returning');
      return;
    }

    // Create main container
    teyraUI = document.createElement('div');
    teyraUI.id = 'teyra-ui-container';
    teyraUI.innerHTML = getUIHTML();

    console.log('UI HTML set, adding styles...');

    // Add styles
    addUIStyles();

    console.log('Styles added, appending to body...');

    // Add to page
    document.body.appendChild(teyraUI);

    console.log('UI appended to body');

    // Setup event listeners
    setupUIEventListeners();

    // Start with UI hidden
    teyraUI.style.display = 'none';
    console.log('UI created and hidden');
  }

  function getUIHTML() {
    return `
      <div class="teyra-widget">
        <!-- Header -->
        <div class="teyra-header">
          <div class="teyra-logo-section">
            <div class="teyra-logo">🌵</div>
            <span class="teyra-app-name">teyra</span>
          </div>
          <div class="teyra-actions">
            <button class="teyra-minimize-btn" id="teyra-minimize">−</button>
            <button class="teyra-close-btn" id="teyra-close">×</button>
          </div>
        </div>

        <!-- Mode Toggle -->
        <div class="teyra-mode-section">
          <div class="teyra-toggle-wrapper">
            <input type="checkbox" id="teyra-productivity-mode" class="teyra-toggle-input" ${productivityMode ? 'checked' : ''}>
            <label for="teyra-productivity-mode" class="teyra-toggle-label">
              <span class="teyra-toggle-slider"></span>
            </label>
            <span class="teyra-toggle-text">productive mode</span>
          </div>
        </div>

        <!-- Stats -->
        <div class="teyra-stats-card">
          <div class="teyra-stat-item">
            <span class="teyra-stat-emoji">📊</span>
            <span class="teyra-stat-text">today: <span id="teyra-task-progress">3/7</span> tasks done</span>
          </div>
          <div class="teyra-progress-bar">
            <div class="teyra-progress-fill" id="teyra-progress-fill"></div>
          </div>
        </div>

        <!-- Context (shown only when productive mode is on) -->
        <div class="teyra-context-card" id="teyra-context-card" style="${productivityMode ? '' : 'display: none;'}">
          <div class="teyra-context-header">
            <span class="teyra-context-emoji">🎯</span>
            <span class="teyra-context-title">current context</span>
          </div>
          <div class="teyra-context-content">
            <div class="teyra-current-site" id="teyra-current-site">browsing the web</div>
            <div class="teyra-ai-suggestion" id="teyra-ai-suggestion">suggested: check your task list!</div>
          </div>
        </div>

        <!-- Quick Tasks -->
        <div class="teyra-tasks-section">
          <div class="teyra-tasks-header">
            <span class="teyra-tasks-emoji">✅</span>
            <span class="teyra-tasks-title">quick tasks</span>
          </div>
          <div class="teyra-tasks-list" id="teyra-tasks-list">
            <div class="teyra-task-item teyra-completed">
              <div class="teyra-task-checkbox teyra-checked">✓</div>
              <span class="teyra-task-text">morning walk</span>
            </div>
            <div class="teyra-task-item">
              <div class="teyra-task-checkbox">○</div>
              <span class="teyra-task-text">review project docs</span>
            </div>
            <div class="teyra-task-item">
              <div class="teyra-task-checkbox">○</div>
              <span class="teyra-task-text">call mom</span>
            </div>
          </div>
          <button class="teyra-add-task-btn" id="teyra-add-task">
            <span class="teyra-add-icon">+</span>
            <span>add task</span>
          </button>
          <button class="teyra-view-all-btn" id="teyra-view-all">view all tasks →</button>
        </div>
      </div>

      <!-- Minimized state -->
      <div class="teyra-minimized" id="teyra-minimized" style="display: none;">
        <div class="teyra-mini-logo">🌵</div>
        <div class="teyra-mini-stats">
          <span id="teyra-mini-progress">3/7</span>
        </div>
      </div>
    `;
  }

  function addUIStyles() {
    if (document.getElementById('teyra-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'teyra-ui-styles';
    style.textContent = `
      #teyra-ui-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      }

      .teyra-widget {
        width: 320px;
        background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 16px;
        color: white;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: teyraSlideIn 0.3s ease;
      }

      .teyra-minimized {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }

      .teyra-minimized:hover {
        transform: scale(1.05);
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%);
      }

      .teyra-mini-logo {
        font-size: 18px;
        margin-bottom: 2px;
      }

      .teyra-mini-stats {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 600;
      }

      @keyframes teyraSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .teyra-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .teyra-logo-section {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .teyra-logo {
        font-size: 18px;
      }

      .teyra-app-name {
        font-size: 16px;
        font-weight: 600;
        color: white;
      }

      .teyra-actions {
        display: flex;
        gap: 4px;
      }

      .teyra-minimize-btn, .teyra-close-btn {
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 4px;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .teyra-minimize-btn:hover, .teyra-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .teyra-mode-section {
        margin-bottom: 12px;
      }

      .teyra-toggle-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .teyra-toggle-input {
        display: none;
      }

      .teyra-toggle-label {
        width: 36px;
        height: 18px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 18px;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .teyra-toggle-slider {
        width: 14px;
        height: 14px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 2px;
        left: 2px;
        transition: all 0.3s ease;
      }

      .teyra-toggle-input:checked + .teyra-toggle-label {
        background: linear-gradient(135deg, #22c55e, #16a34a);
      }

      .teyra-toggle-input:checked + .teyra-toggle-label .teyra-toggle-slider {
        transform: translateX(18px);
      }

      .teyra-toggle-text {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
      }

      .teyra-stats-card, .teyra-context-card, .teyra-tasks-section {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 10px;
      }

      .teyra-stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        margin-bottom: 6px;
      }

      .teyra-stat-emoji {
        font-size: 14px;
      }

      .teyra-stat-text {
        color: rgba(255, 255, 255, 0.8);
        font-weight: 500;
      }

      .teyra-progress-bar {
        width: 100%;
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
      }

      .teyra-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #22c55e, #16a34a);
        width: 43%;
        transition: width 0.3s ease;
      }

      .teyra-context-header, .teyra-tasks-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
      }

      .teyra-context-emoji, .teyra-tasks-emoji {
        font-size: 14px;
      }

      .teyra-context-title, .teyra-tasks-title {
        font-size: 12px;
        font-weight: 600;
        color: white;
      }

      .teyra-current-site {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
        margin-bottom: 4px;
      }

      .teyra-ai-suggestion {
        font-size: 10px;
        color: rgba(168, 85, 247, 0.8);
        font-style: italic;
      }

      .teyra-tasks-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 8px;
        max-height: 120px;
        overflow-y: auto;
      }

      .teyra-task-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 6px;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .teyra-task-item:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .teyra-task-item.teyra-completed {
        opacity: 0.6;
      }

      .teyra-task-checkbox {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        transition: all 0.2s ease;
      }

      .teyra-task-checkbox.teyra-checked {
        background: #22c55e;
        border-color: #22c55e;
        color: white;
      }

      .teyra-task-text {
        flex: 1;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
      }

      .teyra-add-task-btn, .teyra-view-all-btn {
        width: 100%;
        padding: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        margin-bottom: 4px;
      }

      .teyra-add-task-btn:hover, .teyra-view-all-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.4);
      }

      .teyra-view-all-btn {
        border-style: dashed;
      }

      .teyra-add-icon {
        font-size: 14px;
        font-weight: 300;
      }
    `;

    document.head.appendChild(style);
  }

  function setupUIEventListeners() {
    // Close button
    document.getElementById('teyra-close').addEventListener('click', hideUI);

    // Minimize button
    document.getElementById('teyra-minimize').addEventListener('click', minimizeUI);

    // Productivity mode toggle
    document.getElementById('teyra-productivity-mode').addEventListener('change', function(e) {
      productivityMode = e.target.checked;
      chrome.storage.sync.set({ productivityMode: productivityMode });

      const contextCard = document.getElementById('teyra-context-card');
      contextCard.style.display = productivityMode ? 'block' : 'none';
    });

    // Task interactions
    document.querySelectorAll('.teyra-task-item:not(.teyra-completed)').forEach(item => {
      item.addEventListener('click', function() {
        const checkbox = this.querySelector('.teyra-task-checkbox');
        checkbox.classList.add('teyra-checked');
        checkbox.textContent = '✓';
        this.classList.add('teyra-completed');
      });
    });

    // Add task
    document.getElementById('teyra-add-task').addEventListener('click', function() {
      const taskText = prompt('What task would you like to add?');
      if (taskText && taskText.trim()) {
        addNewTask(taskText.trim());
      }
    });

    // View all tasks
    document.getElementById('teyra-view-all').addEventListener('click', function() {
      window.open('https://teyra.app/dashboard', '_blank');
    });

    // Minimized state click
    document.getElementById('teyra-minimized').addEventListener('click', showUI);

    // Update context
    updateContext();
  }

  function toggleUI() {
    console.log('toggleUI called, isUIVisible:', isUIVisible);
    if (isUIVisible) {
      hideUI();
    } else {
      showUI();
    }
  }

  function showUI() {
    console.log('showUI called, teyraUI exists:', !!teyraUI);
    if (!teyraUI) createUI();

    const widget = document.querySelector('.teyra-widget');
    const minimized = document.getElementById('teyra-minimized');

    console.log('Widget found:', !!widget, 'Minimized found:', !!minimized);

    if (widget) widget.style.display = 'block';
    if (minimized) minimized.style.display = 'none';

    isUIVisible = true;
    chrome.storage.sync.set({ uiVisible: true });
  }

  function hideUI() {
    document.querySelector('.teyra-widget').style.display = 'none';
    document.getElementById('teyra-minimized').style.display = 'none';
    isUIVisible = false;
    chrome.storage.sync.set({ uiVisible: false });
  }

  function minimizeUI() {
    document.querySelector('.teyra-widget').style.display = 'none';
    document.getElementById('teyra-minimized').style.display = 'flex';
    chrome.storage.sync.set({ uiVisible: false });
  }

  function updateContext() {
    const context = analyzeWebsite(window.location.href, document.title);

    document.getElementById('teyra-current-site').textContent = context.activity;
    document.getElementById('teyra-ai-suggestion').textContent = `suggested: ${context.suggestion}`;
  }

  function analyzeWebsite(url, title) {
    const domain = new URL(url).hostname.toLowerCase();

    const contexts = {
      'github.com': {
        activity: 'coding on github',
        suggestion: 'perfect time to tackle that bug fix!'
      },
      'docs.google.com': {
        activity: 'working on docs',
        suggestion: 'great time to finish that document'
      },
      'youtube.com': {
        activity: 'watching youtube',
        suggestion: 'maybe finish that important task first?'
      },
      'twitter.com': {
        activity: 'browsing twitter',
        suggestion: 'quick check! back to productive work?'
      },
      'tiktok.com': {
        activity: 'scrolling tiktok',
        suggestion: 'time flies! ready to tackle your goals?'
      }
    };

    return contexts[domain] || {
      activity: 'browsing the web',
      suggestion: 'great time to check your task list!'
    };
  }

  function addNewTask(text) {
    const tasksList = document.getElementById('teyra-tasks-list');

    const taskItem = document.createElement('div');
    taskItem.className = 'teyra-task-item';
    taskItem.innerHTML = `
      <div class="teyra-task-checkbox">○</div>
      <span class="teyra-task-text">${text}</span>
    `;

    taskItem.addEventListener('click', function() {
      const checkbox = this.querySelector('.teyra-task-checkbox');
      checkbox.classList.add('teyra-checked');
      checkbox.textContent = '✓';
      this.classList.add('teyra-completed');
    });

    tasksList.appendChild(taskItem);
  }

})();