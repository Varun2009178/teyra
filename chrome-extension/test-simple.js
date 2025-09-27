// Simple test content script
console.log('SIMPLE TEST SCRIPT LOADED');

// Test extension icon click
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('SIMPLE TEST: Message received:', request);

  if (request.action === 'test') {
    // Create a simple red box to verify it's working
    const testDiv = document.createElement('div');
    testDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 200px;
      height: 100px;
      background: red;
      color: white;
      z-index: 999999;
      padding: 20px;
      border-radius: 10px;
    `;
    testDiv.textContent = 'TEYRA TEST WORKING!';
    document.body.appendChild(testDiv);

    console.log('SIMPLE TEST: Red box added');
  }
});