// Utility to trigger Gen Z notifications from Chrome extension or API
export async function triggerGenZNotification(message?: string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Send message to service worker to trigger notification
    if (registration.active) {
      registration.active.postMessage({
        type: 'TRIGGER_NOTIFICATION',
        message: message
      });
    }
  } catch (error) {
    console.error('Failed to trigger notification:', error);
  }
}

// Check if user is on social media (to be called from Chrome extension)
export function isSocialMediaSite(url: string): boolean {
  const socialMediaDomains = [
    'youtube.com',
    'youtu.be',
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'reddit.com',
    'snapchat.com',
    'pinterest.com',
    'linkedin.com', // Sometimes distracting
    'discord.com'
  ];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return socialMediaDomains.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

