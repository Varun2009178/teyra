// Referral tracking system using cookies

const REFERRAL_COOKIE_NAME = 'teyra_ref';
const COOKIE_EXPIRY_DAYS = 30;

/**
 * Get referral code from URL and store in cookie
 * Call this on page load
 */
export function trackReferral() {
  if (typeof window === 'undefined') return;

  // Check if there's a ref parameter in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');

  if (refCode) {
    // Store referral code in cookie for 30 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);

    document.cookie = `${REFERRAL_COOKIE_NAME}=${refCode}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

    console.log(`📎 Referral tracked: ${refCode}`);
  }
}

/**
 * Get stored referral code from cookie
 * Call this when user signs up or upgrades
 */
export function getReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === REFERRAL_COOKIE_NAME) {
      return value;
    }
  }

  return null;
}

/**
 * Clear referral cookie after it's been used
 */
export function clearReferralCode() {
  if (typeof window === 'undefined') return;

  document.cookie = `${REFERRAL_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Generate a unique referral code for a user
 */
export function generateReferralCode(userId: string): string {
  // Create a simple referral code from user ID
  // You can make this more sophisticated if needed
  const hash = btoa(userId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
  return hash;
}

/**
 * Get referral link for a user
 */
export function getReferralLink(userId: string): string {
  const refCode = generateReferralCode(userId);
  return `${process.env.NEXT_PUBLIC_URL || 'https://teyra.app'}?ref=${refCode}`;
}
