# Chrome Extension Pro Integration Guide

## 🎯 Free vs Pro Features

### Free Users Get:
- ❌ **No Pomodoro Timer**
- ⚠️ **5 AI → Google Calendar tasks per day**
- ⚠️ **Basic Focus Mode** - Only blocks: YouTube, Twitter, LinkedIn, Instagram, TikTok (cannot customize)

### Pro Users Get ($10/month):
- ✅ **Pomodoro Timer**
- ✅ **Unlimited AI → Google Calendar tasks**
- ✅ **Custom Focus Mode** - Block any websites you want

## 📡 API Integration

### 1. Check Pro Status

```javascript
// Check if user has Pro subscription
async function checkProStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/user/pro-status', {
      headers: {
        'Authorization': `Bearer ${userToken}` // Get from Clerk
      }
    });

    const data = await response.json();
    return data.isPro;
  } catch (error) {
    console.error('Error checking Pro status:', error);
    return false;
  }
}
```

### 2. AI Request Rate Limiting

```javascript
// Before making AI request - Check and consume limit
async function canMakeAIRequest() {
  try {
    const response = await fetch('http://localhost:3000/api/extension/ai-limit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const data = await response.json();

    if (!data.allowed) {
      // Show upgrade prompt
      alert(data.message || 'Daily limit reached. Upgrade to Pro!');
      return false;
    }

    if (data.isPro) {
      console.log('✅ Pro user - unlimited access');
    } else {
      console.log(`✅ Request allowed. ${data.remaining} remaining today`);
    }

    return true;
  } catch (error) {
    console.error('Error checking AI limit:', error);
    return false;
  }
}

// Example usage
async function handleAITaskCreation(taskText) {
  // Check if user can make request
  const canProceed = await canMakeAIRequest();

  if (!canProceed) {
    return; // Show upgrade prompt
  }

  // Make AI request
  const result = await createTaskFromAI(taskText);
  return result;
}
```

### 3. Check Remaining Requests (without consuming)

```javascript
// Get remaining requests without using one
async function getRemainingRequests() {
  try {
    const response = await fetch('http://localhost:3000/api/extension/ai-limit', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const data = await response.json();

    if (data.isPro) {
      return { isPro: true, remaining: 'unlimited' };
    }

    return {
      isPro: false,
      remaining: data.remaining,
      used: data.used,
      limit: data.limit
    };
  } catch (error) {
    console.error('Error getting remaining requests:', error);
    return { remaining: 0 };
  }
}

// Show in popup
async function updatePopupUI() {
  const stats = await getRemainingRequests();

  if (stats.isPro) {
    document.getElementById('limit-text').textContent = '∞ Unlimited (Pro)';
  } else {
    document.getElementById('limit-text').textContent =
      `${stats.remaining}/${stats.limit} AI requests remaining today`;
  }
}
```

## 🍅 Pomodoro Timer (Pro Only)

```javascript
// In your extension popup.js or background.js
async function showPomodoroTimer() {
  const isPro = await checkProStatus();

  if (!isPro) {
    // Show upgrade prompt
    document.getElementById('pomodoro-section').innerHTML = `
      <div class="pro-feature-locked">
        <div class="lock-icon">🔒</div>
        <h3>Pomodoro Timer - Pro Feature</h3>
        <p>Upgrade to Teyra Pro to access the Pomodoro Timer</p>
        <button onclick="window.open('http://localhost:3000/dashboard')">
          Upgrade to Pro - $10/month
        </button>
      </div>
    `;
    return;
  }

  // Show pomodoro timer for Pro users
  document.getElementById('pomodoro-section').innerHTML = `
    <div class="pomodoro-timer">
      <h3>🍅 Pomodoro Timer</h3>
      <div id="timer-display">25:00</div>
      <button id="start-timer">Start</button>
      <button id="pause-timer">Pause</button>
      <button id="reset-timer">Reset</button>
    </div>
  `;

  // Initialize timer functionality
  initializePomodoroTimer();
}
```

## 🚫 Focus Mode - Website Blocking

```javascript
// Default blocked sites for FREE users
const FREE_BLOCKED_SITES = [
  '*://*.youtube.com/*',
  '*://*.twitter.com/*',
  '*://*.x.com/*',
  '*://*.linkedin.com/*',
  '*://*.instagram.com/*',
  '*://*.tiktok.com/*'
];

async function setupFocusMode() {
  const isPro = await checkProStatus();

  if (isPro) {
    // Pro users can customize blocked sites
    document.getElementById('focus-mode').innerHTML = `
      <h3>Enhanced Focus Mode (Pro)</h3>
      <p>Block custom websites:</p>
      <input type="text" id="custom-site" placeholder="Enter website URL">
      <button id="add-site">Add to Block List</button>
      <div id="blocked-sites-list"></div>
    `;

    // Load user's custom blocked sites
    const customSites = await loadCustomBlockedSites();
    displayBlockedSites(customSites);

  } else {
    // Free users see locked feature
    document.getElementById('focus-mode').innerHTML = `
      <h3>Basic Focus Mode</h3>
      <p>Blocking these sites:</p>
      <ul>
        <li>YouTube</li>
        <li>Twitter</li>
        <li>LinkedIn</li>
        <li>Instagram</li>
        <li>TikTok</li>
      </ul>
      <div class="upgrade-prompt">
        <p>🔒 Want to block custom websites?</p>
        <button onclick="window.open('http://localhost:3000/dashboard')">
          Upgrade to Pro - $10/month
        </button>
      </div>
    `;

    // Apply default blocks
    applyWebsiteBlocks(FREE_BLOCKED_SITES);
  }
}

// Block websites using chrome.declarativeNetRequest
function applyWebsiteBlocks(urls) {
  const rules = urls.map((url, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: 'block' },
    condition: { urlFilter: url }
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(r => r.id),
    addRules: rules
  });
}
```

## 🎨 UI Examples

### Popup HTML with Pro Indicators

```html
<!-- popup.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    .pro-badge {
      background: linear-gradient(to right, #3b82f6, #06b6d4);
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      margin-left: 8px;
    }

    .pro-feature-locked {
      text-align: center;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .lock-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .upgrade-button {
      background: white;
      color: black;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
    }

    .upgrade-button:hover {
      background: linear-gradient(to right, #3b82f6, #06b6d4);
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Teyra <span id="pro-badge"></span></h2>

    <!-- AI Limit Display -->
    <div id="ai-limit-section">
      <p id="limit-text">Loading...</p>
    </div>

    <!-- Pomodoro Timer Section -->
    <div id="pomodoro-section">
      <!-- Dynamically filled based on Pro status -->
    </div>

    <!-- Focus Mode Section -->
    <div id="focus-mode">
      <!-- Dynamically filled based on Pro status -->
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

### Popup.js Initialization

```javascript
// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const isPro = await checkProStatus();

  // Show Pro badge if user is Pro
  if (isPro) {
    document.getElementById('pro-badge').innerHTML =
      '<span class="pro-badge">PRO</span>';
  }

  // Update AI limit display
  await updatePopupUI();

  // Setup Pomodoro Timer (Pro only)
  await showPomodoroTimer();

  // Setup Focus Mode
  await setupFocusMode();
});
```

## 🧪 Testing

### Test as Free User:
1. Don't subscribe to Pro
2. Try AI feature 5 times → Should hit limit on 6th
3. Pomodoro Timer → Should show upgrade prompt
4. Focus Mode → Should only block default 5 sites

### Test as Pro User:
1. Subscribe using test card `4242 4242 4242 4242`
2. AI feature → Should be unlimited
3. Pomodoro Timer → Should work
4. Focus Mode → Should allow custom sites

## 📋 Implementation Checklist

- [ ] Run SQL to create `ai_request_log` table in Supabase
- [ ] Add Pro status check to extension popup
- [ ] Implement AI rate limiting with `/api/extension/ai-limit`
- [ ] Show/hide Pomodoro Timer based on Pro status
- [ ] Implement basic Focus Mode (5 default sites)
- [ ] Implement enhanced Focus Mode for Pro (custom sites)
- [ ] Add upgrade prompts for locked features
- [ ] Test with free and Pro accounts
- [ ] Update manifest.json permissions if needed

## 🚀 Next Steps

1. Run the SQL for `ai_request_log` table
2. Update your extension's background.js/popup.js with the code above
3. Test the flow end-to-end
4. Deploy and celebrate! 🎉
