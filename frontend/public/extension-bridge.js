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

  // Get full user data from Teyra's API
  async function getFullUserData(clerkUser) {
    try {
      // First try to get user data from your API
      const response = await fetch('/api/user/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: clerkUser.id })
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('Got full user data from API:', userData);
        return {
          id: userData.id || clerkUser.id,
          email: userData.email || clerkUser.primaryEmailAddress?.emailAddress || clerkUser.email,
          name: userData.name || clerkUser.fullName || (clerkUser.firstName + ' ' + clerkUser.lastName),
          image: userData.image || clerkUser.imageUrl,
          clerk_id: clerkUser.id
        };
      } else {
        console.log('API call failed, using Clerk data only');
        return {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.email,
          name: clerkUser.fullName || (clerkUser.firstName + ' ' + clerkUser.lastName),
          image: clerkUser.imageUrl,
          clerk_id: clerkUser.id
        };
      }
    } catch (error) {
      console.log('Error getting full user data, using Clerk data:', error);
      return {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.email,
        name: clerkUser.fullName || (clerkUser.firstName + ' ' + clerkUser.lastName),
        image: clerkUser.imageUrl,
        clerk_id: clerkUser.id
      };
    }
  }

  // Send user data AND tasks to extension after sign in
  async function syncUserToExtension(clerkUser) {
    try {
      // Get full user data from Supabase via API
      const fullUserData = await getFullUserData(clerkUser);

      // Also get user's tasks
      const tasksData = await getUserTasks();

      // Try to send message to any listening extension
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        // Post message to all extensions that might be listening
        window.postMessage({
          type: 'TEYRA_USER_SIGNIN',
          source: 'teyra-webapp',
          user: fullUserData,
          tasks: tasksData
        }, '*');

        console.log('Full user data and tasks posted for extension:', { user: fullUserData, tasks: tasksData });
      }
    } catch (error) {
      console.log('Extension not available or error syncing:', error);
    }
  }

  // Get user's tasks from the current page
  async function getUserTasks() {
    try {
      // Try to get tasks from the API
      const response = await fetch('/api/tasks', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const tasks = await response.json();
        console.log('Got user tasks from API:', tasks);
        return tasks;
      } else {
        console.log('Failed to get tasks from API');
        return [];
      }
    } catch (error) {
      console.log('Error getting tasks:', error);
      return [];
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
    syncUser: syncUserToExtension
  };
})();