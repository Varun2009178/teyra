# Get Chrome Extension Redirect URI

## What you need to do:

1. **Rebuild and reload the extension**:
   ```bash
   node build-extension.js
   ```
   Then reload in chrome://extensions

2. **Get the redirect URI**:
   - Open Chrome DevTools (F12)
   - Go to Console tab
   - Run this command:
   ```javascript
   chrome.identity.getRedirectURL()
   ```
   - It will output something like: `https://abcdefghijklmnop.chromiumapp.org/`
   - Copy this exact URL

3. **Update Google Cloud Console**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click on "Teyra Chrome Extension" OAuth client
   - Under "Authorized redirect URIs", **REPLACE** the existing URIs with the one you just copied
   - Save

4. **Wait 2-3 minutes** for Google's changes to propagate

5. **Test the calendar integration** again

## Why this change?
The `oauth2` config in manifest.json only works for published Chrome Web Store extensions. For unpublished/development extensions, we need to use `launchWebAuthFlow` which uses a different redirect URI format.
