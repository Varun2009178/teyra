/**
 * Content script that runs on all websites to detect distracting content
 * and communicate with the background script for focus mode
 */

console.log('🌵 Teyra content detector script loaded on:', window.location.href);

// Test immediate execution
setTimeout(() => {
  console.log('🌵 Teyra content detector: 1 second test');
  console.log('🌵 Current hostname:', window.location.hostname);
  console.log('🌵 Document ready state:', document.readyState);
}, 1000);

// Safe sessionStorage wrapper to handle sandboxed contexts
const safeSessionStorage = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.log('🌵 sessionStorage not available (sandboxed context)');
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.log('🌵 sessionStorage not available (sandboxed context)');
    }
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.log('🌵 sessionStorage not available (sandboxed context)');
    }
  }
};

// Categories of distracting websites
const DISTRACTING_CATEGORIES = {
  social: {
    domains: [
      'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com',
      'snapchat.com', 'linkedin.com', 'reddit.com', 'discord.com', 'whatsapp.com',
      'telegram.org', 'pinterest.com', 'tumblr.com', 'mastodon.social',
      'threads.net', 'bluesky.app', 'clubhouse.com', 'vk.com', 'weibo.com',
      'line.me', 'viber.com', 'signal.org', 'slack.com', 'bereal.com',
      'yubo.live', 'vsco.co', 'poshmark.com', 'nextdoor.com'
    ],
    keywords: ['social', 'chat', 'messaging', 'community', 'feed', 'stories', 'reels']
  },
  entertainment: {
    domains: [
      'youtube.com', 'netflix.com', 'hulu.com', 'disney.com', 'twitch.tv',
      'spotify.com', 'soundcloud.com', 'pornhub.com', 'xvideos.com', 'imgur.com',
      'giphy.com', 'meme', 'funny', 'entertainment'
    ],
    keywords: ['video', 'stream', 'music', 'entertainment', 'funny', 'meme']
  },
  shopping: {
    domains: [
      'amazon.com', 'ebay.com', 'aliexpress.com', 'etsy.com', 'walmart.com',
      'target.com', 'bestbuy.com', 'costco.com', 'shopify.com', 'zalando.com'
    ],
    keywords: ['shop', 'buy', 'cart', 'purchase', 'deal', 'sale']
  },
  news: {
    domains: [
      'cnn.com', 'bbc.com', 'reuters.com', 'nytimes.com', 'washingtonpost.com',
      'guardian.com', 'bloomberg.com', 'techcrunch.com', 'verge.com'
    ],
    keywords: ['news', 'breaking', 'politics', 'world']
  }
};

// Get current website category
function detectWebsiteCategory() {
  const hostname = window.location.hostname.toLowerCase();
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();

  // Check domain matches
  for (const [category, data] of Object.entries(DISTRACTING_CATEGORIES)) {
    // Direct domain match
    if (data.domains.some(domain => hostname.includes(domain))) {
      return category;
    }

    // Keyword match in URL or title
    if (data.keywords.some(keyword => url.includes(keyword) || title.includes(keyword))) {
      return category;
    }
  }

  return 'productive'; // Default for non-distracting sites
}

// Check if site should be blocked based on focus mode
async function checkFocusMode() {
  try {
    const result = await chrome.storage.local.get(['focus_mode_active']);
    console.log('🌵 Focus mode storage result:', result);
    return result.focus_mode_active || false;
  } catch (error) {
    console.log('🌵 Error checking focus mode:', error);
    return false;
  }
}

// Show sophisticated focus nudge with task suggestions
async function showFocusNudge(category) {
  console.log('🌵 showFocusNudge called for category:', category);

  // Remove existing nudge if present
  const existingNudge = document.getElementById('teyra-focus-nudge');
  if (existingNudge) {
    console.log('🌵 Removing existing nudge');
    existingNudge.remove();
  }

  // Get user's tasks for suggestions
  console.log('🌵 Getting suggested task...');
  const suggestedTask = await getSuggestedTask();
  console.log('🌵 Suggested task:', suggestedTask);

  // Create a simple, reliable nudge overlay
  console.log('🌵 Creating simplified nudge overlay...');
  const nudgeOverlay = document.createElement('div');
  nudgeOverlay.id = 'teyra-focus-nudge';

  // Set background to dark, not red
  nudgeOverlay.style.position = 'fixed';
  nudgeOverlay.style.top = '0';
  nudgeOverlay.style.left = '0';
  nudgeOverlay.style.width = '100%';
  nudgeOverlay.style.height = '100%';
  nudgeOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  nudgeOverlay.style.backdropFilter = 'blur(8px)';
  nudgeOverlay.style.zIndex = '999999';
  nudgeOverlay.style.display = 'flex';
  nudgeOverlay.style.alignItems = 'center';
  nudgeOverlay.style.justifyContent = 'center';
  nudgeOverlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  nudgeOverlay.style.opacity = '0';
  nudgeOverlay.style.transition = 'opacity 0.3s ease';

  console.log('🌵 Nudge overlay background set to dark black, not red');

  // Create the card content
  const nudgeCard = document.createElement('div');
  nudgeCard.style.cssText = `
    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%) !important;
    border: 1px solid #333 !important;
    border-radius: 16px !important;
    padding: 32px !important;
    max-width: 480px !important;
    width: 90% !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8) !important;
    transform: scale(0.95) !important;
    transition: transform 0.3s ease !important;
    color: white !important;
  `;

  // Create content step by step to avoid innerHTML issues
  console.log('🌵 Creating nudge content with task:', suggestedTask.title);

  const header = document.createElement('div');
  header.style.textAlign = 'center';
  header.style.marginBottom = '24px';

  // Create Mike's avatar
  const mikeContainer = document.createElement('div');
  mikeContainer.style.marginBottom = '16px';

  const mikeImg = document.createElement('img');
  mikeImg.src = chrome.runtime.getURL('Neutral Calm.gif');
  mikeImg.style.width = '64px';
  mikeImg.style.height = '64px';
  mikeImg.style.borderRadius = '12px';
  mikeImg.style.objectFit = 'cover';
  mikeImg.alt = 'Mike';

  // Fallback if image doesn't load
  mikeImg.onerror = () => {
    mikeImg.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.textContent = '🌵';
    fallback.style.fontSize = '48px';
    fallback.style.lineHeight = '64px';
    mikeContainer.appendChild(fallback);
  };

  mikeContainer.appendChild(mikeImg);

  const title = document.createElement('h2');
  title.textContent = 'Mike says: Stay Focused';
  title.style.fontSize = '24px';
  title.style.fontWeight = '700';
  title.style.color = '#f1f1f1';
  title.style.margin = '0 0 8px 0';

  const subtitle = document.createElement('p');
  subtitle.textContent = 'You have Focus Mode enabled. Time to work on your tasks instead!';
  subtitle.style.fontSize = '16px';
  subtitle.style.color = '#a1a1a1';
  subtitle.style.margin = '0';

  header.appendChild(mikeContainer);
  header.appendChild(title);
  header.appendChild(subtitle);

  const taskSection = document.createElement('div');
  taskSection.style.background = '#1a1a1a';
  taskSection.style.border = '1px solid #2a2a2a';
  taskSection.style.borderRadius = '12px';
  taskSection.style.padding = '16px';
  taskSection.style.marginBottom = '24px';
  taskSection.innerHTML = `
    <div style="font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase;">Suggested Task</div>
    <div style="font-size: 16px; font-weight: 600; color: #e1e1e1; margin-bottom: 4px;">${suggestedTask.title}</div>
    <div style="font-size: 14px; color: #888;">${suggestedTask.description}</div>
  `;

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '12px';

  // Primary actions row
  const primaryRow = document.createElement('div');
  primaryRow.style.display = 'flex';
  primaryRow.style.gap = '12px';

  const workBtn = document.createElement('button');
  workBtn.id = 'teyra-work-on-task';
  workBtn.textContent = 'Work on task';
  workBtn.style.cssText = `
    flex: 1;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  `;

  const continueBtn = document.createElement('button');
  continueBtn.id = 'teyra-continue-anyway';
  continueBtn.textContent = 'Continue anyway';
  continueBtn.style.cssText = `
    flex: 1;
    background: transparent;
    color: #888;
    border: 1px solid #404040;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  `;

  primaryRow.appendChild(workBtn);
  primaryRow.appendChild(continueBtn);

  // Secondary action row - Complete task
  const completeBtn = document.createElement('button');
  completeBtn.id = 'teyra-complete-task';
  completeBtn.textContent = '✓ Mark task complete';
  completeBtn.style.cssText = `
    width: 100%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  `;

  buttonContainer.appendChild(primaryRow);

  // Only show complete button if we have a valid task ID
  if (suggestedTask.id) {
    buttonContainer.appendChild(completeBtn);
  }

  nudgeCard.appendChild(header);
  nudgeCard.appendChild(taskSection);
  nudgeCard.appendChild(buttonContainer);

  console.log('🌵 Nudge content created successfully');

  nudgeOverlay.appendChild(nudgeCard);

  console.log('🌵 Appending nudge to document body...');
  document.body.appendChild(nudgeOverlay);

  // Show with animation
  requestAnimationFrame(() => {
    console.log('🌵 Showing nudge with animation...');
    nudgeOverlay.style.opacity = '1';
    nudgeCard.style.transform = 'scale(1)';
  });

  // Add event listeners
  console.log('🌵 Setting up event listeners...');

  workBtn.onclick = async () => {
    console.log('🌵 Work on task clicked');

    try {
      // Send message to background script to open extension popup and close tab
      await chrome.runtime.sendMessage({
        type: 'OPEN_EXTENSION_AND_CLOSE_TAB',
        taskId: suggestedTask.id
      });
      console.log('🌵 Requested to open extension and close tab');
    } catch (error) {
      console.log('🌵 Error opening extension:', error);
      // Fallback: redirect to productive page
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'https://teyra.app/dashboard';
      }
    }
  };

  continueBtn.onclick = () => {
    console.log('🌵 Continue anyway clicked');
    nudgeOverlay.style.opacity = '0';
    setTimeout(() => nudgeOverlay.remove(), 300);

    // Set 5-minute timer before showing nudge again
    const continueUntil = Date.now() + (5 * 60 * 1000); // 5 minutes
    safeSessionStorage.setItem('teyra-continue-' + window.location.hostname, continueUntil.toString());

    // Show countdown timer in top right
    showContinueTimer(continueUntil);
  };

  // Complete task handler
  const completeBtnElement = document.getElementById('teyra-complete-task');
  if (completeBtnElement) {
    completeBtnElement.onclick = async () => {
      console.log('🌵 Complete task clicked for task:', suggestedTask.id);

      try {
        // Send message to background to complete the task
        await chrome.runtime.sendMessage({
          type: 'COMPLETE_TASK',
          taskId: suggestedTask.id
        });

        // Show success animation
        completeBtnElement.textContent = '✓ Completed!';
        completeBtnElement.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';

        // Hide nudge after short delay
        setTimeout(() => {
          nudgeOverlay.style.opacity = '0';
          setTimeout(() => nudgeOverlay.remove(), 300);
        }, 1000);

        console.log('🌵 Task completed successfully');
      } catch (error) {
        console.log('🌵 Error completing task:', error);
        completeBtnElement.textContent = 'Error - try again';
        completeBtnElement.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      }
    };
  }

  console.log('🌵 Nudge setup completed successfully');
}

// Show countdown timer in top right corner
function showContinueTimer(continueUntil) {
  // Remove existing timer if present
  const existingTimer = document.getElementById('teyra-continue-timer');
  if (existingTimer) {
    existingTimer.remove();
  }

  const timer = document.createElement('div');
  timer.id = 'teyra-continue-timer';
  timer.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%) !important;
    color: white !important;
    padding: 12px 16px !important;
    border-radius: 8px !important;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    z-index: 999998 !important;
    border: 1px solid #333 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    backdrop-filter: blur(8px) !important;
  `;

  document.body.appendChild(timer);

  let timerInterval;

  // Listen for focus mode changes
  const focusModeListener = (changes, namespace) => {
    if (namespace === 'local' && changes.focus_mode_active) {
      const isFocusModeActive = changes.focus_mode_active.newValue;
      if (!isFocusModeActive) {
        // Focus mode was turned off, remove timer and session storage
        console.log('🌵 Focus mode disabled, stopping continue timer');
        if (timerInterval) {
          clearTimeout(timerInterval);
        }
        timer.remove();
        safeSessionStorage.removeItem('teyra-continue-' + window.location.hostname);
        // Remove this listener since timer is done
        chrome.storage.onChanged.removeListener(focusModeListener);
      }
    }
  };

  chrome.storage.onChanged.addListener(focusModeListener);

  // Update timer every second
  const updateTimer = () => {
    // Check if focus mode is still active
    chrome.storage.local.get(['focus_mode_active']).then((result) => {
      const isFocusModeActive = result.focus_mode_active || false;

      if (!isFocusModeActive) {
        // Focus mode was turned off, remove timer
        console.log('🌵 Focus mode disabled, stopping continue timer');
        timer.remove();
        safeSessionStorage.removeItem('teyra-continue-' + window.location.hostname);
        chrome.storage.onChanged.removeListener(focusModeListener);
        return;
      }

      const timeLeft = continueUntil - Date.now();

      if (timeLeft <= 0) {
        timer.remove();
        safeSessionStorage.removeItem('teyra-continue-' + window.location.hostname);
        chrome.storage.onChanged.removeListener(focusModeListener);
        console.log('🌵 Continue timer expired');
        return;
      }

      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      timer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div>🌵</div>
          <div>Focus resumes in ${minutes}:${seconds.toString().padStart(2, '0')}</div>
        </div>
      `;

      timerInterval = setTimeout(updateTimer, 1000);
    });
  };

  updateTimer();
}

// Get a suggested task from user's todo list
async function getSuggestedTask() {
  try {
    console.log('🌵 Fetching tasks from storage...');
    const result = await chrome.storage.local.get(['teyra_tasks']);
    console.log('🌵 Storage result:', result);
    const tasks = result.teyra_tasks || [];
    console.log('🌵 Found tasks:', tasks.length);

    // Filter incomplete tasks
    const incompleteTasks = tasks.filter(task =>
      !task.completed &&
      !task.title.includes('[COMPLETED]') &&
      task.title.trim().length > 0
    );
    console.log('🌵 Incomplete tasks:', incompleteTasks.length);

    if (incompleteTasks.length === 0) {
      console.log('🌵 No incomplete tasks, returning default');
      return {
        title: "Take a productive break",
        description: "Consider planning your next task or reviewing your goals"
      };
    }

    // Prioritize tasks with keywords like "urgent", "important", or return a random one
    const urgentTask = incompleteTasks.find(task =>
      task.title.toLowerCase().includes('urgent') ||
      task.title.toLowerCase().includes('important') ||
      task.title.toLowerCase().includes('deadline')
    );

    const selectedTask = urgentTask || incompleteTasks[0];
    console.log('🌵 Selected task:', selectedTask);

    return {
      title: selectedTask.title,
      description: "Focus on completing this task instead",
      id: selectedTask.id
    };
  } catch (error) {
    console.error('🌵 Error getting suggested task:', error);
    return {
      title: "Stay focused on your goals",
      description: "Consider what you could accomplish instead"
    };
  }
}

// Create sophisticated nudge HTML with Linear/Notion design
function createNudgeHTML(category, suggestedTask) {
  const categoryInfo = getCategoryInfo(category);

  return `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      backdrop-filter: blur(8px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif;
      opacity: 0;
      transition: opacity 0.3s ease;
    ">
      <div class="teyra-nudge-card" style="
        background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 48px 40px;
        max-width: 520px;
        width: 90%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
        transform: scale(0.98);
        transition: transform 0.3s ease;
        text-align: center;
        position: relative;
      ">
        <!-- Teyra Logo -->
        <div style="
          width: 56px;
          height: 56px;
          margin: 0 auto 28px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
        ">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>

        <!-- Main message -->
        <div style="margin-bottom: 28px;">
          <h2 style="
            font-size: 20px;
            font-weight: 600;
            color: #e1e1e1;
            margin-bottom: 10px;
            line-height: 1.3;
          ">Taking a break?<br/>Ready to tackle your next task?</h2>
          <p style="
            font-size: 14px;
            color: #a1a1a1;
            line-height: 1.6;
            margin: 0;
          ">Focus Mode is active. You're on ${categoryInfo.name.toLowerCase()} — let's get back to being productive.</p>
        </div>

        <!-- Suggested task -->
        <div style="
          background: linear-gradient(135deg, #242424 0%, #1a1a1a 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 28px;
          text-align: left;
        ">
          <div style="
            font-size: 10px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.35);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
          ">Up Next</div>
          <div style="
            font-size: 15px;
            font-weight: 600;
            color: #e1e1e1;
            margin-bottom: 5px;
            line-height: 1.4;
          ">${suggestedTask.title}</div>
          <div style="
            font-size: 13px;
            color: #888;
            line-height: 1.5;
          ">${suggestedTask.description}</div>
        </div>

        <!-- Actions -->
        <div style="
          display: flex;
          gap: 10px;
        ">
          <button id="teyra-work-on-task" style="
            flex: 1;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            border: none;
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          ">Work on task</button>
          <button id="teyra-continue-anyway" style="
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            color: #a1a1a1;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          ">Continue anyway</button>
        </div>

        <!-- Close button -->
        <button id="teyra-close-nudge" style="
          position: absolute;
          top: 18px;
          right: 18px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 20px;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s ease;
          line-height: 1;
        ">×</button>
      </div>
    </div>
  `;
}

// Get category information for display
function getCategoryInfo(category) {
  const categoryMap = {
    social: {
      name: 'Social Media',
      icon: '💬',
      color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    entertainment: {
      name: 'Entertainment',
      icon: '🎬',
      color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    },
    shopping: {
      name: 'Shopping',
      icon: '🛒',
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    news: {
      name: 'News',
      icon: '📰',
      color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    }
  };

  return categoryMap[category] || {
    name: 'Distracting',
    icon: '⚠️',
    color: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
  };
}

// Setup event listeners for nudge interactions
function setupNudgeEventListeners(nudgeOverlay, suggestedTask) {
  // Work on task button
  document.getElementById('teyra-work-on-task').onclick = () => {
    // Open Teyra dashboard or mark task as started
    chrome.runtime.sendMessage({
      type: 'TASK_FOCUS_STARTED',
      taskId: suggestedTask.id,
      taskTitle: suggestedTask.title
    }).catch(() => {
      // If extension context is invalid, just close nudge
    });

    // Redirect to productive page
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'https://teyra.app/dashboard';
    }
  };

  // Continue anyway button
  document.getElementById('teyra-continue-anyway').onclick = () => {
    nudgeOverlay.style.opacity = '0';
    setTimeout(() => nudgeOverlay.remove(), 200);
    // Store that user chose to continue on this site for this session
    safeSessionStorage.setItem('teyra-continue-' + window.location.hostname, 'true');
  };

  // Close button
  document.getElementById('teyra-close-nudge').onclick = () => {
    nudgeOverlay.style.opacity = '0';
    setTimeout(() => nudgeOverlay.remove(), 200);
    safeSessionStorage.setItem('teyra-continue-' + window.location.hostname, 'true');
  };

  // Add hover effects
  const workBtn = document.getElementById('teyra-work-on-task');
  const continueBtn = document.getElementById('teyra-continue-anyway');
  const closeBtn = document.getElementById('teyra-close-nudge');

  workBtn.onmouseover = () => {
    workBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    workBtn.style.transform = 'translateY(-1px)';
    workBtn.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.35)';
  };
  workBtn.onmouseout = () => {
    workBtn.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
    workBtn.style.transform = 'translateY(0)';
    workBtn.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
  };

  continueBtn.onmouseover = () => {
    continueBtn.style.background = 'rgba(255, 255, 255, 0.08)';
    continueBtn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    continueBtn.style.color = '#c1c1c1';
  };
  continueBtn.onmouseout = () => {
    continueBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    continueBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    continueBtn.style.color = '#a1a1a1';
  };

  closeBtn.onmouseover = () => {
    closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    closeBtn.style.color = 'rgba(255, 255, 255, 0.6)';
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    closeBtn.style.color = 'rgba(255, 255, 255, 0.4)';
  };
}

// Main detection and nudging logic
async function initContentDetection() {
  console.log('🌵 Teyra content detector initialized on:', window.location.hostname);

  const category = detectWebsiteCategory();
  console.log('🌵 Website category detected:', category);

  const isFocusModeActive = await checkFocusMode();
  console.log('🌵 Focus mode active:', isFocusModeActive);

  // Skip if it's a productive site or teyra.app
  if (category === 'productive' || window.location.hostname.includes('teyra.app')) {
    console.log('🌵 Skipping nudge - productive site or teyra.app');
    return;
  }

  // Check if user already chose to continue on this site and timer hasn't expired
  const continueKey = 'teyra-continue-' + window.location.hostname;
  const continueUntil = safeSessionStorage.getItem(continueKey);
  if (continueUntil && Date.now() < parseInt(continueUntil)) {
    console.log('🌵 Skipping nudge - user chose to continue, timer still active');
    // Show the existing timer if it's still running
    showContinueTimer(parseInt(continueUntil));
    return;
  } else if (continueUntil) {
    // Timer expired, remove the session storage
    safeSessionStorage.removeItem(continueKey);
    console.log('🌵 Continue timer expired, showing nudge again');
  }

  // Send website info to background script
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'WEBSITE_DETECTED',
      category: category,
      hostname: window.location.hostname,
      url: window.location.href,
      title: document.title
    });
    console.log('🌵 Website detection message sent to background, response:', response);
  } catch (error) {
    console.log('🌵 Error sending message to background:', error);
  }

  // Show nudge if focus mode is active
  if (isFocusModeActive && category !== 'productive') {
    console.log('🌵 Showing focus nudge for category:', category);
    showFocusNudge(category);
  } else {
    console.log('🌵 Not showing nudge - focus mode:', isFocusModeActive, 'category:', category);
  }
}

// Listen for focus mode changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.focus_mode_active) {
    const isFocusModeActive = changes.focus_mode_active.newValue;
    const category = detectWebsiteCategory();

    if (isFocusModeActive && category !== 'productive') {
      // Focus mode was just turned on and we're on a distracting site
      showFocusNudge(category);
    } else if (!isFocusModeActive) {
      // Focus mode was turned off, remove any nudges
      const existingNudge = document.getElementById('teyra-focus-nudge');
      if (existingNudge) {
        existingNudge.remove();
      }
    }
  }
});

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentDetection);
} else {
  initContentDetection();
}

// Also check when navigating within single-page apps
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(initContentDetection, 1000); // Delay to allow page to load
  }
}).observe(document, { subtree: true, childList: true });