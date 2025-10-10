# Google Calendar OAuth Setup for Chrome Extension

## Current Status
- Extension ID: `mfpwoffeojhvcfwxnkbhpgjncpmelall` (from the key in manifest.json)
- Current OAuth Client ID: `492936812701-2rskrog5uemo7rvvki0jboqk37267bpc.apps.googleusercontent.com`

## Error
`bad client id` - This means the OAuth client isn't configured for Chrome extensions.

## Fix Steps

### Option 1: Update Existing OAuth Client (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth client: `492936812701-2rskrog5uemo7rvvki0jboqk37267bpc.apps.googleusercontent.com`
3. Click Edit
4. Add to **Authorized redirect URIs**:
   ```
   https://mfpwoffeojhvcfwxnkbhpgjncpmelall.chromiumapp.org/
   ```
   Note: The extension ID comes from the permanent key in manifest.json

### Option 2: Create New Chrome Extension OAuth Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "OAuth client ID"
3. Choose application type: **Chrome Extension** (if available) or **Web application**
4. For Chrome Extension type:
   - Enter Extension ID: `mfpwoffeojhvcfwxnkbhpgjncpmelall`
5. For Web application type:
   - Add authorized redirect URI: `https://mfpwoffeojhvcfwxnkbhpgjncpmelall.chromiumapp.org/`
6. Copy the new Client ID and update manifest.json

### Enable Required APIs
Make sure these are enabled in your Google Cloud project:
1. Google Calendar API
2. Google+ API (for identity)

## Testing
After updating:
1. Rebuild the extension: `node build-extension.js`
2. Reload the extension in Chrome
3. Test calendar integration with text like: "finish document before 9 PM tomorrow"
