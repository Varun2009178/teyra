// Bridge Listener - Listens for messages from the main Teyra app

(function() {
  'use strict';

  // Listen for messages from the main Teyra app
  window.addEventListener('message', function(event) {
    console.log('Bridge listener received message:', event.data, 'from origin:', event.origin);

    // Only accept messages from Teyra domains
    if (event.origin !== 'https://teyra.app' && event.origin !== 'http://localhost:3000') {
      console.log('Rejected message from invalid origin:', event.origin);
      return;
    }

    // Check if it's a user sign-in message
    if (event.data && event.data.type === 'TEYRA_USER_SIGNIN' && event.data.source === 'teyra-webapp') {
      console.log('✅ Received user sign-in from main app:', event.data.user);

      // Send to background script
      chrome.runtime.sendMessage({
        action: 'userSignedIn',
        user: event.data.user
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error sending to background:', chrome.runtime.lastError);
        } else {
          console.log('✅ Message sent to background script');
        }
      });
    }
  });

  console.log('Teyra bridge listener active on:', window.location.hostname);
})();