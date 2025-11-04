# Integration Guide - Unified XP System & New Homepage

## ✅ What's Been Created

### 1. **Unified XP System** (`/chrome-extension/XP_SYSTEM_UNIFIED.md`)
- Single XP system for both website and extension
- Task completion: +10 XP
- Sustainable task: +20 XP
- Distraction-free Pomodoro: +30 XP

### 2. **XP Award API** (`/frontend/src/app/api/user/mike-xp/award/route.ts`)
- POST endpoint to award XP from any source
- Handles level-up logic automatically
- Returns: current XP, level, whether user leveled up

### 3. **New Homepage** (`/frontend/src/app/page-new.tsx`)
- Chrome extension-focused design
- Clear CTA to install extension
- Feature showcase
- Modern, animated UI with Framer Motion

## 🚀 Next Steps to Complete Integration

### Step 1: Replace Current Homepage

```bash
# Backup old homepage
mv src/app/page.tsx src/app/page-old.tsx

# Use new homepage
mv src/app/page-new.tsx src/app/page.tsx
```

### Step 2: Update Dashboard to Award XP

**File:** `src/app/dashboard/page.tsx`

Find the task toggle function and add XP award:

```typescript
const toggleTask = async (taskId: number) => {
  // ... existing toggle logic ...

  if (newCompletedStatus) {
    // Task was completed - award XP!
    const taskType = task.title.includes('[ECO]') ? 'sustainable' : 'regular';
    const xpAmount = taskType === 'sustainable' ? 20 : 10;

    // Award XP via API
    try {
      const response = await fetch('/api/user/mike-xp/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xp: xpAmount,
          source: taskType === 'sustainable' ? 'sustainable_task' : 'task_completion'
        })
      });

      const result = await response.json();

      if (result.leveledUp) {
        // Show level up animation!
        console.log(`🎉 Level Up! You're now level ${result.level}!`);
        // TODO: Add celebration UI
      }
    } catch (error) {
      console.error('Failed to award XP:', error);
    }
  }
};
```

### Step 3: Display Mike Level in Dashboard

Add this to show Mike's level and XP progress:

```typescript
const [mikeData, setMikeData] = useState({ xp: 0, level: 1, xpForNext: 100 });

useEffect(() => {
  // Fetch Mike XP on mount
  const fetchMikeXP = async () => {
    try {
      const response = await fetch('/api/user/mike-xp');
      const data = await response.json();
      setMikeData(data);
    } catch (error) {
      console.error('Failed to fetch Mike XP:', error);
    }
  };

  fetchMikeXP();
}, []);

// Add to UI
<div className="bg-white rounded-lg p-4 shadow">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-gray-700">Mike Level {mikeData.level}</span>
    <span className="text-xs text-gray-500">{mikeData.xp} / {mikeData.xpForNext} XP</span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
      style={{ width: `${(mikeData.xp / mikeData.xpForNext) * 100}%` }}
    />
  </div>
</div>
```

### Step 4: Add XP Gain Animation

Create a reusable XP animation component:

```typescript
// components/XPGainAnimation.tsx
export function XPGainAnimation({ amount, onComplete }: { amount: number, onComplete?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: -50, scale: 1.2 }}
      exit={{ opacity: 0, y: -80 }}
      transition={{ duration: 1 }}
      onAnimationComplete={onComplete}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-2xl px-6 py-3 rounded-full shadow-2xl">
        +{amount} XP
      </div>
    </motion.div>
  );
}
```

### Step 5: Sync Extension with Website XP

The extension already syncs to `user_progress` table, so it will automatically show the same XP/level!

**Just ensure the extension loads Mike XP on startup:**

Extension `popup.js` already has `loadMikeXP()` which:
1. Loads from Chrome storage (per user)
2. Syncs to backend via `/api/user/mike-xp` POST

## 📊 XP Sources Summary

| Action | XP Gained | Where |
|--------|-----------|-------|
| Complete regular task | +10 XP | Website Dashboard |
| Complete sustainable task | +20 XP | Website Dashboard |
| Distraction-free Pomodoro | +30 XP | Chrome Extension |
| (Future) Daily streak | +50 XP | Both |
| (Future) Achievement unlocked | +100 XP | Both |

## 🎨 Mike Mood Logic

You can use level OR recent performance:

**Option 1: Based on Level**
- Level 1-2: Sad Mike 😢
- Level 3-5: Neutral Mike 😐
- Level 6+: Happy Mike 😊

**Option 2: Based on Recent Completion Rate**
- 0-69% tasks completed: Sad
- 70-89%: Neutral
- 90-100%: Happy

## 🧪 Testing Checklist

### Test XP Award API
```bash
curl -X POST http://localhost:3000/api/user/mike-xp/award \
  -H "Content-Type: application/json" \
  -d '{"xp": 10, "source": "task_completion"}'
```

Expected response:
```json
{
  "success": true,
  "xp": 10,
  "level": 1,
  "xpForNext": 100,
  "leveledUp": false,
  "levelsGained": 0,
  "xpGained": 10,
  "source": "task_completion"
}
```

### Test Level Up
Award 100 XP at once:
```json
{"xp": 100, "source": "test"}
```

Should return `leveledUp: true, level: 2`

### Test Dashboard Integration
1. Complete a task
2. Check console for XP award call
3. Verify Mike level updates
4. Check Supabase `user_progress` table

### Test Extension Sync
1. Complete distraction-free Pomodoro in extension (+30 XP)
2. Refresh dashboard
3. Should see Mike level updated
4. XP should match across both

## 📁 Files Created/Modified

### Created:
- ✅ `/chrome-extension/XP_SYSTEM_UNIFIED.md` - System design doc
- ✅ `/frontend/src/app/api/user/mike-xp/award/route.ts` - XP award endpoint
- ✅ `/frontend/src/app/page-new.tsx` - New extension-focused homepage
- ✅ `/frontend/INTEGRATION_GUIDE.md` - This guide

### Need to Modify:
- ⏳ `/frontend/src/app/page.tsx` - Replace with new homepage
- ⏳ `/frontend/src/app/dashboard/page.tsx` - Add XP award on task complete
- ⏳ `/frontend/src/app/dashboard/page.tsx` - Display Mike level/XP

### Already Good:
- ✅ Extension already syncs XP via `/api/user/mike-xp` POST
- ✅ Database schema has Mike XP columns
- ✅ Extension awards 30 XP for Pomodoro

## 🚢 Deployment Checklist

1. **Database**
   ```sql
   -- Already done! These columns exist:
   ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_xp INTEGER DEFAULT 0;
   ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_level INTEGER DEFAULT 1;
   ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_xp_for_next_level INTEGER DEFAULT 100;
   ```

2. **Replace Homepage**
   ```bash
   mv src/app/page.tsx src/app/page-old.tsx
   mv src/app/page-new.tsx src/app/page.tsx
   ```

3. **Update Dashboard** (see Step 2 above)

4. **Deploy to Production**
   - Push to git
   - Vercel will auto-deploy
   - Extension will automatically use new API

5. **Test in Production**
   - Install extension
   - Complete tasks on dashboard
   - Complete Pomodoro in extension
   - Verify XP syncs correctly

## 🎉 Done!

Now you have:
- ✅ Unified XP system (10/20/30 XP for different actions)
- ✅ Chrome extension-focused homepage
- ✅ XP award API endpoint
- ✅ Level up system across website and extension
- ✅ Mike grows with you everywhere! 🌵
