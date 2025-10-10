# Mike XP System Setup

The Mike XP system rewards users for completing distraction-free Pomodoro focus sessions.

## Features

- **30 XP per distraction-free session**: Users earn 30 XP for completing a 25-minute Pomodoro session without visiting blocked sites
- **Progressive leveling**: Each level requires 50% more XP than the previous level (starting at 100 XP for level 2)
- **Distraction tracking**: Automatically detects if user visits social media, entertainment, or shopping sites during a focus session
- **Backend sync**: XP and level data syncs to the user's Supabase account
- **Animated feedback**: Shows XP gain animations (+30 XP) and level up celebrations with Mike's happy animation

## How It Works

### 1. Starting a Focus Session
When user toggles Focus Mode ON:
- Pomodoro timer starts (25 minutes)
- `pomodoroState.distractionFree` is set to `true`
- Background script starts tracking website visits
- `POMODORO_SESSION_STARTED` message sent to background

### 2. During the Session
If user visits a blocked site (social media, entertainment, shopping):
- Background script detects the visit via `handleWebsiteDetection()`
- Sets `pomodoroSession.distractionDetected = true`
- Sends `DISTRACTION_DETECTED` message to popup
- `pomodoroState.distractionFree` is set to `false`

### 3. Completing the Session
When the 25-minute timer completes:
- If `distractionFree === true`:
  - Award 30 XP via `awardSessionXP(30)`
  - Show special notification: "🎉 Distraction-Free Session Complete! +30 XP!"
  - Check for level up and show animation if needed
- If `distractionFree === false`:
  - Show regular completion notification (no XP)
- Sync XP data to backend via `/api/user/mike-xp`

### 4. Leveling System
- **Level 1 → 2**: 100 XP (4 sessions)
- **Level 2 → 3**: 150 XP (5 sessions)
- **Level 3 → 4**: 225 XP (8 sessions)
- **Level 4 → 5**: 337 XP (12 sessions)
- Each level multiplies required XP by 1.5

### 5. UI Updates
- Mike's status shows level: "Ready to focus • Level 3"
- Mike's greeting updates based on focus streak percentage:
  - 80%+ distraction-free: "Level X - Focus Master! 🔥"
  - 50-79%: "Level X - Doing Great!"
  - <50%: "Level X - Keep Going!"

## Database Schema

Add these columns to your Supabase `user_progress` table:

```sql
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_xp INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_level INTEGER DEFAULT 1;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_xp_for_next_level INTEGER DEFAULT 100;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_total_sessions INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_distraction_free_sessions INTEGER DEFAULT 0;
```

## API Endpoint

### POST `/api/user/mike-xp`
Syncs Mike XP data to backend.

**Request Body:**
```json
{
  "xp": 30,
  "level": 2,
  "xpForNextLevel": 150,
  "totalSessions": 5,
  "distractionFreeSessions": 4
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated user record */ }
}
```

### GET `/api/user/mike-xp`
Fetches Mike XP data for the current user.

**Response:**
```json
{
  "xp": 30,
  "level": 2,
  "xpForNextLevel": 150,
  "totalSessions": 5,
  "distractionFreeSessions": 4
}
```

## Testing

1. **Test distraction-free session:**
   - Enable Focus Mode
   - Wait 25 minutes (or reduce timer for testing)
   - Don't visit any blocked sites
   - Should see "+30 XP!" notification and animation

2. **Test distracted session:**
   - Enable Focus Mode
   - Visit a social media site (e.g., facebook.com, twitter.com)
   - Wait for timer to complete
   - Should see regular completion notification (no XP)

3. **Test level up:**
   - Complete 4 distraction-free sessions (120 XP total)
   - Should see "Level Up!" animation and Mike happy mood
   - Mike's status should show "Level 2"

4. **Test backend sync:**
   - Complete a session with XP gain
   - Check Supabase `user_progress` table
   - Should see `mike_xp`, `mike_level`, etc. updated

## Local Storage

Mike XP data is stored locally in Chrome storage with key:
```
mike_xp_{userId}
```

**Data structure:**
```javascript
{
  currentXP: 30,
  level: 2,
  xpForNextLevel: 150,
  totalSessions: 5,
  distractionFreeSessions: 4
}
```

## Files Modified

### Extension Files
- `popup.js` - Added Mike XP state, tracking, and UI updates
- `background.js` - Added Pomodoro session tracking and distraction detection
- `popup.html` - No changes needed (uses existing Mike elements)
- `popup.css` - No changes needed (uses existing animations)

### Backend Files
- `frontend/src/app/api/user/mike-xp/route.ts` - New API endpoint for syncing XP data

## Future Enhancements

1. **XP multipliers**: 2x XP for completing all 4 sessions in a cycle
2. **Daily streaks**: Bonus XP for consecutive days of focus sessions
3. **Leaderboard**: Compare Mike levels with friends
4. **Achievements**: Unlock badges for milestones (e.g., "10 distraction-free sessions")
5. **Mike evolution**: Different Mike appearances at higher levels
