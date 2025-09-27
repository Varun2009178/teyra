// Bridge Listener - Listens for messages from the main Teyra app

(function() {
  'use strict';

  // Listen for messages from the main Teyra app
  window.addEventListener('message', function(event) {
    console.log('Bridge listener received message:', event.data, 'from origin:', event.origin);

    // Only accept messages from Teyra domains
    if (event.origin !== 'https://teyra.app' && event.origin !== 'https://www.teyra.app' && event.origin !== 'http://localhost:3000') {
      console.log('Rejected message from invalid origin:', event.origin);
      return;
    }

    // Check if it's a user sign-in message
    if (event.data && event.data.type === 'TEYRA_USER_SIGNIN' && event.data.source === 'teyra-webapp') {
      console.log('✅ Received user sign-in from main app:', event.data.user);
      console.log('✅ Received tasks from main app:', event.data.tasks);

      // Send to background script (no callback to avoid port closure issues)
      try {
        chrome.runtime.sendMessage({
          action: 'userSignedIn',
          user: event.data.user,
          tasks: event.data.tasks || []
        });
        console.log('✅ Message sent to background script');
      } catch (error) {
        console.error('Error sending to background:', error);
      }
    }
  });

  console.log('🔗 Teyra bridge listener active on:', window.location.hostname);

  // Make it globally accessible for debugging
  window.teyraListener = true;
})();