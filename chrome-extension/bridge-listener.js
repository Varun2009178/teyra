// Bridge Listener - Listens for messages from the main Teyra app

(function() {
  'use strict';

  // Listen for messages from the main Teyra app
  window.addEventListener('message', function(event) {
    console.log('Bridge listener received message:', event.data, 'from origin:', event.origin);

    // Only accept messages from Teyra domains
    if (event.origin !== 'https://teyra.app' && event.origin !== 'https://www.teyra.app') {
      console.log('Rejected message from invalid origin:', event.origin);
      return;
    }

    // Check if it's a user sign-in message
    if (event.data && event.data.type === 'TEYRA_USER_SIGNIN' && event.data.source === 'teyra-webapp') {
      console.log('✅ Received user sign-in from main app:', event.data.user);
      console.log('✅ Received tasks from main app:', event.data.tasks);

      // Send to background script with proper error handling
      try {
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'userSignedIn',
            user: event.data.user,
            tasks: event.data.tasks || []
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.log('Extension context invalidated, this is normal during development:', chrome.runtime.lastError.message);
            } else {
              console.log('✅ Message sent to background script successfully');
            }
          });
        } else {
          console.log('Chrome runtime not available, extension may need to be reloaded');
        }
      } catch (error) {
        if (error.message.includes('Extension context invalidated')) {
          console.log('Extension context invalidated - this happens when extension is reloaded. Please refresh the page.');
        } else {
          console.error('Error sending to background:', error);
        }
      }
    }
  });

  console.log('🔗 Teyra bridge listener active on:', window.location.hostname);

  // Make it globally accessible for debugging
  window.teyraListener = true;
})();