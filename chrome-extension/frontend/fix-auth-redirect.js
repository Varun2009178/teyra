// Run this in your browser console to clear onboarding state
console.log('Clearing all onboarding states...');

// Get all localStorage keys
for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.includes('onboarded_')) {
        console.log('Removing:', key);
        localStorage.removeItem(key);
    }
}

// Also clear sessionStorage
for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key && key.includes('onboarded_')) {
        console.log('Removing from session:', key);
        sessionStorage.removeItem(key);
    }
}

console.log('✅ Cleared all onboarding states. Refresh the page.');