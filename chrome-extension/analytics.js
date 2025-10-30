// Google Analytics for Chrome Extension
// Tracking ID: G-GH3FC37X57

const MEASUREMENT_ID = 'G-GH3FC37X57';

// Get or create a client ID
async function getClientId() {
  const result = await chrome.storage.local.get(['clientId']);
  if (result.clientId) {
    return result.clientId;
  }

  // Generate a new client ID
  const clientId = self.crypto.randomUUID();
  await chrome.storage.local.set({ clientId });
  return clientId;
}

// Track events using gtag (Google's recommended method for extensions)
async function trackEvent(eventName, eventParams = {}) {
  try {
    const clientId = await getClientId();

    // Use the standard gtag endpoint (no API secret needed for client-side)
    const params = new URLSearchParams({
      v: '2',
      tid: MEASUREMENT_ID,
      cid: clientId,
      en: eventName,
      ...eventParams
    });

    await fetch(`https://www.google-analytics.com/g/collect?${params.toString()}`, {
      method: 'POST',
      mode: 'no-cors'
    });

    console.log('Analytics event tracked:', eventName);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Track page views
async function trackPageView(pagePath, pageTitle) {
  await trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle
  });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { trackEvent, trackPageView };
}
