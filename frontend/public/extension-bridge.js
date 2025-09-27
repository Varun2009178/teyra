// Extension Bridge - Communicates between main app and Chrome extension

console.log('🌵 Teyra Extension Bridge loaded!');

(function() {
  let extensionId = null;

  // Find the extension ID by trying to connect
  async function findExtensionId() {
    // Common extension ID patterns or we'll detect it
    const possibleIds = [
      'teyra-productivity-extension',
      chrome.runtime?.id // If we're running in extension context
    ].filter(Boolean);

    // If we can't find it via common IDs, we'll let the extension announce itself
    return null;
  }

  // Send user data to extension after sign in
  async function syncUserToExtension(user) {
    try {
      // Try to send message to any listening extension
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        // Post message to all extensions that might be listening
        window.postMessage({
          type: 'TEYRA_USER_SIGNIN',
          source: 'teyra-webapp',
          user: {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress || user.email,
            name: user.fullName || user.firstName + ' ' + user.lastName,
            image: user.imageUrl
          }
        }, '*');

        console.log('User data posted for extension');
      }
    } catch (error) {
      console.log('Extension not available or error syncing:', error);
    }
  }

  // Listen for user sign in events
  function watchForSignIn() {
    // Method 1: Watch for URL changes that indicate sign in
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('extension') === 'true') {
      console.log('User came from extension, checking for existing session...');

      // Check for user data immediately and every second
      const checkUser = setInterval(() => {
        // Check for Clerk user
        if (window.Clerk && window.Clerk.user) {
          console.log('Found existing Clerk user:', window.Clerk.user);
          syncUserToExtension(window.Clerk.user);
          clearInterval(checkUser);

          // Show success message and redirect
          document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; background: #1a1a1a; color: white;">
              <div style="font-size: 48px; margin-bottom: 20px;">🌵</div>
              <h1 style="font-size: 24px; margin-bottom: 10px;">Success!</h1>
              <p style="font-size: 16px; opacity: 0.8; margin-bottom: 30px;">Extension connected to your account</p>
              <div style="font-size: 14px; opacity: 0.6;">You can close this tab and use the extension</div>
            </div>
          `;

          return;
        }

        // Check for other auth systems (like session storage, cookies, etc.)
        const userSession = localStorage.getItem('clerk-user') || sessionStorage.getItem('user');
        if (userSession) {
          try {
            const user = JSON.parse(userSession);
            if (user && user.id) {
              console.log('Found user in storage:', user);
              syncUserToExtension(user);
              clearInterval(checkUser);
              return;
            }
          } catch (e) {
            // Not valid JSON, continue checking
          }
        }
      }, 500); // Check every 500ms

      // Stop checking after 30 seconds
      setTimeout(() => {
        clearInterval(checkUser);
        console.log('Stopped checking for user after 30 seconds');
      }, 30000);
    }

    // Method 2: Listen for Clerk events
    if (window.Clerk) {
      window.Clerk.addListener('user', (user) => {
        if (user) {
          console.log('Clerk user event:', user);
          syncUserToExtension(user);
        }
      });
    }

    // Method 3: Check for existing user on any page load (not just from extension)
    setTimeout(() => {
      console.log('Checking for existing user...');
      console.log('window.Clerk:', window.Clerk);
      console.log('window.Clerk.user:', window.Clerk?.user);

      if (window.Clerk && window.Clerk.user) {
        console.log('Found existing user on page load');
        syncUserToExtension(window.Clerk.user);
      } else {
        console.log('No existing user found');
      }
    }, 2000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForSignIn);
  } else {
    watchForSignIn();
  }

  // Expose to global scope for manual use
  window.teyraExtensionBridge = {
    syncUser: syncUserToExtension,
    checkExtension: checkExtensionInstalled
  };
})();