// Teyra Chrome Extension - Content Script
// Runs on all websites to provide context and gentle productivity nudges

console.log('Teyra content script loading...');

(function() {
  'use strict';

  // Safety check - don't run on restricted pages
  if (window.location.protocol === 'chrome:' ||
      window.location.protocol === 'chrome-extension:' ||
      window.location.protocol === 'edge:' ||
      window.location.protocol === 'about:') {
    console.log('Teyra: Skipping restricted page');
    return;
  }

  let productivityMode = true;
  let currentDomain = window.location.hostname;
  let pageStartTime = Date.now();
  let isUserActive = true;
  let inactivityTimer = null;

  // Initialize content script
  init();

  function init() {
    console.log('Teyra content script loaded on:', currentDomain);

    // Wrap in try-catch to handle any DOM access errors
    try {
      // Get productivity mode setting
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['productivityMode'], function(result) {
          productivityMode = result.productivityMode !== false;

          if (productivityMode) {
            startProductivityMonitoring();
          }
        });
      }

      // Listen for storage changes
      if (chrome.storage && chrome.storage.onChanged) {
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
      }

      // Track user activity
      setupActivityTracking();

      // Setup quick add functionality
      setupQuickAddFeatures();
    } catch (error) {
      console.error('Teyra initialization error:', error);
    }
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
        background: #000000;
        color: #FFFFFF;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 40px rgba(0, 0, 0, 0.4);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif;
        font-size: 14px;
        max-width: 320px;
        animation: cursorSlideInFromRight 0.3s ease;
      ">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <img src="${chrome.runtime.getURL('teyra-logo-64kb.png')}" style="
            width: 28px;
            height: 28px;
            border-radius: 6px;
            object-fit: cover;
          " alt="Teyra">
          <div style="flex: 1;">
            <span style="font-weight: 600; color: #FFFFFF;">Teyra</span>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: rgba(255, 255, 255, 0.5);">Making Productivity Productive</p>
          </div>
          <button id="teyra-close" style="
            background: transparent;
            border: none;
            border-radius: 4px;
            color: rgba(255, 255, 255, 0.3);
            cursor: pointer;
            font-size: 18px;
            padding: 4px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='rgba(255, 255, 255, 0.08)'; this.style.color='rgba(255, 255, 255, 0.6)'" onmouseout="this.style.background='transparent'; this.style.color='rgba(255, 255, 255, 0.3)'">×</button>
        </div>
        <div style="color: rgba(255, 255, 255, 0.6); margin-bottom: 16px; line-height: 1.4;">
          Taking a break? Ready to tackle your next task?
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="teyra-view-tasks" style="
            background: #FFFFFF;
            border: none;
            color: #000000;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='rgba(255, 255, 255, 0.9)'" onmouseout="this.style.background='#FFFFFF'">View Tasks</button>
          <button id="teyra-later" style="
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.6);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='rgba(255, 255, 255, 0.03)'; this.style.borderColor='rgba(255, 255, 255, 0.25)'; this.style.color='rgba(255, 255, 255, 0.8)'" onmouseout="this.style.background='transparent'; this.style.borderColor='rgba(255, 255, 255, 0.15)'; this.style.color='rgba(255, 255, 255, 0.6)'">Later</button>
        </div>
      </div>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes cursorSlideInFromRight {
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

  // Setup quick add features
  function setupQuickAddFeatures() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === 'getSelectedText') {
        const selectedText = window.getSelection().toString().trim();
        sendResponse({ text: selectedText });
      } else if (request.action === 'openQuickAddModal') {
        showQuickAddModal();
        sendResponse({ success: true });
      } else if (request.action === 'toggleHighlightMode') {
        if (window.toggleHighlightMode) {
          window.toggleHighlightMode();
        }
        sendResponse({ success: true });
      }
    });

    // Keyboard shortcuts are handled by background script via chrome.commands
    // No need to duplicate the handling here

    // Setup text selection highlighting
    setupTextHighlighting();
  }

  // Text highlighting functionality
  function setupTextHighlighting() {
    let isHighlightMode = false;
    let highlightedElements = [];
    let isProcessing = false;
    let debounceTimer = null;

    function toggleHighlightMode() {
      isHighlightMode = !isHighlightMode;

      if (isHighlightMode) {
        enableHighlightMode();
        showHighlightIndicator();
      } else {
        disableHighlightMode();
        hideHighlightIndicator();
      }
    }

    // Expose to window for modal access
    window.toggleHighlightMode = toggleHighlightMode;
    if (!window.hasOwnProperty('isHighlightMode')) {
      Object.defineProperty(window, 'isHighlightMode', {
        get: () => isHighlightMode,
        configurable: true
      });
    }

    function enableHighlightMode() {
      document.addEventListener('mouseup', handleTextSelection, { passive: true });
      document.addEventListener('click', handleClickOutside, { passive: true });
      document.body.style.cursor = 'crosshair';
    }

    function disableHighlightMode() {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.cursor = 'default';
      clearHighlights();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }

      // Clean up floating menu for special editors
      const floatingMenu = document.getElementById('teyra-floating-menu');
      if (floatingMenu) {
        floatingMenu.remove();
      }
    }

    function handleTextSelection() {
      if (!isHighlightMode || isProcessing) return;

      // Don't allow highlighting inside modals
      const activeElement = document.activeElement;
      const isInsideModal = activeElement?.closest('#teyra-ai-refine-modal') ||
                           activeElement?.closest('[id*="teyra-time-picker"]') ||
                           document.querySelector('#teyra-ai-refine-modal') ||
                           document.querySelector('[style*="z-index: 100000"]');

      if (isInsideModal) return;

      // Clear previous timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Debounce the selection handling
      debounceTimer = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 2) {
          isProcessing = true;

          // Clear any existing highlights and menus first
          clearHighlights();
          hideCursorHoverMenu();
          const existingFloatingMenu = document.getElementById('teyra-floating-menu');
          if (existingFloatingMenu) {
            existingFloatingMenu.remove();
          }

          // Try to highlight
          if (selection.rangeCount > 0) {
            try {
              const range = selection.getRangeAt(0);
              highlightSelectedText(selection);
            } catch (error) {
              // If highlighting fails (multi-element selection), show floating menu instead
              console.log('Highlighting failed, showing floating menu:', error.message);
              showDirectAddMenu(selectedText);
            }
          } else {
            // No range, but we have text - show floating menu
            showDirectAddMenu(selectedText);
          }

          setTimeout(() => {
            isProcessing = false;
          }, 200);
        }
      }, 150);
    }

    // Store last mouse position for menu placement
    let lastMouseX = 0;
    let lastMouseY = 0;

    document.addEventListener('mouseup', (e) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }, { passive: true });

    // Show a floating menu for text in special editors (Google Docs, etc.)
    function showDirectAddMenu(selectedText) {
      const existingMenu = document.getElementById('teyra-floating-menu');
      if (existingMenu) {
        existingMenu.remove();
      }

      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      let rect = range.getBoundingClientRect();

      // If rect has no dimensions, use last mouse position
      if (!rect || rect.width === 0 || rect.height === 0) {
        rect = {
          left: lastMouseX,
          top: lastMouseY,
          right: lastMouseX,
          bottom: lastMouseY,
          width: 0,
          height: 0
        };
      }

      // Parse datetime to check if we should show calendar button
      const dateTime = window.parseDateTime ? window.parseDateTime(selectedText) : null;
      const hasDeadline = dateTime && dateTime.hasDeadline;

      const menu = document.createElement('div');
      menu.id = 'teyra-floating-menu';
      menu.style.cssText = `
        position: absolute;
        background: #1e1e1e;
        border: 1px solid #3e3e3e;
        border-radius: 6px;
        padding: 4px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif;
        font-size: 12px;
        color: #aaa;
        display: flex;
        align-items: center;
        gap: 2px;
        animation: teyraFadeIn 0.15s ease;
        pointer-events: auto;
      `;

      // Add to Teyra button
      const addButton = document.createElement('button');
      addButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-right: 5px; flex-shrink: 0;">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M9 12h6M12 9v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Add to Teyra
      `;
      addButton.style.cssText = `
        background: transparent;
        border: none;
        color: #aaa;
        font-size: 12px;
        font-weight: 400;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 4px;
        transition: background 0.12s ease, color 0.12s ease;
        display: flex;
        align-items: center;
        white-space: nowrap;
        user-select: none;
      `;

      addButton.addEventListener('mouseenter', function() {
        this.style.background = '#2a2a2a';
        this.style.color = '#fff';
      });

      addButton.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
        this.style.color = '#aaa';
      });

      addButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        addSelectedTextAsTask(selectedText);
        window.showSuccessToast('Task added!');
        menu.remove();
      });

      menu.appendChild(addButton);

      // Google Calendar button (only if has deadline)
      if (hasDeadline) {
        const calendarButton = document.createElement('button');
        calendarButton.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-right: 5px; flex-shrink: 0;">
            <rect x="4" y="5" width="16" height="16" rx="2" stroke="#4285f4" stroke-width="2" fill="none"/>
            <path d="M8 3v4M16 3v4" stroke="#4285f4" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 10h16" stroke="#4285f4" stroke-width="2"/>
            <circle cx="12" cy="14" r="1.5" fill="#4285f4"/>
          </svg>
          Google Calendar
        `;
        calendarButton.style.cssText = `
          background: transparent;
          border: none;
          color: #aaa;
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 4px;
          transition: all 0.12s;
          display: flex;
          align-items: center;
          white-space: nowrap;
        `;

        calendarButton.addEventListener('mouseenter', function() {
          this.style.background = '#2a2a2a';
          this.style.color = '#fff';
        });

        calendarButton.addEventListener('mouseleave', function() {
          this.style.background = 'transparent';
          this.style.color = '#aaa';
        });

        calendarButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();

          // Show time picker for floating menu calendar button
          showTimePickerForFloatingMenu(selectedText, dateTime, calendarButton, menu);
        });

        menu.appendChild(calendarButton);
      }

      // AI Refine button
      const aiButton = document.createElement('button');
      aiButton.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 5px; color: #888;">
          <path d="M8 0l1.5 5.5L15 7l-5.5 1.5L8 14l-1.5-5.5L1 7l5.5-1.5L8 0z"/>
        </svg>
        Refine with AI
      `;
      aiButton.style.cssText = `
        background: transparent;
        border: none;
        color: #aaa;
        font-size: 12px;
        font-weight: 400;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 4px;
        transition: all 0.12s;
        display: flex;
        align-items: center;
        white-space: nowrap;
      `;

      aiButton.addEventListener('mouseenter', function() {
        this.style.background = '#2a2a2a';
        this.style.color = '#fff';
      });

      aiButton.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
        this.style.color = '#aaa';
      });

      aiButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showAIRefineModal(selectedText);
        menu.remove();
      });

      menu.appendChild(aiButton);
      document.body.appendChild(menu);

      // Get menu dimensions after adding to DOM
      const menuRect = menu.getBoundingClientRect();

      // Position menu centered above the highlighted text
      // Calculate center of selection
      const selectionCenterX = rect.left + (rect.width / 2);
      const selectionTop = rect.top;

      // Position menu centered horizontally, above the selection
      let left = selectionCenterX - (menuRect.width / 2);
      let top = selectionTop - menuRect.height - 8;

      // Add scroll offset for absolute positioning
      left += window.scrollX;
      top += window.scrollY;

      // Adjust if menu goes off screen horizontally
      if (left < 8) left = 8;
      if (left + menuRect.width > window.innerWidth + window.scrollX - 8) {
        left = window.innerWidth + window.scrollX - menuRect.width - 8;
      }

      // If no room above, show below
      if (top < window.scrollY + 8) {
        top = rect.bottom + window.scrollY + 8;
      }

      menu.style.left = left + 'px';
      menu.style.top = top + 'px';

      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (menu.parentNode) {
          menu.remove();
        }
      }, 5000);
    }

    // Show success toast notification
    function showSuccessToast(message) {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #007acc;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        z-index: 2147483647;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        box-shadow: 0 4px 16px rgba(0, 122, 204, 0.4);
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      toast.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        ${message}
      `;

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }, 2000);
    }

    // Expose to window for modal access
    window.showSuccessToast = showSuccessToast;

    function handleClickOutside(e) {
      // Check if click is outside any highlighted element
      const clickedElement = e.target;
      const isHighlighted = clickedElement.closest('.teyra-cursor-highlight');
      const isMenu = clickedElement.closest('#teyra-cursor-hover-menu');
      const isModal = clickedElement.closest('#teyra-ai-refine-modal') ||
                      clickedElement.closest('[style*="z-index: 10002"]') ||
                      clickedElement.closest('[style*="z-index: 100000"]');

      if (!isHighlighted && !isMenu && !isModal) {
        // Click outside highlighted text and menu, clear highlights
        clearHighlights();
        hideCursorHoverMenu();
      }
    }

    function highlightSelectedText(selection) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();

      try {
        // Check if range contains only text nodes
        if (range.collapsed) {
          throw new Error('No text selected');
        }
        
        // Create highlight span
        const span = document.createElement('span');
        span.className = 'teyra-cursor-highlight';
        span.style.cssText = `
          background: rgba(0, 122, 204, 0.15);
          border: 1px solid rgba(0, 122, 204, 0.3);
          border-radius: 4px;
          padding: 1px 3px;
          margin: 0 1px;
          position: relative;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-block;
        `;
        
        // Only attempt simple highlighting - complex ranges will throw and use floating menu
        range.surroundContents(span);

        highlightedElements.push(span);

        // Instantly show AI breakdown modal after highlighting
        setTimeout(() => {
          showAIRefineModal(selectedText);
        }, 100);

        // Add hover handler for Cursor-style popup (backup)
        span.addEventListener('mouseenter', function(e) {
          e.stopPropagation();
          clearGlobalHoverTimeout();
          showCursorHoverMenu(this, selectedText, e);
          isAnyElementHovered = true;
        });

        span.addEventListener('mouseleave', function(e) {
          e.stopPropagation();
          isAnyElementHovered = false;
          setGlobalHoverTimeout();
        });

        // Add click handler
        span.addEventListener('click', function(e) {
          e.stopPropagation();
          addSelectedTextAsTask(selectedText);
        });

      } catch (error) {
        console.log('Could not highlight text (might be special editor):', error);
        // Fallback: instantly show AI modal
        setTimeout(() => {
          showAIRefineModal(selectedText);
        }, 100);
      }
    }
    
    function isSimpleTextRange(range) {
      try {
        // Check if the range contains only text nodes
        const contents = range.cloneContents();
        const walker = document.createTreeWalker(
          contents,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let textNodeCount = 0;
        let totalNodeCount = 0;
        
        while (walker.nextNode()) {
          textNodeCount++;
        }
        
        // Count all nodes
        const allNodes = contents.querySelectorAll('*');
        totalNodeCount = allNodes.length + textNodeCount;
        
        // If we have more text nodes than other nodes, it's likely simple
        return textNodeCount >= totalNodeCount * 0.8;
      } catch (e) {
        return false;
      }
    }
    
    function highlightComplexRange(range, highlightSpan) {
      try {
        // Extract the contents and replace with our highlight
        const contents = range.extractContents();
        
        // Process the extracted contents
        const walker = document.createTreeWalker(
          contents,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.trim()) {
            textNodes.push(node);
          }
        }
        
        if (textNodes.length === 1) {
          // Single text node - simple replacement
          const parent = textNodes[0].parentNode;
          highlightSpan.textContent = textNodes[0].textContent;
          parent.replaceChild(highlightSpan, textNodes[0]);
        } else {
          // Multiple text nodes - wrap them
          const wrapper = document.createElement('span');
          wrapper.className = 'teyra-cursor-highlight';
          wrapper.style.cssText = highlightSpan.style.cssText;
          
          // Add all text content to wrapper
          textNodes.forEach(textNode => {
            wrapper.appendChild(textNode);
          });
          
          // Replace the first text node with our wrapper
          const firstNode = textNodes[0];
          const parent = firstNode.parentNode;
          parent.replaceChild(wrapper, firstNode);
          
          // Remove remaining text nodes
          for (let i = 1; i < textNodes.length; i++) {
            if (textNodes[i].parentNode) {
              textNodes[i].parentNode.removeChild(textNodes[i]);
            }
          }
        }
        
      } catch (error) {
        console.log('Complex highlighting failed:', error);
        throw error;
      }
    }

    // Old highlight menu removed - using Cursor-style hover menu instead

    function clearHighlights() {
      highlightedElements.forEach(element => {
        if (element.parentNode) {
          const parent = element.parentNode;
          parent.replaceChild(document.createTextNode(element.textContent), element);
          parent.normalize();
        }
      });
      highlightedElements = [];
    }

    function showHighlightIndicator() {
      const indicator = document.createElement('div');
      indicator.id = 'teyra-highlight-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1C1C1C;
        color: #FFFFFF;
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        border: 1px solid #2D2D2D;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      indicator.innerHTML = `
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #4CAF50;"></div>
        <span>Highlight Mode</span>
      `;

      // Add CSS animation
      if (!document.getElementById('teyra-slideInRight-style')) {
        const style = document.createElement('style');
        style.id = 'teyra-slideInRight-style';
        style.textContent = `
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes teyra-pulse {
            0%, 100% {
              box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
            }
            50% {
              box-shadow: 0 8px 32px rgba(102, 126, 234, 0.8);
            }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(indicator);
    }

    function hideHighlightIndicator() {
      const indicator = document.getElementById('teyra-highlight-indicator');
      if (indicator) {
        indicator.remove();
      }
    }

    // Make functions globally available
    window.toggleHighlightMode = toggleHighlightMode;
  }


  // Global hover state management
  let globalHoverTimeout = null;
  let isAnyElementHovered = false;
  
  // AI usage tracking
  const maxFreeUses = 3;

  // Get AI usage count for today
  // Check if user has premium subscription
  async function checkPremiumStatus() {
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.local) {
        resolve(false);
        return;
      }
      chrome.storage.local.get(['teyra_premium'], (result) => {
        resolve(result.teyra_premium === true);
      });
    });
  }

  async function getAIUsageCount() {
    const now = new Date();
    const today = now.toDateString();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.local) {
        resolve({ count: 0, date: today, month: currentMonth, isPremium: false });
        return;
      }
      chrome.storage.local.get(['teyra_ai_usage', 'teyra_premium'], (result) => {
        const stored = result.teyra_ai_usage;
        const isPremium = result.teyra_premium === true;

        if (!stored) {
          resolve({ count: 0, date: today, month: currentMonth, isPremium });
          return;
        }

        // For free users, reset daily. For premium, reset monthly
        const needsReset = isPremium
          ? stored.month !== currentMonth
          : stored.date !== today;

        if (needsReset) {
          const resetUsage = { count: 0, date: today, month: currentMonth, isPremium };
          chrome.storage.local.set({ teyra_ai_usage: resetUsage }, () => {
            resolve(resetUsage);
          });
        } else {
          resolve({ ...stored, isPremium });
        }
      });
    });
  }

  // Increment AI usage count
  async function incrementAIUsage() {
    const usage = await getAIUsageCount();
    usage.count++;

    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.local) {
        resolve(usage);
        return;
      }
      chrome.storage.local.set({ teyra_ai_usage: usage }, () => {
        resolve(usage);
      });
    });
  }

  let aiUsageCount = 0;

  // Initialize usage count
  getAIUsageCount().then(usage => {
    aiUsageCount = usage.count;
  });

  // Track current menu state
  let currentMenuElement = null;
  let currentMenuText = null;

  // Cursor-style hover menu functions
  function showCursorHoverMenu(highlightElement, selectedText, event) {
    // If menu already exists for this exact text and element, just keep it
    if (currentMenuElement === highlightElement && currentMenuText === selectedText) {
      const existingMenu = document.getElementById('teyra-cursor-hover-menu');
      if (existingMenu) {
        // Menu already exists, keep it stable
        if (globalHoverTimeout) {
          clearTimeout(globalHoverTimeout);
          globalHoverTimeout = null;
        }
        isAnyElementHovered = true;
        return;
      }
    }

    // Remove existing menu only if it's for different text/element
    if (currentMenuElement !== highlightElement || currentMenuText !== selectedText) {
      hideCursorHoverMenu();
    }

    // Clear any existing timeout
    if (globalHoverTimeout) {
      clearTimeout(globalHoverTimeout);
      globalHoverTimeout = null;
    }

    // Store current menu state
    currentMenuElement = highlightElement;
    currentMenuText = selectedText;
    
    // Parse datetime for calendar button
    const dateTime = window.parseDateTime ? window.parseDateTime(selectedText) : null;
    const hasDeadline = dateTime && dateTime.hasDeadline;

    const menu = document.createElement('div');
    menu.id = 'teyra-cursor-hover-menu';
    menu.style.cssText = `
      position: fixed;
      background: #1e1e1e;
      border: 1px solid #3e3e3e;
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif;
      font-size: 12px;
      color: #aaa;
      display: flex;
      align-items: center;
      gap: 2px;
      animation: teyraFadeIn 0.15s ease;
      pointer-events: auto;
    `;
    
    // Add CSS animation
    if (!document.getElementById('teyra-cursor-styles')) {
      const style = document.createElement('style');
      style.id = 'teyra-cursor-styles';
      style.textContent = `
        @keyframes teyraFadeIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .teyra-cursor-highlight:hover {
          background: rgba(0, 122, 204, 0.25) !important;
          border-color: rgba(0, 122, 204, 0.5) !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add to Teyra button
    const addButton = document.createElement('button');
    addButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-right: 5px; flex-shrink: 0;">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M9 12h6M12 9v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Add to Teyra
    `;
    addButton.style.cssText = `
      background: transparent;
      border: none;
      color: #aaa;
      font-size: 12px;
      font-weight: 400;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 4px;
      transition: background 0.12s ease, color 0.12s ease;
      display: flex;
      align-items: center;
      white-space: nowrap;
      user-select: none;
    `;

    addButton.addEventListener('mouseenter', function() {
      this.style.background = '#2a2a2a';
      this.style.color = '#fff';
    });

    addButton.addEventListener('mouseleave', function() {
      this.style.background = 'transparent';
      this.style.color = '#aaa';
    });

    addButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      addSelectedTextAsTask(selectedText);
      hideCursorHoverMenu();
      showSuccessToast('Task added!');
    });

    // Add to Calendar button (only if deadline)
    if (hasDeadline) {
      const calendarButton = document.createElement('button');
      calendarButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-right: 5px; flex-shrink: 0;">
          <rect x="4" y="5" width="16" height="16" rx="2" stroke="#4285f4" stroke-width="2" fill="none"/>
          <path d="M8 3v4M16 3v4" stroke="#4285f4" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 10h16" stroke="#4285f4" stroke-width="2"/>
          <circle cx="12" cy="14" r="1.5" fill="#4285f4"/>
        </svg>
        Google Calendar
      `;
      calendarButton.style.cssText = `
        background: transparent;
        border: none;
        color: #aaa;
        font-size: 12px;
        font-weight: 400;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 4px;
        transition: background 0.12s ease, color 0.12s ease;
        display: flex;
        align-items: center;
        white-space: nowrap;
        user-select: none;
      `;

      calendarButton.addEventListener('mouseenter', function() {
        this.style.background = '#2a2a2a';
        this.style.color = '#fff';
      });

      calendarButton.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
        this.style.color = '#aaa';
      });

      calendarButton.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Show time picker modal
        const timePickerModal = document.createElement('div');
        timePickerModal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10002;
          display: flex;
          align-items: center;
          justify-content: center;
        `;

        const pickerContent = document.createElement('div');
        pickerContent.style.cssText = `
          background: #FFFFFF;
          border-radius: 12px;
          padding: 24px;
          width: 360px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        // Use current time as default
        const now = new Date();
        const currentHour = now.getHours() % 12 || 12;
        const currentMinute = now.getMinutes();
        const currentPeriod = now.getHours() >= 12 ? 'PM' : 'AM';

        pickerContent.innerHTML = createTimePickerHTML(dateTime.date, currentHour, currentMinute, currentPeriod);

        timePickerModal.appendChild(pickerContent);
        document.body.appendChild(timePickerModal);

        // Setup slider controls
        const timeControls = setupTimePickerControls(pickerContent, currentPeriod);

        const cancelBtn = pickerContent.querySelector('.teyra-time-cancel');
        const confirmBtn = pickerContent.querySelector('.teyra-time-confirm');

        // Cancel button
        cancelBtn.addEventListener('click', () => {
          timePickerModal.remove();
        });

        // Confirm button
        confirmBtn.addEventListener('click', async () => {
          let hours = timeControls.getHour();
          const minutes = timeControls.getMinute();
          const period = timeControls.getPeriod();

          // Convert to 24-hour format
          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }

          // Validate: reminder time must be before deadline
          const reminderTime = new Date(dateTime.date);
          reminderTime.setHours(hours, minutes, 0, 0);

          // Check if reminder is in the past
          const now = new Date();
          if (reminderTime <= now) {
            window.showSuccessToast('Reminder time must be in the future');
            return;
          }

          if (reminderTime >= dateTime.date) {
            window.showSuccessToast('Reminder time must be before the deadline');
            return;
          }

          // Create new dateTime with custom time
          const customDateTime = {
            date: dateTime.date,
            time: { hours, minutes },
            hasDeadline: true
          };

          timePickerModal.remove();

          const originalHTML = calendarButton.innerHTML;
          calendarButton.disabled = true;
          calendarButton.style.opacity = '0.5';
          calendarButton.innerHTML = '<span style="margin-left: 14px;">Adding...</span>';

          try {
            await new Promise((resolve, reject) => {
              // Check if extension context is still valid
              if (!chrome.runtime?.id) {
                reject(new Error('Extension context invalidated'));
                return;
              }

              chrome.runtime.sendMessage({
                type: 'CREATE_CALENDAR_EVENT',
                taskTitle: selectedText,
                dateTime: customDateTime
              }, response => {
                // Check for runtime errors (extension reloaded)
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                  return;
                }

                if (response && response.success) {
                  resolve(response.event);
                } else {
                  reject(new Error(response?.error || 'Calendar sync failed'));
                }
              });
            });

            addSelectedTextAsTask(selectedText);
            hideCursorHoverMenu();
            showSuccessToast('Added to Calendar & Tasks!');
          } catch (error) {
            console.error('Calendar error:', error);

            // Handle extension reload gracefully
            if (error.message.includes('Extension context invalidated')) {
              showSuccessToast('Extension was reloaded. Please try again.');
              setTimeout(() => window.location.reload(), 1500);
              return;
            }

            showSuccessToast('Calendar sync failed');
            calendarButton.disabled = false;
            calendarButton.style.opacity = '1';
            calendarButton.innerHTML = originalHTML;
          }
        });

        // Close on backdrop click
        timePickerModal.addEventListener('click', (e) => {
          if (e.target === timePickerModal) {
            timePickerModal.remove();
          }
        });
      });

      menu.appendChild(calendarButton);
    }

    // AI Refine button
    const aiButton = document.createElement('button');
    aiButton.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 5px; color: #888;">
        <path d="M8 0l1.5 5.5L15 7l-5.5 1.5L8 14l-1.5-5.5L1 7l5.5-1.5L8 0z"/>
      </svg>
      Refine with AI
    `;
    aiButton.style.cssText = `
      background: transparent;
      border: none;
      color: #aaa;
      font-size: 12px;
      font-weight: 400;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 4px;
      transition: all 0.12s;
      display: flex;
      align-items: center;
      white-space: nowrap;
    `;

    aiButton.addEventListener('mouseenter', function() {
      this.style.background = '#2a2a2a';
      this.style.color = '#fff';
    });

    aiButton.addEventListener('mouseleave', function() {
      this.style.background = 'transparent';
      this.style.color = '#aaa';
    });

    aiButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      showAIRefineModal(selectedText);
      hideCursorHoverMenu();
    });

    menu.appendChild(addButton);
    menu.appendChild(aiButton);
    document.body.appendChild(menu);
    
    // Add mouse events to prevent menu from disappearing
    menu.addEventListener('mouseenter', function(e) {
      e.stopPropagation();
      clearGlobalHoverTimeout();
      isAnyElementHovered = true;
    });
    
    menu.addEventListener('mouseleave', function(e) {
      e.stopPropagation();
      isAnyElementHovered = false;
      setGlobalHoverTimeout();
    });
    
    // Position menu
    const rect = highlightElement.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    
    let left = rect.left + (rect.width / 2) - (menuRect.width / 2);
    let top = rect.top - menuRect.height - 8;
    
    // Adjust if menu goes off screen
    if (left < 8) left = 8;
    if (left + menuRect.width > window.innerWidth - 8) {
      left = window.innerWidth - menuRect.width - 8;
    }
    if (top < 8) {
      top = rect.bottom + 8;
    }
    
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }
  
  function hideCursorHoverMenu() {
    const menu = document.getElementById('teyra-cursor-hover-menu');
    if (menu) {
      menu.remove();
    }
    isAnyElementHovered = false;
    currentMenuElement = null;
    currentMenuText = null;
  }
  
  function clearGlobalHoverTimeout() {
    if (globalHoverTimeout) {
      clearTimeout(globalHoverTimeout);
      globalHoverTimeout = null;
    }
  }
  
  function setGlobalHoverTimeout() {
    clearGlobalHoverTimeout();
    globalHoverTimeout = setTimeout(() => {
      if (!isAnyElementHovered) {
        hideCursorHoverMenu();
      }
    }, 1000); // Increased from 300ms to 1000ms
  }
  
  // Show upgrade modal when user hits free limit
  function showUpgradeModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('teyra-upgrade-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'teyra-upgrade-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: teyraFadeIn 0.2s ease;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 0;
        width: 480px;
        max-width: 90vw;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        overflow: hidden;
      ">
        <!-- Header with gradient -->
        <div style="
          padding: 32px 32px 24px 32px;
          background: linear-gradient(135deg, rgba(66, 133, 244, 0.15) 0%, rgba(66, 133, 244, 0.05) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
        ">
          <div style="
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
          ">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h2 style="
            font-size: 24px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
          ">You've hit your daily limit</h2>
          <p style="
            font-size: 14px;
            color: #999;
            margin: 0;
            line-height: 1.5;
          ">You've used all 3 AI breakdowns today. Upgrade for way more!</p>
        </div>

        <!-- Pricing -->
        <div style="padding: 28px 32px;">
          <div style="
            background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
            border: 2px solid #2563eb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            position: relative;
          ">
            <div style="
              position: absolute;
              top: -10px;
              right: 20px;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">BEST VALUE</div>
            <div style="text-align: center;">
              <div style="
                font-size: 48px;
                font-weight: 800;
                color: #fff;
                line-height: 1;
                margin-bottom: 8px;
              ">$10<span style="font-size: 18px; font-weight: 500; color: #888;">/month</span></div>
              <div style="
                font-size: 13px;
                color: #4285f4;
                font-weight: 600;
                margin-bottom: 20px;
              ">Teyra Pro</div>
              <div style="
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 20px;
                text-align: left;
              ">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style="color: #e1e1e1; font-size: 14px;">100 AI breakdowns/month (way more!)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style="color: #e1e1e1; font-size: 14px;">Smart context linking</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style="color: #e1e1e1; font-size: 14px;">Google Calendar sync</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style="color: #e1e1e1; font-size: 14px;">Priority support</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <button id="teyra-upgrade-btn" style="
            width: 100%;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
            margin-bottom: 10px;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(37, 99, 235, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(37, 99, 235, 0.3)'">
            Upgrade to Pro
          </button>
          <button id="teyra-upgrade-cancel" style="
            width: 100%;
            background: transparent;
            color: #888;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 12px 24px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.color='#aaa'" onmouseout="this.style.background='transparent'; this.style.color='#888'">
            Maybe later
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    document.getElementById('teyra-upgrade-btn').addEventListener('click', async function() {
      // Get user email from storage to pass to website
      chrome.storage.local.get(['teyra_user_email'], (result) => {
        const email = result.teyra_user_email || '';
        const upgradeUrl = `https://teyra.app/account?upgrade=true&email=${encodeURIComponent(email)}`;
        window.open(upgradeUrl, '_blank');
      });
    });

    document.getElementById('teyra-upgrade-cancel').addEventListener('click', function() {
      modal.remove();
    });

    // Close on backdrop click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  function showAIRefineModal(selectedText) {
    // Prevent recursive breakdown - check if text is too short or already processed
    if (selectedText.length < 15) {
      showSuccessToast('Task too short to break down');
      return;
    }

    // Check if this looks like it's already been broken down
    if (selectedText.match(/^(Add to calendar|Research|Study|Read|Shopping:|Email|Block calendar)/i)) {
      showSuccessToast('Already a focused task');
      return;
    }

    // Hide cursor hover menu when modal opens
    hideCursorHoverMenu();

    // Remove existing modal
    const existingModal = document.getElementById('teyra-ai-refine-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'teyra-ai-refine-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10001;
      animation: teyraFadeIn 0.15s ease;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #1e1e1e;
      border: 1px solid #3e3e3e;
      border-radius: 6px;
      padding: 0;
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
    `;

    // Add modal animations
    if (!document.getElementById('teyra-modal-animations')) {
      const animStyle = document.createElement('style');
      animStyle.id = 'teyra-modal-animations';
      animStyle.textContent = `
        @keyframes modalSlideDown {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes teyraFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(animStyle);
    }

    modalContent.innerHTML = `
      <div style="
        padding: 12px 14px;
        border-bottom: 1px solid #2d2d2d;
        background: #1e1e1e;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#888">
              <path d="M8 0l1.5 5.5L15 7l-5.5 1.5L8 14l-1.5-5.5L1 7l5.5-1.5L8 0z"/>
            </svg>
            <span style="color: #888; font-size: 12px; font-weight: 400;">AI breakdown</span>
            <span id="teyra-usage-indicator" style="color: #666; font-size: 11px;">•</span>
          </div>
          <button id="teyra-cancel-refine" style="
            background: transparent;
            border: none;
            color: #666;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            padding: 2px 6px;
            transition: color 0.15s;
          " onmouseover="this.style.color='#aaa'" onmouseout="this.style.color='#666'">×</button>
        </div>
      </div>

      <div style="
        padding: 10px 12px;
        background: linear-gradient(135deg, rgba(66, 133, 244, 0.12) 0%, rgba(52, 168, 83, 0.12) 100%);
        border-bottom: 1px solid rgba(66, 133, 244, 0.2);
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <div style="
          width: 32px;
          height: 32px;
          background: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4285f4" stroke-width="2"/>
            <line x1="16" y1="2" x2="16" y2="6" stroke="#ea4335" stroke-width="2" stroke-linecap="round"/>
            <line x1="8" y1="2" x2="8" y2="6" stroke="#ea4335" stroke-width="2" stroke-linecap="round"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke="#4285f4" stroke-width="2"/>
            <rect x="7" y="13" width="3" height="3" fill="#34a853"/>
            <rect x="14" y="13" width="3" height="3" fill="#fbbc04"/>
          </svg>
        </div>
        <div style="flex: 1;">
          <div style="color: #fff; font-size: 13px; font-weight: 600; margin-bottom: 2px;">
            Add to Google Calendar
          </div>
          <div style="color: #aaa; font-size: 11px; line-height: 1.3;">
            Tasks with deadlines sync automatically
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4285f4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>

      <div style="
        overflow-y: auto;
        padding: 8px;
        background: #1e1e1e;
        flex: 1;
        min-height: 0;
      ">
        <div id="teyra-ai-suggestions"></div>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listeners
    const cancelBtn = document.getElementById('teyra-cancel-refine');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        modal.remove();
      });
    }

    // Close on backdrop click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Prevent clicks inside modal from closing it
    modalContent.addEventListener('click', function(e) {
      e.stopPropagation();
    });


    // Auto-generate AI suggestions when modal opens
    generateAISuggestions(selectedText);
  }

  // Find related tasks from Teyra based on keywords
  async function findRelatedTasks(text) {
    try {
      // Extract keywords from the text
      const keywords = extractKeywords(text);

      // Get tasks from chrome storage
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['teyra_tasks'], (data) => {
          resolve(data.teyra_tasks || []);
        });
      });

      // Find tasks that match keywords
      const relatedTasks = result.filter(task => {
        const taskText = task.title.toLowerCase();
        return keywords.some(keyword => taskText.includes(keyword.toLowerCase()));
      }).slice(0, 3); // Limit to top 3 related tasks

      return relatedTasks;
    } catch (error) {
      console.error('Error finding related tasks:', error);
      return [];
    }
  }

  // Extract meaningful keywords from text (subjects, verbs, important words)
  function extractKeywords(text) {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'due', 'pages', 'finish', 'complete', 'do', 'study'];

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));

    // Get unique words
    return [...new Set(words)];
  }

  // AI Functions
  async function generateAISuggestions(selectedText) {
    const suggestionsDiv = document.getElementById('teyra-ai-suggestions');

    // Check usage limit before proceeding
    const usage = await getAIUsageCount();
    const FREE_LIMIT = 3;
    const PRO_LIMIT = 100;

    // Check if user has hit their limit (3/day for free, 100/month for premium)
    const limit = usage.isPremium ? PRO_LIMIT : FREE_LIMIT;
    if (usage.count >= limit) {
      // Close AI modal
      const aiModal = document.getElementById('teyra-ai-refine-modal');
      if (aiModal) {
        aiModal.remove();
      }

      // Show appropriate message
      if (usage.isPremium) {
        showSuccessToast('Monthly limit reached (100). Resets next month.');
      } else {
        showUpgradeModal();
      }
      return;
    }

    // Increment usage count
    await incrementAIUsage();

    // Show "AI Understanding" animation
    suggestionsDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; padding: 20px; color: #888;">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid #2a2a2a;
          border-top-color: #4285f4;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        "></div>
        <div>
          <div style="font-size: 14px; font-weight: 500; color: #fff; margin-bottom: 4px;">AI analyzing your task...</div>
          <div style="font-size: 12px; color: #888;">Understanding context, deadlines, and priority</div>
        </div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    // Wait a moment to show the animation
    await new Promise(resolve => setTimeout(resolve, 400));

    // Get current usage count (check fresh each time)
    const currentUsage = await getAIUsageCount();
    aiUsageCount = currentUsage.count;

    // Add animations
    if (!document.getElementById('teyra-ai-styles')) {
      const style = document.createElement('style');
      style.id = 'teyra-ai-styles';
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .ai-suggestion-item {
          animation: fadeInUp 0.2s ease forwards;
          opacity: 0;
        }
      `;
      document.head.appendChild(style);
    }

    // Generate AI suggestions instantly - no loading
    const suggestions = generateUniqueAISuggestions(selectedText);

    // Update usage indicator
    const usageIndicator = document.getElementById('teyra-usage-indicator');
    if (usageIndicator) {
      if (currentUsage.isPremium) {
        const remaining = 100 - currentUsage.count;
        usageIndicator.innerHTML = `Pro: ${remaining}/100`;
        usageIndicator.style.color = '#4ade80';
      } else {
        const remaining = 3 - currentUsage.count;
        usageIndicator.innerHTML = `${remaining}/3 today`;
        usageIndicator.style.color = remaining > 1 ? '#4ade80' : remaining > 0 ? '#fb923c' : '#ef4444';
      }
    }

    // Fetch related tasks from Teyra for context linking
    const relatedTasks = await findRelatedTasks(selectedText);

    // Show tasks immediately with staggered fade-in
    suggestionsDiv.innerHTML = '';

    // Show context linking if we found related tasks
    if (relatedTasks.length > 0) {
      const contextSection = document.createElement('div');
      contextSection.style.cssText = `
        padding: 12px;
        margin-bottom: 12px;
        background: linear-gradient(135deg, rgba(66, 133, 244, 0.08) 0%, rgba(66, 133, 244, 0.04) 100%);
        border: 1px solid rgba(66, 133, 244, 0.2);
        border-radius: 6px;
        animation: fadeInUp 0.3s ease;
      `;
      contextSection.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4285f4" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <div style="color: #4285f4; font-size: 12px; font-weight: 600;">AI Found Related Tasks</div>
        </div>
        <div style="color: #aaa; font-size: 11px; line-height: 1.4;">
          ${relatedTasks.map(task => `• ${task.title}`).join('<br>')}
        </div>
      `;
      suggestionsDiv.appendChild(contextSection);
    }

    // Parse the original text for datetime info
    console.log('parseDateTime available?', typeof window.parseDateTime);
    const originalDateTime = window.parseDateTime ? window.parseDateTime(selectedText) : null;
    console.log('Original text datetime:', originalDateTime);

    suggestions.forEach((suggestion, index) => {
      const taskElement = document.createElement('div');
      taskElement.className = 'ai-suggestion-item';
      taskElement.style.cssText = `
        padding: 8px 10px;
        cursor: pointer;
        transition: all 0.12s ease;
        border-radius: 4px;
        margin-bottom: 2px;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        animation: slideInLeft 0.3s ease forwards;
        animation-delay: ${index * 0.04}s;
        opacity: 0;
      `;

      // Add task content with action buttons and checkbox
      taskElement.innerHTML = `
        <div class="task-checkbox" style="
          width: 14px;
          height: 14px;
          border: 1.5px solid #4a4a4a;
          border-radius: 3px;
          flex-shrink: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        "></div>
        <div style="flex: 1; color: #FFFFFF; font-size: 13px; font-weight: 400; line-height: 1.5; min-width: 0;">${suggestion}</div>
        <div class="task-actions" style="opacity: 0; gap: 6px; align-items: center; flex-shrink: 0; display: flex; width: ${originalDateTime && originalDateTime.hasDeadline ? '140px' : '60px'}; justify-content: flex-end; transition: opacity 0.15s ease;">
          ${originalDateTime && originalDateTime.hasDeadline ? `
          <button class="add-to-calendar-btn" style="
            background: transparent;
            border: 1px solid #4a4a4a;
            border-radius: 4px;
            padding: 4px 8px;
            color: #aaa;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Calendar
          </button>
          ` : ''}
          <button class="add-to-tasks-btn" style="
            background: transparent;
            border: 1px solid #4a4a4a;
            border-radius: 4px;
            padding: 4px 8px;
            color: #aaa;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add
          </button>
        </div>
      `;

      const actionsDiv = taskElement.querySelector('.task-actions');
      const calendarBtn = taskElement.querySelector('.add-to-calendar-btn');
      const tasksBtn = taskElement.querySelector('.add-to-tasks-btn');
      const checkbox = taskElement.querySelector('.task-checkbox');

      // Checkbox click handler for multi-select
      let isSelected = false;
      checkbox.addEventListener('click', function(e) {
        e.stopPropagation();
        isSelected = !isSelected;

        if (isSelected) {
          checkbox.style.background = '#4285f4';
          checkbox.style.borderColor = '#4285f4';
          checkbox.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        } else {
          checkbox.style.background = 'transparent';
          checkbox.style.borderColor = '#4a4a4a';
          checkbox.innerHTML = '';
        }

        // Store selection state
        taskElement.dataset.selected = isSelected;
        updateAddSelectedButton();
      });

      taskElement.addEventListener('mouseenter', function() {
        this.style.background = '#2a2a2a';
        actionsDiv.style.opacity = '1';
      });

      taskElement.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
        actionsDiv.style.opacity = '0';
      });

      // Calendar button click - show time picker
      if (calendarBtn) {
        calendarBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          hideCursorHoverMenu();

          // Show time picker modal
          showTimePickerForTask(suggestion, originalDateTime, calendarBtn);
        });
      }

      // Tasks button click
      tasksBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        hideCursorHoverMenu();
        addSelectedTextAsTask(suggestion);
        window.showSuccessToast('Task added!');

        const modal = document.getElementById('teyra-ai-refine-modal');
        if (modal) modal.remove();
        if (window.isHighlightMode) window.toggleHighlightMode();
      });

      suggestionsDiv.appendChild(taskElement);
    });

    // Add "Add All to Teyra" button at the bottom
    const addAllContainer = document.createElement('div');
    addAllContainer.style.cssText = `
      padding: 8px 10px;
      border-top: 1px solid #2d2d2d;
      margin-top: 8px;
    `;

    const addAllButton = document.createElement('button');
    addAllButton.id = 'teyra-add-selected-button';
    addAllButton.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Add All to Teyra
    `;
    addAllButton.style.cssText = `
      width: 100%;
      background: #4285f4;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      color: #ffffff;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    addAllButton.addEventListener('mouseenter', function() {
      this.style.background = '#3a78d8';
    });

    addAllButton.addEventListener('mouseleave', function() {
      this.style.background = '#4285f4';
    });

    addAllButton.addEventListener('click', function() {
      const selectedTasks = Array.from(suggestionsDiv.querySelectorAll('.ai-suggestion-item'))
        .filter(item => item.dataset.selected === 'true')
        .map((item, idx) => suggestions[Array.from(suggestionsDiv.querySelectorAll('.ai-suggestion-item')).indexOf(item)]);

      const tasksToAdd = selectedTasks.length > 0 ? selectedTasks : suggestions;

      tasksToAdd.forEach(suggestion => {
        addSelectedTextAsTask(suggestion);
      });
      window.showSuccessToast(`Added ${tasksToAdd.length} tasks!`);

      const modal = document.getElementById('teyra-ai-refine-modal');
      if (modal) modal.remove();
      if (window.isHighlightMode) window.toggleHighlightMode();
    });

    // Add "Add to Calendar" button for batch operations if there's a deadline
    let calendarBatchButton = null;
    if (originalDateTime && originalDateTime.hasDeadline) {
      calendarBatchButton = document.createElement('button');
      calendarBatchButton.id = 'teyra-add-calendar-batch-button';
      calendarBatchButton.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        Add to Calendar
      `;
      calendarBatchButton.style.cssText = `
        width: 100%;
        background: transparent;
        border: 1px solid #4285f4;
        color: #4285f4;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        display: none;
        align-items: center;
        justify-content: center;
        margin-top: 8px;
      `;

      calendarBatchButton.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(66, 133, 244, 0.1)';
      });

      calendarBatchButton.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
      });

      calendarBatchButton.addEventListener('click', async function() {
        const selectedTasks = Array.from(suggestionsDiv.querySelectorAll('.ai-suggestion-item'))
          .filter(item => item.dataset.selected === 'true')
          .map((item, idx) => {
            const taskIndex = Array.from(suggestionsDiv.querySelectorAll('.ai-suggestion-item')).indexOf(item);
            return suggestions[taskIndex];
          });

        if (selectedTasks.length === 0) {
          window.showSuccessToast('Please select tasks first');
          return;
        }

        hideCursorHoverMenu();

        // Show batch time picker
        showBatchTimePickerForTasks(selectedTasks, originalDateTime);
      });

      addAllContainer.appendChild(calendarBatchButton);
    }

    // Function to update button text based on selection
    function updateAddSelectedButton() {
      const selectedCount = suggestionsDiv.querySelectorAll('.ai-suggestion-item[data-selected="true"]').length;

      if (selectedCount === 0) {
        addAllButton.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add All to Teyra
        `;
        // Hide calendar batch button
        if (calendarBatchButton) {
          calendarBatchButton.style.display = 'none';
        }
      } else {
        addAllButton.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Selected (${selectedCount})
        `;
        // Show calendar batch button
        if (calendarBatchButton) {
          calendarBatchButton.style.display = 'flex';
          calendarBatchButton.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Add ${selectedCount} to Calendar
          `;
        }
      }
    }

    addAllContainer.appendChild(addAllButton);
    suggestionsDiv.parentElement.appendChild(addAllContainer);
  }

  // Batch time picker for multiple tasks - shows all tasks with tabs to switch between
  function showBatchTimePickerForTasks(tasks, dateTime) {
    if (!dateTime || !dateTime.date || tasks.length === 0) return;

    hideCursorHoverMenu();

    // Calculate default time based on current time
    const now = new Date();
    console.log('Batch picker - Current time:', now.toLocaleTimeString());
    console.log('Batch picker - Hours:', now.getHours(), 'Minutes:', now.getMinutes());
    let defaultHours = now.getHours() % 12 || 12;
    let defaultMinutes = now.getMinutes();
    let defaultPeriod = now.getHours() >= 12 ? 'PM' : 'AM';
    console.log('Batch picker - Defaults:', defaultHours, ':', defaultMinutes, defaultPeriod);

    // If the deadline is today and current time is close to or past deadline,
    // use current time, otherwise it will be validated later
    if (dateTime.time) {
      // Use the AI-detected time if available
      defaultHours = dateTime.time.hours % 12 || 12;
      defaultMinutes = dateTime.time.minutes || 0;
      defaultPeriod = dateTime.time.hours >= 12 ? 'PM' : 'AM';
    }

    // Store time settings for each task
    const taskSettings = tasks.map(task => ({
      task,
      hours: defaultHours,
      minutes: defaultMinutes,
      period: defaultPeriod,
      date: new Date(dateTime.date)
    }));

    let currentTaskIndex = 0;

    const timePickerModal = document.createElement('div');
    timePickerModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: teyraFadeIn 0.15s ease;
    `;

    const pickerContent = document.createElement('div');
    pickerContent.style.cssText = `
      background: #FFFFFF;
      border-radius: 12px;
      padding: 24px;
      width: 480px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    function renderPicker() {
      const currentTask = taskSettings[currentTaskIndex];

      pickerContent.innerHTML = `
        <div style="margin-bottom: 20px;">
          <div style="color: #37352F; font-size: 14px; font-weight: 500; margin-bottom: 12px;">Set times for ${tasks.length} tasks</div>

          <!-- Task tabs -->
          <div style="display: flex; gap: 6px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 8px;">
            ${tasks.map((task, idx) => `
              <button class="task-tab" data-index="${idx}" style="
                padding: 8px 12px;
                border: 1px solid ${idx === currentTaskIndex ? '#2383E2' : '#E3E2E0'};
                border-radius: 6px;
                background: ${idx === currentTaskIndex ? '#EBF3FE' : '#FFFFFF'};
                color: ${idx === currentTaskIndex ? '#2383E2' : '#787774'};
                font-size: 12px;
                font-weight: ${idx === currentTaskIndex ? '600' : '500'};
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.15s ease;
                flex-shrink: 0;
              ">
                ${idx + 1}. ${task.length > 20 ? task.substring(0, 20) + '...' : task}
                ${taskSettings[idx].hours !== null ? '✓' : ''}
              </button>
            `).join('')}
          </div>

          <!-- Current task title -->
          <div style="color: #37352F; font-size: 13px; margin-bottom: 12px; padding: 10px; background: #F7F6F3; border-radius: 4px;">
            ${currentTask.task}
          </div>

          <!-- Date picker -->
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 16px;">
            <label style="color: #787774; font-size: 12px;">Deadline:</label>
            <input type="date" class="teyra-date-input" value="${currentTask.date.toISOString().split('T')[0]}" style="
              padding: 4px 8px;
              border: 1px solid #E3E2E0;
              border-radius: 4px;
              font-size: 12px;
              color: #37352F;
              background: #FFFFFF;
              cursor: pointer;
            ">
          </div>
        </div>

        <!-- Time picker -->
        <div style="background: #F7F6F3; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; font-weight: 500; color: #37352F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: -1px;">
              <span class="teyra-display-hour">${String(currentTask.hours || 7).padStart(2, '0')}</span>:<span class="teyra-display-minute">${String(currentTask.minutes || 0).padStart(2, '0')}</span>
              <span class="teyra-display-period" style="font-size: 20px; margin-left: 8px; color: #787774;">${currentTask.period || 'PM'}</span>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="color: #37352F; font-size: 13px; font-weight: 500;">Hour</label>
              <span class="teyra-hour-value" style="color: #787774; font-size: 13px;">${currentTask.hours || 7}</span>
            </div>
            <input type="range" class="teyra-hour-slider" min="1" max="12" value="${currentTask.hours || 7}" style="
              width: 100%;
              height: 4px;
              background: #E3E2E0;
              border-radius: 2px;
              outline: none;
              -webkit-appearance: none;
              cursor: pointer;
            ">
          </div>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="color: #37352F; font-size: 13px; font-weight: 500;">Minute</label>
              <span class="teyra-minute-value" style="color: #787774; font-size: 13px;">${String(currentTask.minutes || 0).padStart(2, '0')}</span>
            </div>
            <input type="range" class="teyra-minute-slider" min="0" max="59" value="${currentTask.minutes || 0}" style="
              width: 100%;
              height: 4px;
              background: #E3E2E0;
              border-radius: 2px;
              outline: none;
              -webkit-appearance: none;
              cursor: pointer;
            ">
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="teyra-am-btn" style="
              flex: 1;
              padding: 8px;
              border: 1px solid #E3E2E0;
              border-radius: 4px;
              background: ${currentTask.period === 'AM' ? '#FFFFFF' : 'transparent'};
              color: ${currentTask.period === 'AM' ? '#37352F' : '#787774'};
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.15s ease;
            ">AM</button>
            <button class="teyra-pm-btn" style="
              flex: 1;
              padding: 8px;
              border: 1px solid #E3E2E0;
              border-radius: 4px;
              background: ${currentTask.period === 'PM' ? '#FFFFFF' : 'transparent'};
              color: ${currentTask.period === 'PM' ? '#37352F' : '#787774'};
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.15s ease;
            ">PM</button>
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: space-between;">
          <button class="teyra-time-cancel" style="
            padding: 8px 14px;
            border: none;
            border-radius: 4px;
            background: transparent;
            color: #787774;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease;
          " onmouseover="this.style.background='#F7F6F3'" onmouseout="this.style.background='transparent'">Cancel</button>
          <button class="teyra-add-all-btn" style="
            padding: 8px 20px;
            border: none;
            border-radius: 4px;
            background: #2383E2;
            color: #FFFFFF;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease;
          " onmouseover="this.style.background='#1a6ec4'" onmouseout="this.style.background='#2383E2'">Add All to Calendar</button>
        </div>

        <style>
          .teyra-hour-slider::-webkit-slider-thumb,
          .teyra-minute-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            background: #2383E2;
            border-radius: 50%;
            cursor: pointer;
          }
          .teyra-hour-slider::-moz-range-thumb,
          .teyra-minute-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #2383E2;
            border: none;
            border-radius: 50%;
            cursor: pointer;
          }
        </style>
      `;

      // Setup interactivity
      setupCurrentTaskControls();
    }

    function setupCurrentTaskControls() {
      const currentTask = taskSettings[currentTaskIndex];

      // Time controls
      const timeControls = setupTimePickerControls(pickerContent, currentTask.period);

      // Date input
      const dateInput = pickerContent.querySelector('.teyra-date-input');
      dateInput.addEventListener('change', () => {
        currentTask.date = new Date(dateInput.value + 'T00:00:00');
      });

      // Save current settings when switching tasks or submitting
      const saveCurrentSettings = () => {
        currentTask.hours = timeControls.getHour();
        currentTask.minutes = timeControls.getMinute();
        currentTask.period = timeControls.getPeriod();
      };

      // Task tab switching
      pickerContent.querySelectorAll('.task-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          saveCurrentSettings();
          currentTaskIndex = parseInt(tab.dataset.index);
          renderPicker();
        });
      });

      // Cancel button
      pickerContent.querySelector('.teyra-time-cancel').addEventListener('click', () => {
        timePickerModal.remove();
      });

      // Add all button
      pickerContent.querySelector('.teyra-add-all-btn').addEventListener('click', async () => {
        saveCurrentSettings();

        const addAllBtn = pickerContent.querySelector('.teyra-add-all-btn');
        addAllBtn.disabled = true;
        addAllBtn.textContent = 'Adding...';

        let successCount = 0;
        let failCount = 0;

        // Add each task to calendar
        for (const setting of taskSettings) {
          try {
            let hours = setting.hours;
            const minutes = setting.minutes;
            const period = setting.period;

            // Convert to 24-hour format
            if (period === 'PM' && hours !== 12) {
              hours += 12;
            } else if (period === 'AM' && hours === 12) {
              hours = 0;
            }

            const deadlineDate = new Date(setting.date);
            deadlineDate.setHours(23, 59, 59, 999);

            const customDateTime = {
              date: deadlineDate,
              time: { hours, minutes },
              hasDeadline: true
            };

            await new Promise((resolve, reject) => {
              if (!chrome.runtime?.id) {
                reject(new Error('Extension context invalidated'));
                return;
              }

              chrome.runtime.sendMessage({
                type: 'CREATE_CALENDAR_EVENT',
                taskTitle: setting.task,
                dateTime: customDateTime
              }, response => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                  return;
                }

                if (response && response.success) {
                  resolve(response.event);
                } else {
                  reject(new Error(response?.error || 'Calendar sync failed'));
                }
              });
            });

            addSelectedTextAsTask(setting.task);
            successCount++;
          } catch (error) {
            console.error(`Failed to add task "${setting.task}":`, error);

            if (error.message.includes('Extension context invalidated')) {
              window.showSuccessToast('Extension was reloaded. Please try again.');
              setTimeout(() => window.location.reload(), 1500);
              return;
            }

            failCount++;
          }
        }

        timePickerModal.remove();

        // Show success message
        if (successCount > 0) {
          window.showSuccessToast(`Added ${successCount} task${successCount > 1 ? 's' : ''} to Calendar & Tasks!`);
        }
        if (failCount > 0) {
          window.showSuccessToast(`${failCount} task${failCount > 1 ? 's' : ''} failed to add`);
        }

        // Close the AI modal
        const modal = document.getElementById('teyra-ai-refine-modal');
        if (modal) modal.remove();
        if (window.isHighlightMode) window.toggleHighlightMode();
      });
    }

    timePickerModal.appendChild(pickerContent);
    document.body.appendChild(timePickerModal);
    renderPicker();
  }

  // Time picker for floating menu calendar button
  function showTimePickerForFloatingMenu(taskTitle, dateTime, calendarButton, floatingMenu) {
    if (!dateTime || !dateTime.date) return;

    // Hide cursor hover menu when time picker opens
    hideCursorHoverMenu();

    const timePickerModal = document.createElement('div');
    timePickerModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: teyraFadeIn 0.15s ease;
    `;

    const pickerContent = document.createElement('div');
    pickerContent.style.cssText = `
      background: #FFFFFF;
      border-radius: 12px;
      padding: 24px;
      width: 360px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    // Use current time as default
    const now = new Date();
    const currentHour = now.getHours() % 12 || 12;
    const currentMinute = now.getMinutes();
    const currentPeriod = now.getHours() >= 12 ? 'PM' : 'AM';

    pickerContent.innerHTML = createTimePickerHTML(dateTime.date, currentHour, currentMinute, currentPeriod);
    /* OLD FLOAT HTML
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="16" rx="2" stroke="#4285f4" stroke-width="2" fill="none"/>
          <path d="M8 3v4M16 3v4" stroke="#4285f4" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 10h16" stroke="#4285f4" stroke-width="2"/>
          <circle cx="12" cy="14" r="1.5" fill="#4285f4"/>
        </svg>
        <div>
          <h3 style="color: #202124; margin: 0; font-size: 16px; font-weight: 600;">Add to Google Calendar</h3>
          <p style="color: #5f6368; margin: 2px 0 0 0; font-size: 13px;">Deadline: ${deadlineDate}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px;">
        <div>
          <label style="display: block; color: #80868b; font-size: 11px; margin-bottom: 4px;">Hour</label>
          <select id="teyra-hour-input-float" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            font-size: 14px;
            color: #202124;
            background: #f8f9fa;
          ">
            ${Array.from({length: 12}, (_, i) => {
              const hour = i === 0 ? 12 : i;
              return `<option value="${hour}" ${hour === 9 ? 'selected' : ''}>${hour}</option>`;
            }).join('')}
          </select>
        </div>
        <div>
          <label style="display: block; color: #80868b; font-size: 11px; margin-bottom: 4px;">Minute</label>
          <select id="teyra-minute-input-float" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            font-size: 14px;
            color: #202124;
            background: #f8f9fa;
          ">
            <option value="00" selected>00</option>
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="45">45</option>
          </select>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; color: #80868b; font-size: 11px; margin-bottom: 4px;">Time of day</label>
        <div style="display: flex; gap: 8px;">
          <button id="teyra-am-btn-float" style="
            flex: 1;
            padding: 10px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            background: #4285f4;
            color: #ffffff;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
          ">AM</button>
          <button id="teyra-pm-btn-float" style="
            flex: 1;
            padding: 10px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            background: #f8f9fa;
            color: #5f6368;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
          ">PM</button>
        </div>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="teyra-time-cancel-float" style="
          padding: 10px 20px;
          border: 1px solid #dadce0;
          border-radius: 6px;
          background: #ffffff;
          color: #5f6368;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        ">Cancel</button>
        <button id="teyra-time-confirm-float" style="
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: #4285f4;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(66, 133, 244, 0.3);
        ">Add to Calendar</button>
      </div>
    */ // OLD FLOAT HTML END

    timePickerModal.appendChild(pickerContent);
    document.body.appendChild(timePickerModal);

    // Setup slider controls
    const timeControls = setupTimePickerControls(pickerContent, 'PM');

    const cancelBtn = pickerContent.querySelector('.teyra-time-cancel');
    const confirmBtn = pickerContent.querySelector('.teyra-time-confirm');

    // Cancel button
    cancelBtn.addEventListener('click', () => {
      timePickerModal.remove();
    });

    // Confirm button
    confirmBtn.addEventListener('click', async () => {
      let hours = timeControls.getHour();
      const minutes = timeControls.getMinute();
      const period = timeControls.getPeriod();

      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      // Validate: reminder time must be before deadline
      const reminderTime = new Date(dateTime.date);
      reminderTime.setHours(hours, minutes, 0, 0);

      // Check if reminder is in the past
      const now = new Date();
      if (reminderTime <= now) {
        window.showSuccessToast('Reminder time must be in the future');
        return;
      }

      if (reminderTime >= dateTime.date) {
        window.showSuccessToast('Reminder time must be before the deadline');
        return;
      }

      // Create new dateTime with custom time
      const customDateTime = {
        date: dateTime.date,
        time: { hours, minutes },
        hasDeadline: true
      };

      timePickerModal.remove();
      floatingMenu.remove();

      try {
        await new Promise((resolve, reject) => {
          // Check if extension context is still valid
          if (!chrome.runtime?.id) {
            reject(new Error('Extension context invalidated'));
            return;
          }

          chrome.runtime.sendMessage({
            type: 'CREATE_CALENDAR_EVENT',
            taskTitle: taskTitle,
            dateTime: customDateTime
          }, response => {
            // Check for runtime errors (extension reloaded)
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            if (response && response.success) {
              resolve(response.event);
            } else {
              reject(new Error(response?.error || 'Calendar sync failed'));
            }
          });
        });

        addSelectedTextAsTask(taskTitle);
        window.showSuccessToast('Added to Calendar & Tasks!');
      } catch (error) {
        console.error('Calendar error:', error);

        // Handle extension reload gracefully
        if (error.message.includes('Extension context invalidated')) {
          window.showSuccessToast('Extension was reloaded. Please try again.');
          setTimeout(() => window.location.reload(), 1500);
          return;
        }

        window.showSuccessToast('Calendar sync failed');
      }
    });
  }

  // Shared time picker creation with Notion-style design
  function createTimePickerHTML(deadlineDate, defaultHour = 7, defaultMinute = 0, defaultPeriod = 'PM', taskTitle = '') {
    return `
      <div style="margin-bottom: 20px;">
        <div style="color: #37352F; font-size: 14px; font-weight: 500; margin-bottom: ${taskTitle ? '8px' : '16px'};">Set reminder time</div>
        ${taskTitle ? `<div style="color: #37352F; font-size: 13px; margin-bottom: 12px; padding: 10px; background: #F7F6F3; border-radius: 4px;">${taskTitle}</div>` : ''}
        <div style="display: flex; gap: 8px; align-items: center;">
          <label style="color: #787774; font-size: 12px;">Deadline:</label>
          <input type="date" class="teyra-date-input" value="${new Date(deadlineDate).toISOString().split('T')[0]}" style="
            padding: 4px 8px;
            border: 1px solid #E3E2E0;
            border-radius: 4px;
            font-size: 12px;
            color: #37352F;
            background: #FFFFFF;
            cursor: pointer;
          ">
        </div>
      </div>

      <div style="background: #F7F6F3; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px; font-weight: 500; color: #37352F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: -1px;">
            <span class="teyra-display-hour">${String(defaultHour).padStart(2, '0')}</span>:<span class="teyra-display-minute">${String(defaultMinute).padStart(2, '0')}</span>
            <span class="teyra-display-period" style="font-size: 20px; margin-left: 8px; color: #787774;">${defaultPeriod}</span>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="color: #37352F; font-size: 13px; font-weight: 500;">Hour</label>
            <span class="teyra-hour-value" style="color: #787774; font-size: 13px;">${defaultHour}</span>
          </div>
          <input type="range" class="teyra-hour-slider" min="1" max="12" value="${defaultHour}" style="
            width: 100%;
            height: 4px;
            background: #E3E2E0;
            border-radius: 2px;
            outline: none;
            -webkit-appearance: none;
            cursor: pointer;
          ">
        </div>

        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="color: #37352F; font-size: 13px; font-weight: 500;">Minute</label>
            <span class="teyra-minute-value" style="color: #787774; font-size: 13px;">${String(defaultMinute).padStart(2, '0')}</span>
          </div>
          <input type="range" class="teyra-minute-slider" min="0" max="59" value="${defaultMinute}" style="
            width: 100%;
            height: 4px;
            background: #E3E2E0;
            border-radius: 2px;
            outline: none;
            -webkit-appearance: none;
            cursor: pointer;
          ">
        </div>

        <div style="display: flex; gap: 8px;">
          <button class="teyra-am-btn" style="
            flex: 1;
            padding: 8px;
            border: 1px solid #E3E2E0;
            border-radius: 4px;
            background: ${defaultPeriod === 'AM' ? '#FFFFFF' : 'transparent'};
            color: ${defaultPeriod === 'AM' ? '#37352F' : '#787774'};
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease;
          ">AM</button>
          <button class="teyra-pm-btn" style="
            flex: 1;
            padding: 8px;
            border: 1px solid #E3E2E0;
            border-radius: 4px;
            background: ${defaultPeriod === 'PM' ? '#FFFFFF' : 'transparent'};
            color: ${defaultPeriod === 'PM' ? '#37352F' : '#787774'};
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
          ">PM</button>
        </div>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="teyra-time-cancel" style="
          padding: 8px 14px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #787774;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        " onmouseover="this.style.background='#F7F6F3'" onmouseout="this.style.background='transparent'">Cancel</button>
        <button class="teyra-time-confirm" style="
          padding: 8px 14px;
          border: none;
          border-radius: 4px;
          background: #2383E2;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        " onmouseover="this.style.background='#1a6ec4'" onmouseout="this.style.background='#2383E2'">Add to calendar</button>
      </div>

      <style>
        .teyra-hour-slider::-webkit-slider-thumb,
        .teyra-minute-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #2383E2;
          border-radius: 50%;
          cursor: pointer;
        }
        .teyra-hour-slider::-moz-range-thumb,
        .teyra-minute-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #2383E2;
          border: none;
          border-radius: 50%;
          cursor: pointer;
        }
      </style>
    `;
  }

  // Setup time picker interactivity
  function setupTimePickerControls(container, initialPeriod = 'PM') {
    const hourSlider = container.querySelector('.teyra-hour-slider');
    const minuteSlider = container.querySelector('.teyra-minute-slider');
    const displayHour = container.querySelector('.teyra-display-hour');
    const displayMinute = container.querySelector('.teyra-display-minute');
    const displayPeriod = container.querySelector('.teyra-display-period');
    const hourValue = container.querySelector('.teyra-hour-value');
    const minuteValue = container.querySelector('.teyra-minute-value');
    const amBtn = container.querySelector('.teyra-am-btn');
    const pmBtn = container.querySelector('.teyra-pm-btn');

    let selectedPeriod = initialPeriod;

    function updateDisplay() {
      const hour = hourSlider.value.padStart(2, '0');
      const minute = minuteSlider.value.padStart(2, '0');
      displayHour.textContent = hour;
      displayMinute.textContent = minute;
      displayPeriod.textContent = selectedPeriod;
      hourValue.textContent = hourSlider.value;
      minuteValue.textContent = minuteSlider.value.padStart(2, '0');
    }

    function updatePeriodButtons() {
      if (selectedPeriod === 'AM') {
        amBtn.style.background = '#FFFFFF';
        amBtn.style.color = '#37352F';
        pmBtn.style.background = 'transparent';
        pmBtn.style.color = '#787774';
      } else {
        pmBtn.style.background = '#FFFFFF';
        pmBtn.style.color = '#37352F';
        amBtn.style.background = 'transparent';
        amBtn.style.color = '#787774';
      }
    }

    hourSlider.addEventListener('input', updateDisplay);
    minuteSlider.addEventListener('input', updateDisplay);

    amBtn.addEventListener('click', () => {
      selectedPeriod = 'AM';
      updatePeriodButtons();
      updateDisplay();
    });

    pmBtn.addEventListener('click', () => {
      selectedPeriod = 'PM';
      updatePeriodButtons();
      updateDisplay();
    });

    // Initialize display
    updateDisplay();
    updatePeriodButtons();

    return {
      getHour: () => parseInt(hourSlider.value),
      getMinute: () => parseInt(minuteSlider.value),
      getPeriod: () => selectedPeriod
    };
  }

  // Time picker for individual breakdown tasks
  function showTimePickerForTask(taskTitle, dateTime, calendarButton) {
    if (!dateTime || !dateTime.date) return;

    // Hide cursor hover menu when time picker opens
    hideCursorHoverMenu();

    const timePickerModal = document.createElement('div');
    timePickerModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: teyraFadeIn 0.15s ease;
    `;

    const pickerContent = document.createElement('div');
    pickerContent.style.cssText = `
      background: #FFFFFF;
      border-radius: 12px;
      padding: 24px;
      width: 360px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    // Use current time as default
    const now = new Date();
    const currentHour = now.getHours() % 12 || 12;
    const currentMinute = now.getMinutes();
    const currentPeriod = now.getHours() >= 12 ? 'PM' : 'AM';

    pickerContent.innerHTML = createTimePickerHTML(dateTime.date, currentHour, currentMinute, currentPeriod, taskTitle);
    /* OLD HTML START
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="16" rx="2" stroke="#4285f4" stroke-width="2" fill="none"/>
          <path d="M8 3v4M16 3v4" stroke="#4285f4" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 10h16" stroke="#4285f4" stroke-width="2"/>
          <circle cx="12" cy="14" r="1.5" fill="#4285f4"/>
        </svg>
        <div>
          <h3 style="color: #202124; margin: 0; font-size: 16px; font-weight: 600;">Add to Google Calendar</h3>
          <p style="color: #5f6368; margin: 2px 0 0 0; font-size: 13px;">Deadline: ${deadlineDate}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px;">
        <div>
          <label style="display: block; color: #80868b; font-size: 11px; margin-bottom: 4px;">Hour</label>
          <select id="teyra-hour-input-task" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            font-size: 14px;
            color: #202124;
            background: #f8f9fa;
          ">
            ${Array.from({length: 12}, (_, i) => {
              const hour = i === 0 ? 12 : i;
              return `<option value="${hour}" ${hour === 9 ? 'selected' : ''}>${hour}</option>`;
            }).join('')}
          </select>
        </div>
        <div>
          <label style="display: block; color: #80868b; font-size: 11px; margin-bottom: 4px;">Minute</label>
          <select id="teyra-minute-input-task" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            font-size: 14px;
            color: #202124;
            background: #f8f9fa;
          ">
            <option value="00" selected>00</option>
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="45">45</option>
          </select>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; color: #80868b; font-size: 11px; margin-bottom: 4px;">Time of day</label>
        <div style="display: flex; gap: 8px;">
          <button id="teyra-am-btn-task" style="
            flex: 1;
            padding: 10px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            background: #4285f4;
            color: #ffffff;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
          ">AM</button>
          <button id="teyra-pm-btn-task" style="
            flex: 1;
            padding: 10px;
            border: 1px solid #dadce0;
            border-radius: 6px;
            background: #f8f9fa;
            color: #5f6368;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
          ">PM</button>
        </div>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="teyra-time-cancel-task" style="
          padding: 10px 20px;
          border: 1px solid #dadce0;
          border-radius: 6px;
          background: #ffffff;
          color: #5f6368;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        ">Cancel</button>
        <button id="teyra-time-confirm-task" style="
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: #4285f4;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(66, 133, 244, 0.3);
        ">Add to Calendar</button>
      </div>
    */ // OLD HTML END

    timePickerModal.appendChild(pickerContent);
    document.body.appendChild(timePickerModal);

    // Setup slider controls
    const timeControls = setupTimePickerControls(pickerContent, 'PM');

    const cancelBtn = pickerContent.querySelector('.teyra-time-cancel');
    const confirmBtn = pickerContent.querySelector('.teyra-time-confirm');

    // Cancel button
    cancelBtn.addEventListener('click', () => {
      timePickerModal.remove();
    });

    // Confirm button
    confirmBtn.addEventListener('click', async () => {
      let hours = timeControls.getHour();
      const minutes = timeControls.getMinute();
      const period = timeControls.getPeriod();

      // Get the selected date from date input
      const dateInput = pickerContent.querySelector('.teyra-date-input');
      const selectedDate = new Date(dateInput.value + 'T00:00:00');

      // Set the deadline to end of day
      const deadlineDate = new Date(selectedDate);
      deadlineDate.setHours(23, 59, 59, 999);

      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      // Validate: reminder time must be before deadline
      const reminderTime = new Date(selectedDate);
      reminderTime.setHours(hours, minutes, 0, 0);

      // Check if reminder is in the past
      const now = new Date();
      if (reminderTime <= now) {
        window.showSuccessToast('Reminder time must be in the future');
        return;
      }

      if (reminderTime >= deadlineDate) {
        window.showSuccessToast('Reminder time must be before the deadline');
        return;
      }

      // Create new dateTime with custom time and date
      const customDateTime = {
        date: deadlineDate,
        time: { hours, minutes },
        hasDeadline: true
      };

      timePickerModal.remove();

      const originalHTML = calendarButton.innerHTML;
      calendarButton.disabled = true;
      calendarButton.style.opacity = '0.5';
      calendarButton.innerHTML = 'Adding...';

      try {
        await new Promise((resolve, reject) => {
          // Check if extension context is still valid
          if (!chrome.runtime?.id) {
            reject(new Error('Extension context invalidated'));
            return;
          }

          chrome.runtime.sendMessage({
            type: 'CREATE_CALENDAR_EVENT',
            taskTitle: taskTitle,
            dateTime: customDateTime
          }, response => {
            // Check for runtime errors (extension reloaded)
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            if (response && response.success) {
              resolve(response.event);
            } else {
              reject(new Error(response?.error || 'Calendar sync failed'));
            }
          });
        });

        addSelectedTextAsTask(taskTitle);
        window.showSuccessToast('Added to Calendar & Tasks!');

        const modal = document.getElementById('teyra-ai-refine-modal');
        if (modal) modal.remove();
        if (window.isHighlightMode) window.toggleHighlightMode();
      } catch (error) {
        console.error('Calendar error:', error);

        // Handle extension reload gracefully
        if (error.message.includes('Extension context invalidated')) {
          window.showSuccessToast('Extension was reloaded. Please try again.');
          setTimeout(() => window.location.reload(), 1500);
          return;
        }

        calendarButton.disabled = false;
        calendarButton.style.opacity = '1';
        calendarButton.innerHTML = originalHTML;
        window.showSuccessToast('Calendar sync failed');
      }
    });
  }

  function generateUniqueAISuggestions(text) {
    console.log('=== AI Breakdown Debug ===');
    console.log('Original text:', text);
    console.log('Text length:', text.length);

    const lowerText = text.toLowerCase();
    const suggestions = [];

    // === MULTI-LINE LIST DETECTION ===
    // Check if text contains line breaks - likely a list of separate tasks
    const lines = text.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);
    console.log('Lines detected:', lines.length, lines);

    if (lines.length > 1) {
      // Multiple lines detected - treat each line as a separate task
      console.log('Returning lines as tasks:', lines.slice(0, 10));
      return lines.slice(0, 10); // Return up to 10 tasks
    }

    // === SUBJECT-BASED TASK LIST ===
    // Pattern: "Math: do homework\nEnglish: read chapter" or similar
    // Check if text contains multiple subject-based tasks (Subject: task format)
    const subjectPattern = /(Math|English|Science|History|Geography|Physics|Chemistry|Biology|Computer Science|Art|Music|PE|Health|Economics|Psychology|Sociology|Spanish|French|German|Chinese|Japanese):\s*([^\n]+)/gi;
    const subjectMatches = [...text.matchAll(subjectPattern)];
    console.log('Subject matches:', subjectMatches.length, subjectMatches);

    if (subjectMatches.length >= 1) {
      const tasks = subjectMatches.map(match => `${match[1]}: ${match[2].trim()}`).slice(0, 10);
      console.log('Returning subject-based tasks:', tasks);
      return tasks;
    }

    // === STUDENT USE CASES ===
    // Pattern: Assignment with due date (e.g., "Essay on climate change due Friday")
    const assignmentDuePattern = /(.+?)\s+(?:due|by)\s+((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|next week|\d{1,2}\/\d{1,2}|\w+\s+\d{1,2}))/i;
    const assignmentMatch = text.match(assignmentDuePattern);

    if (assignmentMatch) {
      const [_, task, deadline] = assignmentMatch;
      const cleanTask = task.trim();

      // Extract the assignment type and topic intelligently
      const essayMatch = task.match(/(essay|paper|report)\s+(?:on|about)\s+(.+)/i);
      const projectMatch = task.match(/(?:complete|finish|do)\s+(.+)/i);

      if (essayMatch) {
        const topic = essayMatch[2];
        suggestions.push(`Research ${topic}`);
        suggestions.push(`Outline key arguments`);
        suggestions.push(`Write and revise draft`);
      } else if (projectMatch) {
        suggestions.push(cleanTask);
        suggestions.push(`Review submission requirements`);
        suggestions.push(`Submit by ${deadline}`);
      } else {
        // Generic assignment - be smarter
        suggestions.push(cleanTask);
        if (!lowerText.includes('remind') && !lowerText.includes('submit')) {
          suggestions.push(`Finish 1 day before ${deadline}`);
        }
      }
      return suggestions.slice(0, 3);
    }

    // Pattern: "Read pages X-Y" or "Read chapter X" (study material)
    const readPagesPattern = /read\s+(?:pages?\s+)?(\d+)[–-](\d+)|read\s+chapter\s+(\d+)|pages?\s+(\d+)[–-](\d+)/i;
    const readMatch = text.match(readPagesPattern);

    if (readMatch) {
      const startPage = readMatch[1] || readMatch[4];
      const endPage = readMatch[2] || readMatch[5];
      const chapter = readMatch[3];

      // Extract subject context if mentioned
      const subjectMatch = text.match(/(?:for|in|of)\s+(\w+)/i);
      const subject = subjectMatch ? subjectMatch[1] : null;

      if (chapter) {
        suggestions.push(`Read Chapter ${chapter}`);
        if (subject) {
          suggestions.push(`Highlight key ${subject} concepts`);
        } else {
          suggestions.push(`Note important definitions`);
        }
      } else {
        const pageCount = parseInt(endPage) - parseInt(startPage) + 1;
        if (pageCount > 30) {
          suggestions.push(`Read ${startPage}–${Math.floor((parseInt(startPage) + parseInt(endPage)) / 2)}`);
          suggestions.push(`Read ${Math.floor((parseInt(startPage) + parseInt(endPage)) / 2) + 1}–${endPage}`);
        } else {
          suggestions.push(`Read pages ${startPage}–${endPage}`);
          suggestions.push(`Annotate as you go`);
        }
      }
      return suggestions.slice(0, 3);
    }

    // Pattern: Exam or test preparation
    if (lowerText.includes('exam') || lowerText.includes('test') || lowerText.includes('quiz')) {
      const subjectMatch = text.match(/(?:exam|test|quiz)\s+(?:on|for|in)?\s*(\w+)/i);
      const dateMatch = text.match(/(monday|tuesday|wednesday|thursday|friday|tomorrow)/i);
      const subject = subjectMatch ? subjectMatch[1] : '';

      if (dateMatch && dateMatch[0].toLowerCase() === 'tomorrow') {
        suggestions.push(`Quick review ${subject} key formulas`);
        suggestions.push(`Get good sleep before exam`);
      } else {
        suggestions.push(`${subject ? subject + ' - ' : ''}Practice problems`);
        suggestions.push(`Make flashcards for weak areas`);
        if (dateMatch) {
          suggestions.push(`Final review ${dateMatch[0]}`);
        }
      }
      return suggestions.slice(0, 3);
    }

    // Pattern: Study session
    if (lowerText.includes('study') || lowerText.includes('homework')) {
      const subjectMatch = text.match(/(?:study|homework)\s+(?:for\s+)?(\w+)/i);
      const subject = subjectMatch ? subjectMatch[1] : '';

      if (lowerText.includes('homework')) {
        suggestions.push(`${subject} homework problems`);
        suggestions.push(`Check answers as you go`);
      } else {
        suggestions.push(`Study ${subject}`.trim());
        suggestions.push(`Focus on recent lectures`);
      }
      return suggestions.slice(0, 3);
    }

    // Pattern: "Write [essay/paper/report] on [topic]"
    const writingPattern = /write\s+(?:a\s+)?(\w+)\s+(?:about|on)\s+(.+)|(\w+)\s+(?:essay|paper|report)\s+on\s+(.+)/i;
    const writeMatch = text.match(writingPattern);

    if (writeMatch) {
      const type = writeMatch[1] || writeMatch[3] || 'paper';
      const topic = writeMatch[2] || writeMatch[4];
      suggestions.push(`Research ${topic}`);
      suggestions.push(`Outline ${type}`);
      suggestions.push(`Write first draft`);
      return suggestions;
    }

    // === PROFESSIONAL USE CASES ===
    // Pattern: Email action items (e.g., "Follow up with John", "Send proposal")
    if (lowerText.includes('follow up') || lowerText.includes('reach out') || lowerText.includes('contact')) {
      const nameMatch = text.match(/(?:follow up|reach out|contact)\s+(?:with\s+)?(\w+)/i);
      const name = nameMatch ? nameMatch[1] : 'contact';
      suggestions.push(`Email ${name}`);
      suggestions.push(`Draft key talking points`);
      suggestions.push(`Schedule follow-up`);
      return suggestions;
    }

    // Pattern: Project deliverables
    if (lowerText.includes('deliverable') || lowerText.includes('project') || lowerText.includes('initiative')) {
      suggestions.push(`Define project scope`);
      suggestions.push(`Assign team responsibilities`);
      suggestions.push(`Set milestone deadlines`);
      return suggestions;
    }

    // Pattern: Meeting scheduling and prep
    if (lowerText.includes('meeting') || lowerText.includes('call') || lowerText.includes('standup')) {
      const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:[AP]M)?)/i);
      const personMatch = text.match(/(?:with|meet)\s+(\w+)/i);

      if (timeMatch) {
        suggestions.push(`Block calendar at ${timeMatch[1]}`);
      } else {
        suggestions.push(`Schedule meeting time`);
      }

      if (personMatch) {
        suggestions.push(`Prep talking points for ${personMatch[1]}`);
      } else {
        suggestions.push(`Prepare agenda`);
      }

      suggestions.push(`Share notes after`);
      return suggestions;
    }

    // Pattern: Review/feedback requests
    if (lowerText.includes('review') || lowerText.includes('feedback') || lowerText.includes('approve')) {
      suggestions.push(`Review thoroughly`);
      suggestions.push(`Provide feedback`);
      suggestions.push(`Approve or request changes`);
      return suggestions;
    }

    // Pattern: Document/report creation
    if (lowerText.includes('create') || lowerText.includes('draft') || lowerText.includes('prepare')) {
      const docMatch = text.match(/(?:create|draft|prepare)\s+(?:a\s+)?(.+)/i);
      const docType = docMatch ? docMatch[1] : 'document';
      suggestions.push(`Start ${docType}`);
      suggestions.push(`Complete first draft`);
      suggestions.push(`Share for review`);
      return suggestions;
    }

    // Pattern: Slack/Notion todos (action verbs)
    const actionVerbs = ['update', 'fix', 'implement', 'deploy', 'configure', 'setup', 'install'];
    const hasActionVerb = actionVerbs.some(verb => lowerText.includes(verb));

    if (hasActionVerb) {
      suggestions.push(text);
      suggestions.push(`Test implementation`);
      suggestions.push(`Document changes`);
      return suggestions;
    }

    // === EVERYDAY TASKS ===
    // Pattern: Shopping lists
    if (lowerText.includes('buy') || lowerText.includes('pick up') || lowerText.includes('grocery') || lowerText.includes('shopping')) {
      const itemsMatch = text.match(/(?:buy|pick up|get)\s+(.+)/i);
      const items = itemsMatch ? itemsMatch[1] : text;
      suggestions.push(`Shopping: ${items}`);
      suggestions.push(`Check store hours`);
      return suggestions.slice(0, 2);
    }

    // Pattern: Appointments (doctor, dentist, etc.)
    if (lowerText.includes('appointment') || lowerText.includes('doctor') || lowerText.includes('dentist')) {
      const timeMatch = text.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
      const dateMatch = text.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2})/i);

      if (timeMatch || dateMatch) {
        suggestions.push(`Add to calendar${timeMatch ? ` - ${timeMatch[1]}` : ''}`);
      } else {
        suggestions.push(`Call to schedule appointment`);
      }
      suggestions.push(`Set reminder day before`);
      return suggestions.slice(0, 2);
    }

    // Pattern: Errands
    if (lowerText.includes('errand') || lowerText.includes('drop off') || lowerText.includes('return')) {
      suggestions.push(text);
      suggestions.push(`Schedule time to go`);
      return suggestions.slice(0, 2);
    }

    // Pattern: Event/webinar with date and time
    const eventPattern = /(.+?)\s+on\s+(.+?)\s+at\s+(\d{1,2}:\d{2}\s*[AP]M\s*[A-Z]{3})/i;
    const eventMatch = text.match(eventPattern);

    if (eventMatch) {
      const [_, eventName, date, time] = eventMatch;
      const cleanEvent = eventName.replace(/^(join|attend|watch|for|in)\s+/i, '').trim();

      suggestions.push(`${cleanEvent} - ${date} ${time}`);

      // Extract names if present
      const nameMatch = eventName.match(/(?:with|and)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
      if (nameMatch) {
        nameMatch.forEach(name => {
          const cleanName = name.replace(/^(with|and)\s+/i, '');
          suggestions.push(`Research ${cleanName} beforehand`);
        });
      }

      return suggestions.slice(0, 3);
    }

    // Pattern: Multiple distinct actions (only if they're actually different tasks)
    if (text.includes(' and ')) {
      const parts = text.split(/\s+and\s+/i);
      // Only split if parts are substantive tasks (not just connecting phrases)
      const substantiveParts = parts.filter(part => {
        const trimmed = part.trim();
        return trimmed.length > 10 && !trimmed.match(/^(on|at|in|by|the|a|an)\s/i);
      });

      if (substantiveParts.length >= 2) {
        substantiveParts.forEach((part, index) => {
          if (suggestions.length < 3) {
            suggestions.push(part.trim().charAt(0).toUpperCase() + part.trim().slice(1));
          }
        });
        if (suggestions.length > 0) return suggestions;
      }
    }

    // Pattern: Deadline task (finish X before/by Y)
    const deadlinePattern = /(finish|complete|submit|send|write|read|do)\s+(.+?)\s+(before|by)\s+(.+)/i;
    const deadlineMatch = text.match(deadlinePattern);

    if (deadlineMatch) {
      const [_, verb, taskDescription, preposition, deadline] = deadlineMatch;
      const cleanTask = taskDescription.trim();

      // Extract the actual thing to do
      suggestions.push(`${verb.charAt(0).toUpperCase() + verb.slice(1)} ${cleanTask}`);

      // Parse deadline for context
      const lowerDeadline = deadline.toLowerCase();
      if (lowerDeadline.includes('tomorrow') || lowerDeadline.includes('today')) {
        suggestions.push(`Set aside focused time to work on this`);
      }

      return suggestions.slice(0, 2);
    }

    // Fallback: Just return the task as-is
    suggestions.push(text);
    return suggestions.slice(0, 1);
  }

  function getDaysUntil(dateStr) {
    // Simple helper to calculate days until a date
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    const targetDay = days.findIndex(d => dateStr.toLowerCase().includes(d));

    if (targetDay === -1) return 7; // Default to a week if we can't parse

    let daysUntil = targetDay - today;
    if (daysUntil < 0) daysUntil += 7;
    return daysUntil;
  }

  function analyzeTextForTasks(text) {
    // Keep the old function for backward compatibility
    return generateUniqueAISuggestions(text);
  }
  
  function selectAISuggestion(suggestion) {
    document.getElementById('teyra-refined-text').value = suggestion;
  }

  // Add all tasks with smooth animation
  function addAllTasksWithAnimation(suggestions) {
    const modal = document.getElementById('teyra-ai-refine-modal');
    if (!modal) return;

    // Show success animation
    const modalContent = modal.querySelector('div > div');
    modalContent.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 48px; margin-bottom: 16px; animation: bounce 0.6s ease;">✓</div>
        <div style="font-weight: 600; color: #fff; font-size: 18px; margin-bottom: 8px;">Adding ${suggestions.length} tasks to Teyra</div>
        <div style="font-size: 14px; color: #888;">Your tasks are being synced...</div>
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 8px;" id="task-progress-list">
          ${suggestions.map((suggestion, index) =>
            `<div class="task-adding-item" style="
              padding: 12px;
              background: #111;
              border: 1px solid #222;
              border-radius: 8px;
              color: #fff;
              font-size: 13px;
              display: flex;
              align-items: center;
              gap: 12px;
              opacity: 0;
              transform: translateY(10px);
            ">
              <div class="task-check" style="
                width: 18px;
                height: 18px;
                border: 2px solid #333;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
              "></div>
              <div style="flex: 1; text-align: left;">${suggestion.substring(0, 50)}${suggestion.length > 50 ? '...' : ''}</div>
            </div>`
          ).join('')}
        </div>
      </div>
    `;

    // Animate each task being added
    suggestions.forEach((suggestion, index) => {
      setTimeout(() => {
        const taskItems = document.querySelectorAll('.task-adding-item');
        if (taskItems[index]) {
          taskItems[index].style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          taskItems[index].style.opacity = '1';
          taskItems[index].style.transform = 'translateY(0)';

          // Add checkmark after a brief moment
          setTimeout(() => {
            const checkmark = taskItems[index].querySelector('.task-check');
            if (checkmark) {
              checkmark.style.background = '#007acc';
              checkmark.style.borderColor = '#007acc';
              checkmark.innerHTML = '✓';
              checkmark.style.color = '#fff';
            }

            // Actually add the task
            addSelectedTextAsTask(suggestion);
          }, 200);
        }

        // Close modal after all tasks are added
        if (index === suggestions.length - 1) {
          setTimeout(() => {
            modal.remove();
          }, 1000);
        }
      }, index * 300);
    });
  }
  
  function splitIntoTasks(selectedText) {
    const suggestionsDiv = document.getElementById('teyra-ai-suggestions');
    const splitBtn = document.getElementById('teyra-split-tasks');

    // Show loading state
    splitBtn.textContent = 'Splitting...';
    splitBtn.disabled = true;
    suggestionsDiv.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #888;">
        <div style="font-size: 24px; margin-bottom: 12px; animation: bounce 1s infinite;">🔍</div>
        <div style="font-weight: 600; color: #fff; margin-bottom: 8px;">Analyzing text...</div>
        <div style="font-size: 12px;">Breaking down into actionable tasks</div>
        <div style="margin-top: 12px; display: flex; justify-content: center; gap: 4px;">
          <div style="width: 6px; height: 6px; background: #007acc; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
          <div style="width: 6px; height: 6px; background: #007acc; border-radius: 50%; animation: pulse 1.5s infinite 0.2s;"></div>
          <div style="width: 6px; height: 6px; background: #007acc; border-radius: 50%; animation: pulse 1.5s infinite 0.4s;"></div>
        </div>
      </div>
    `;

    // Smart task splitting based on content
    const tasks = smartTaskSplitting(selectedText);

    // Show shimmer placeholders
    setTimeout(() => {
      suggestionsDiv.innerHTML = `
        <div class="ai-header-fade" style="margin-bottom: 12px;">
          <div style="font-weight: 600; color: #fff; margin-bottom: 8px;">Creating individual tasks...</div>
        </div>
        ${tasks.map(() =>
          `<div class="ai-suggestion-item-shimmer" style="height: 68px;"></div>`
        ).join('')}
      `;
    }, 800);

    // Incrementally reveal each task
    tasks.forEach((task, index) => {
      setTimeout(() => {
        const shimmerElements = suggestionsDiv.querySelectorAll('.ai-suggestion-item-shimmer');
        if (shimmerElements[0]) {
          const taskElement = document.createElement('div');
          taskElement.className = 'ai-suggestion-item';
          taskElement.style.cssText = `
            padding: 12px;
            border: 1px solid #222;
            cursor: pointer;
            transition: all 0.2s ease;
            border-radius: 8px;
            margin-bottom: 8px;
            background: transparent;
          `;
          taskElement.innerHTML = `
            <div style="font-weight: 600; color: #fff; margin-bottom: 4px;">${task}</div>
            <div style="font-size: 12px; color: #888;">Click to add this task</div>
          `;

          taskElement.addEventListener('mouseover', function() {
            this.style.background = '#111';
            this.style.borderColor = '#333';
            this.style.transform = 'scale(1.02)';
          });

          taskElement.addEventListener('mouseout', function() {
            this.style.background = 'transparent';
            this.style.borderColor = '#222';
            this.style.transform = 'scale(1)';
          });

          taskElement.addEventListener('click', function() {
            addTaskFromSuggestion(task);
          });

          shimmerElements[0].replaceWith(taskElement);
        }

        // After all tasks are revealed, update header
        if (index === tasks.length - 1) {
          setTimeout(() => {
            const header = suggestionsDiv.querySelector('.ai-header-fade');
            if (header) {
              header.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-weight: 600; color: #fff;">Split Tasks (${tasks.length})</div>
                  <button id="teyra-add-all-split-tasks" style="
                    background: #007acc;
                    border: none;
                    border-radius: 6px;
                    padding: 6px 12px;
                    color: white;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                  ">Add All Tasks</button>
                </div>
              `;

              // Add event listener for "Add All Tasks" button
              const addAllBtn = document.getElementById('teyra-add-all-split-tasks');
              if (addAllBtn) {
                addAllBtn.addEventListener('mouseenter', function() {
                  this.style.background = '#005a9e';
                  this.style.transform = 'scale(1.05)';
                });
                addAllBtn.addEventListener('mouseleave', function() {
                  this.style.background = '#007acc';
                  this.style.transform = 'scale(1)';
                });
                addAllBtn.addEventListener('click', function() {
                  addAllTasksWithAnimation(tasks);
                });
              }
            }

            splitBtn.textContent = 'Split into Tasks';
            splitBtn.disabled = false;
          }, 200);
        }
      }, 1200 + (index * 350)); // Stagger each task by 350ms
    });
  }
  
  function smartTaskSplitting(text) {
    // Use the same intelligent parsing as generateUniqueAISuggestions
    return generateUniqueAISuggestions(text);
  }
  
  function addTaskFromSuggestion(taskText) {
    const modal = document.getElementById('teyra-ai-refine-modal');
    if (!modal) return;

    // Show success animation
    const modalContent = modal.querySelector('div > div');
    const originalContent = modalContent.innerHTML;

    modalContent.innerHTML = `
      <div style="text-align: center; padding: 60px 40px;">
        <div style="
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: #007acc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <div style="
            font-size: 40px;
            color: white;
            animation: checkmark 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
            opacity: 0;
          ">✓</div>
        </div>
        <div style="font-weight: 600; color: #fff; font-size: 18px; margin-bottom: 8px;">Task Added!</div>
        <div style="font-size: 14px; color: #888; margin-bottom: 20px;">Successfully added to your Teyra todo list</div>
        <div style="
          padding: 16px;
          background: #111;
          border: 1px solid #222;
          border-radius: 8px;
          color: #ccc;
          font-size: 13px;
          text-align: left;
          max-width: 400px;
          margin: 0 auto;
        ">${taskText.substring(0, 100)}${taskText.length > 100 ? '...' : ''}</div>
      </div>
    `;

    // Add scaleIn and checkmark animations if not already present
    if (!document.getElementById('teyra-success-styles')) {
      const style = document.createElement('style');
      style.id = 'teyra-success-styles';
      style.textContent = `
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes checkmark {
          from {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Actually add the task
    addSelectedTextAsTask(taskText);

    // Close modal after showing success
    setTimeout(() => {
      modal.remove();
    }, 1500);
  }

  // Add selected text as task
  function addSelectedTextAsTask(text) {
    chrome.runtime.sendMessage({
      type: 'QUICK_ADD_TASK',
      text: text,
      url: window.location.href,
      title: document.title
    });
  }

  // Show quick add modal
  function showQuickAddModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('teyra-quick-add-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'teyra-quick-add-modal';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          background: #1C1C1C;
          border: 1px solid #2D2D2D;
          border-radius: 8px;
          padding: 20px;
          width: 480px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          animation: cursorSlideIn 0.15s ease-out;
        ">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <img src="${chrome.runtime.getURL('teyra-logo-64kb.png')}" style="
              width: 24px;
              height: 24px;
              border-radius: 6px;
            " />
            <div style="flex: 1;">
              <h3 style="margin: 0; font-size: 14px; font-weight: 500; color: #FFFFFF;">Add to Teyra</h3>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #808080;">Making Productivity Productive</p>
            </div>
            <button id="teyra-close-modal" style="
              background: transparent;
              border: none;
              color: #808080;
              cursor: pointer;
              padding: 4px;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              transition: color 0.15s ease;
              border-radius: 4px;
            ">×</button>
          </div>
          <div style="margin-bottom: 16px;">
            <input
              id="teyra-task-input"
              type="text"
              placeholder="What needs to be done?"
              style="
                width: 100%;
                padding: 10px 12px;
                background: #0D0D0D;
                border: 1px solid #2D2D2D;
                border-radius: 6px;
                font-size: 13px;
                color: #FFFFFF;
                outline: none;
                transition: border-color 0.15s ease;
                box-sizing: border-box;
              "
            />
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button id="teyra-cancel-task" style="
              background: transparent;
              border: 1px solid #2D2D2D;
              color: #CCCCCC;
              padding: 7px 14px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.15s ease;
            ">Cancel</button>
            <button id="teyra-add-task" style="
              background: #FFFFFF;
              border: none;
              color: #000000;
              padding: 7px 14px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.15s ease;
            ">Add Task</button>
          </div>
        </div>
      </div>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes cursorSlideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(modal);

    // Focus the input
    const input = modal.querySelector('#teyra-task-input');
    const closeBtn = modal.querySelector('#teyra-close-modal');
    const cancelBtn = modal.querySelector('#teyra-cancel-task');
    const addBtn = modal.querySelector('#teyra-add-task');
    const innerModal = modal.querySelector('div > div');

    input.focus();

    // Add event listeners
    closeBtn.onclick = () => modal.remove();
    cancelBtn.onclick = () => modal.remove();

    // Hover effects for close button
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.color = '#FFFFFF';
      closeBtn.style.background = '#2D2D2D';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.color = '#808080';
      closeBtn.style.background = 'transparent';
    });

    // Hover effects for cancel button
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = '#2D2D2D';
      cancelBtn.style.color = '#FFFFFF';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = 'transparent';
      cancelBtn.style.color = '#CCCCCC';
    });

    // Hover effects for add button
    addBtn.addEventListener('mouseenter', () => {
      addBtn.style.background = '#E6E6E6';
    });
    addBtn.addEventListener('mouseleave', () => {
      addBtn.style.background = '#FFFFFF';
    });

    // Input focus/blur effects
    input.addEventListener('focus', () => {
      input.style.borderColor = '#404040';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = '#2D2D2D';
    });

    addBtn.onclick = () => {
      const taskText = input.value.trim();
      if (taskText) {
        addSelectedTextAsTask(taskText);
        modal.remove();
      }
    };

    // Handle Enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const taskText = input.value.trim();
        if (taskText) {
          addSelectedTextAsTask(taskText);
          modal.remove();
        }
      }
    });

    // Handle Escape key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.remove();
      }
    });

    // Close on backdrop click
    innerModal.onclick = (e) => e.stopPropagation();
    modal.onclick = () => modal.remove();
  }

})();
})();