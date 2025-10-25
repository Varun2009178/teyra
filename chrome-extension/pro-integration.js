// ============================================
// PRO INTEGRATION - Add this to your popup.js
// ============================================

let isProUser = false;
let aiLimitData = { remaining: 0, limit: 5, isPro: false };

// Call this when popup loads (only if user is logged in!)
async function initializeProFeatures() {
  if (!currentUser) {
    console.log('No user logged in, skipping Pro feature initialization');
    return;
  }

  await checkProStatus();
  await updateAILimitDisplay();
  setupProUI();
}

// Check if user has Pro subscription
async function checkProStatus() {
  if (!currentUser) {
    console.log('No user logged in, skipping Pro check');
    isProUser = false;
    return false;
  }

  try {
    const response = await fetch('APP_URL_PLACEHOLDER/api/user/pro-status', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      isProUser = data.isPro || false;

      // Store Pro status locally (handle extension context invalidated)
      try {
        if (chrome && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({ teyra_is_pro: isProUser });
        }
      } catch (storageError) {
        console.warn('Could not store Pro status:', storageError.message);
      }

      console.log('Pro status:', isProUser ? 'PRO ⭐' : 'FREE');
      return isProUser;
    }
  } catch (error) {
    // Silently fail - user is not logged in or API unavailable
    isProUser = false;
  }

  return false;
}

// ============================================
// LOCAL AI LIMIT TRACKING - Works offline!
// ============================================

async function checkAILimit() {
  // Pro users get unlimited
  if (isProUser) {
    return true;
  }

  // Get or initialize AI usage data
  const aiData = await getAIUsageData();

  // Check if limit reached
  if (aiData.used >= aiData.limit) {
    showUpgradePrompt('Daily limit reached! You have used all 5 AI tasks today. Upgrade to Pro for unlimited AI tasks!');
    return false;
  }

  // Consume one use
  aiData.used++;
  await saveAIUsageData(aiData);
  await updateAILimitDisplay();

  return true;
}

async function getAIUsageData() {
  try {
    const result = await chrome.storage.local.get(['ai_usage_data']);
    const data = result.ai_usage_data;

    // Check if data exists and is from today
    if (data && isSameDay(new Date(data.resetDate), new Date())) {
      return data;
    }

    // Create new data for today
    return {
      used: 0,
      limit: 5,
      resetDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting AI usage:', error);
    return { used: 0, limit: 5, resetDate: new Date().toISOString() };
  }
}

async function saveAIUsageData(data) {
  try {
    await chrome.storage.local.set({ ai_usage_data: data });
  } catch (error) {
    console.error('Error saving AI usage:', error);
  }
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Update AI limit display
async function updateAILimitDisplay() {
  const limitText = document.getElementById('ai-limit-text');
  if (!limitText) return;

  if (!currentUser) {
    limitText.textContent = 'Sign in';
    limitText.style.color = '#9B9A97';
    return;
  }

  // Pro users get unlimited
  if (isProUser) {
    limitText.textContent = '∞ unlimited';
    limitText.style.color = '#8b5cf6';
    limitText.style.fontWeight = '600';
    return;
  }

  // Free users - show remaining
  const aiData = await getAIUsageData();
  const remaining = aiData.limit - aiData.used;

  limitText.textContent = `${remaining}/${aiData.limit}`;

  // Color coding
  if (remaining === 0) {
    limitText.style.color = '#E03E3E'; // Red
  } else if (remaining === 1) {
    limitText.style.color = '#D9730D'; // Orange
  } else {
    limitText.style.color = '#0F7B6C'; // Green
  }
  limitText.style.fontWeight = '500';
}

// Setup Pro UI elements
function setupProUI() {
  // Show Pro badge if user is Pro
  const proBanner = document.getElementById('pro-status-banner');
  const promoSection = document.getElementById('pro-upgrade-promo');

  if (proBanner) {
    if (isProUser) {
      proBanner.classList.remove('hidden');
      if (promoSection) promoSection.classList.add('hidden'); // Hide promo for Pro users
    } else {
      proBanner.classList.add('hidden');
      if (promoSection) promoSection.classList.remove('hidden'); // Show promo for free users
    }
  }

  // Pomodoro timer - Pro feature
  const pomodoroSection = document.getElementById('pomodoro-timer-section');
  const pomodoroLocked = document.getElementById('pomodoro-locked');

  if (isProUser) {
    if (pomodoroSection) pomodoroSection.classList.remove('hidden');
    if (pomodoroLocked) pomodoroLocked.classList.add('hidden');
  } else {
    if (pomodoroSection) pomodoroSection.classList.add('hidden');
    if (pomodoroLocked) pomodoroLocked.classList.remove('hidden');
  }

  // Unlimited AI tasks
  const unlimitedAiSection = document.getElementById('unlimited-ai-section');
  const unlimitedAiLocked = document.getElementById('unlimited-ai-locked');

  if (isProUser) {
    if (unlimitedAiSection) unlimitedAiSection.classList.remove('hidden');
    if (unlimitedAiLocked) unlimitedAiLocked.classList.add('hidden');
  } else {
    if (unlimitedAiSection) unlimitedAiSection.classList.add('hidden');
    if (unlimitedAiLocked) unlimitedAiLocked.classList.remove('hidden');
  }

  // Custom site blocking
  const customSitesSection = document.getElementById('custom-sites-section');
  const customSitesLocked = document.getElementById('custom-sites-locked');

  if (isProUser) {
    if (customSitesSection) customSitesSection.classList.remove('hidden');
    if (customSitesLocked) customSitesLocked.classList.add('hidden');
  } else {
    if (customSitesSection) customSitesSection.classList.add('hidden');
    if (customSitesLocked) customSitesLocked.classList.remove('hidden');
  }

  // Show/hide custom sites Pro overlay
  const proOverlay = document.getElementById('pro-overlay-custom');
  const clearBtn = document.getElementById('clear-custom-sites-btn');

  if (isProUser) {
    // Pro user - hide overlay, enable clear button
    if (proOverlay) proOverlay.classList.add('hidden');
    if (clearBtn) clearBtn.classList.remove('disabled');
  } else {
    // Free user - show overlay, disable clear button
    if (proOverlay) proOverlay.classList.remove('hidden');
    if (clearBtn) clearBtn.classList.add('disabled');
  }

  // Setup upgrade buttons
  const upgradePomodoro = document.getElementById('upgrade-pomodoro-btn');
  if (upgradePomodoro) {
    upgradePomodoro.addEventListener('click', async () => {
      await initiateCheckout();
    });
  }

  const upgradeAi = document.getElementById('upgrade-ai-btn');
  if (upgradeAi) {
    upgradeAi.addEventListener('click', async () => {
      await initiateCheckout();
    });
  }

  const upgradeSites = document.getElementById('upgrade-sites-btn');
  if (upgradeSites) {
    upgradeSites.addEventListener('click', async () => {
      await initiateCheckout();
    });
  }

  const promoBtn = document.getElementById('upgrade-promo-btn');
  if (promoBtn) {
    promoBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await initiateCheckout();
    });
  }
}

// Initiate Stripe checkout - redirect to dashboard which will handle checkout
async function initiateCheckout() {
  try {
    console.log('🚀 Initiating Stripe checkout...');

    // Open dashboard with checkout param - the dashboard will handle creating the Stripe session
    // This avoids authentication issues from extension context
    const checkoutUrl = 'APP_URL_PLACEHOLDER/dashboard?action=checkout';

    chrome.tabs.create({ url: checkoutUrl });
    window.close();
  } catch (error) {
    console.error('❌ Error opening checkout:', error);

    // Show error message
    const errorToast = document.createElement('div');
    errorToast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(239,68,68,0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      z-index: 10001;
    `;
    errorToast.textContent = 'Failed to open checkout. Please try again.';
    document.body.appendChild(errorToast);

    setTimeout(() => {
      if (document.body.contains(errorToast)) {
        errorToast.remove();
      }
    }, 3000);
  }
}

// Show upgrade prompt
function showUpgradePrompt(message) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  modal.innerHTML = `
    <div style="
      background: #0a0a0a;
      border-radius: 16px;
      padding: 32px;
      max-width: 380px;
      width: 90%;
      border: 1px solid rgba(255,255,255,0.08);
    ">
      <div style="text-align: center; margin-bottom: 24px;">
        <h3 style="font-size: 24px; font-weight: 700; color: white; margin: 0 0 8px 0; letter-spacing: -0.5px;">
          teyra pro
        </h3>
        <p style="font-size: 13px; color: rgba(255,255,255,0.5); margin: 0;">
          ${message}
        </p>
      </div>

      <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 14px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="width: 20px; height: 20px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <div style="color: white; font-size: 14px; font-weight: 600; margin-bottom: 2px;">unlimited AI text → task</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">limited time only! (vs 5 per day free)</div>
          </div>
        </div>

        <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 14px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="width: 20px; height: 20px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <div style="color: white; font-size: 14px; font-weight: 600; margin-bottom: 2px;">focus mode customization</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">block any websites you choose</div>
          </div>
        </div>

        <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 14px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="width: 20px; height: 20px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <div style="color: white; font-size: 14px; font-weight: 600; margin-bottom: 2px;">pomodoro timer</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">built-in focus sessions</div>
          </div>
        </div>

        <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="width: 20px; height: 20px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <div style="color: white; font-size: 14px; font-weight: 600; margin-bottom: 2px;">priority support</div>
            <div style="color: rgba(255,255,255,0.5); font-size: 12px;">faster response times</div>
          </div>
        </div>
      </div>

      <button id="upgrade-now-btn" style="
        width: 100%;
        padding: 14px;
        background: white;
        color: black;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        margin-bottom: 10px;
        transition: all 0.2s ease;
      " onmouseover="this.style.background=&quot;rgba(255,255,255,0.9)&quot;" onmouseout="this.style.background=&quot;white&quot;">
        upgrade to pro — $10/month
      </button>
      <button id="cancel-btn" style="
        width: 100%;
        padding: 14px;
        background: transparent;
        color: rgba(255,255,255,0.4);
        border: none;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: color 0.2s ease;
      " onmouseover="this.style.color=&quot;rgba(255,255,255,0.7)&quot;" onmouseout="this.style.color=&quot;rgba(255,255,255,0.4)&quot;">
        maybe later
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  // Setup button handlers
  document.getElementById('upgrade-now-btn').addEventListener('click', async () => {
    await initiateCheckout();
    modal.remove();
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// USAGE IN YOUR EXISTING CODE:
// ============================================

// 1. Call this when popup loads (add to your DOMContentLoaded):
document.addEventListener('DOMContentLoaded', async function() {
  // ... your existing code ...
  await initializeProFeatures();
});

// 2. Before making AI request to Google Calendar, check limit:
// This is now integrated into your existing code - no need to call separately

// 3. For Focus Mode - Different blocked sites based on Pro status:
async function applyFocusModeBlocking() {
  const isPro = await checkProStatus();

  if (isPro) {
    // Pro users: Load custom blocked sites from storage
    const result = await chrome.storage.local.get(['custom_blocked_sites']);
    const customSites = result.custom_blocked_sites || [];

    console.log('Pro user - applying custom blocked sites:', customSites);
    // Apply custom blocks...
  } else {
    // Free users: Only default 5 sites
    const defaultSites = [
      '*://*.youtube.com/*',
      '*://*.twitter.com/*',
      '*://*.x.com/*',
      '*://*.linkedin.com/*',
      '*://*.instagram.com/*',
      '*://*.tiktok.com/*'
    ];

    console.log('Free user - applying default blocked sites');
    // Apply default blocks...
  }
}

// 4. Add to your existing showDashboard() function:
async function showDashboard() {
  // ... your existing code ...

  // Initialize Pro features
  await initializeProFeatures();

  // ... rest of your code ...
}

// Export functions if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkProStatus,
    checkAILimit,
    updateAILimitDisplay,
    setupProUI
  };
}
