// Simple Teyra Content Script for Testing
console.log('Teyra content script loading...');

(function() {
  'use strict';

  // Test if content script is working
  console.log('Teyra content script loaded on:', window.location.hostname);

  // Add keyboard shortcut listeners
  document.addEventListener('keydown', function(e) {
    console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Meta:', e.metaKey, 'Shift:', e.shiftKey);
    
    // Check for Ctrl+Shift+Q (or Cmd+Shift+Q on Mac) - Quick add
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Q') {
      e.preventDefault();
      console.log('Quick add shortcut triggered!');
      const selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        console.log('Selected text:', selectedText);
        addSelectedTextAsTask(selectedText);
      } else {
        console.log('No text selected, opening modal');
        showQuickAddModal();
      }
    }
    
    // Check for Ctrl+Shift+E (or Cmd+Shift+E on Mac) - Highlight mode
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      console.log('Highlight mode shortcut triggered!');
      toggleHighlightMode();
    }
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Message received:', request);
    if (request.action === 'getSelectedText') {
      const selectedText = window.getSelection().toString().trim();
      sendResponse({ text: selectedText });
    } else if (request.action === 'openQuickAddModal') {
      showQuickAddModal();
      sendResponse({ success: true });
    } else if (request.action === 'toggleHighlightMode') {
      toggleHighlightMode();
      sendResponse({ success: true });
    }
  });

  // Simple highlight mode
  let isHighlightMode = false;

  function toggleHighlightMode() {
    isHighlightMode = !isHighlightMode;
    console.log('Highlight mode:', isHighlightMode);
    
    if (isHighlightMode) {
      document.addEventListener('mouseup', handleTextSelection);
      document.body.style.cursor = 'crosshair';
      showHighlightIndicator();
    } else {
      document.removeEventListener('mouseup', handleTextSelection);
      document.body.style.cursor = 'default';
      hideHighlightIndicator();
    }
  }

  function handleTextSelection() {
    if (!isHighlightMode) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0) {
      console.log('Text selected in highlight mode:', selectedText);
      highlightSelectedText(selection);
    }
  }

  function highlightSelectedText(selection) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'teyra-highlight';
    span.style.cssText = `
      background: linear-gradient(120deg, #007acc 0%, #4fc1ff 100%);
      color: white;
      padding: 2px 4px;
      border-radius: 3px;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 122, 204, 0.3);
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    try {
      range.surroundContents(span);
      
      // Add click handler to add as task
      span.addEventListener('click', function() {
        console.log('Highlighted text clicked:', this.textContent);
        addSelectedTextAsTask(this.textContent);
      });
      
    } catch (error) {
      console.log('Could not highlight text:', error);
    }
  }

  function showHighlightIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'teyra-highlight-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007acc;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
    `;
    indicator.textContent = 'Highlight Mode: Select text to add as task';
    document.body.appendChild(indicator);
  }

  function hideHighlightIndicator() {
    const indicator = document.getElementById('teyra-highlight-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Add selected text as task
  function addSelectedTextAsTask(text) {
    console.log('Adding task:', text);
    chrome.runtime.sendMessage({
      type: 'QUICK_ADD_TASK',
      text: text,
      url: window.location.href,
      title: document.title
    });
  }

  // Show quick add modal
  function showQuickAddModal() {
    console.log('Showing quick add modal');
    const modal = document.createElement('div');
    modal.id = 'teyra-quick-add-modal';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 24px;
          max-width: 420px;
          width: 90%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        ">
          <h3 style="margin: 0 0 20px 0; color: #f0f6fc;">Add to Teyra</h3>
          <input 
            id="teyra-task-input" 
            type="text" 
            placeholder="What needs to be done?"
            style="
              width: 100%;
              padding: 12px;
              background: #161b22;
              border: 1px solid #30363d;
              border-radius: 8px;
              font-size: 14px;
              color: #f0f6fc;
              outline: none;
              box-sizing: border-box;
              margin-bottom: 16px;
            "
          />
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button id="teyra-cancel-task" style="
              background: #21262d;
              border: 1px solid #30363d;
              color: #8b949e;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
            ">Cancel</button>
            <button id="teyra-add-task" style="
              background: #1f6feb;
              border: 1px solid #1f6feb;
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
            ">Add Task</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Focus the input
    const input = modal.querySelector('#teyra-task-input');
    input.focus();

    // Add event listeners
    modal.querySelector('#teyra-cancel-task').onclick = () => modal.remove();
    
    modal.querySelector('#teyra-add-task').onclick = () => {
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

    // Close on backdrop click
    modal.onclick = () => modal.remove();
  }

  // Make functions globally available
  window.toggleHighlightMode = toggleHighlightMode;

})();
