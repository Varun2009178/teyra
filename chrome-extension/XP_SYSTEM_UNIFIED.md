# Unified XP System - Website + Extension

## 🔄 Current Problem

**Website uses POINTS system:**
- Regular task completion = +10 points
- Sustainable task completion = +20 points
- Stored in `user_progress` table (no XP columns currently)

**Extension uses XP system:**
- Distraction-free Pomodoro session = +30 XP
- Stored in `user_progress` table with Mike XP columns

## ✅ Solution: Unify as Single XP System

### Unified XP Awards:
- ✅ Complete any task = **+10 XP**
- ✅ Complete distraction-free Pomodoro = **+30 XP**
- ✅ Complete sustainable/eco task = **+20 XP** (website feature)

### Single Source of Truth:
Use the Mike XP columns in `user_progress` table for EVERYTHING:
- `mike_xp` - Current XP within level
- `mike_level` - Current Mike level
- `mike_xp_for_next_level` - XP needed for next level
- `mike_total_sessions` - Total Pomodoro sessions (extension only)
- `mike_distraction_free_sessions` - Distraction-free sessions (extension only)

### Implementation Changes Needed:

#### 1. Website Dashboard (`frontend/src/app/dashboard/page.tsx`)
**Current:** Calculates points separately (10 for regular, 20 for sustainable)
**Change to:** Award XP to Mike system when tasks complete

```typescript
// When user completes a task
const awardTaskXP = async (taskType: 'regular' | 'sustainable') => {
  const xpAmount = taskType === 'sustainable' ? 20 : 10;

  // Update Mike XP
  await fetch('/api/user/mike-xp/award', {
    method: 'POST',
    body: JSON.stringify({ xp: xpAmount, source: 'task_completion' })
  });
};
```

#### 2. Extension Popup (`popup.js`)
**Current:** Awards 30 XP for distraction-free Pomodoro
**No change needed** - already uses Mike XP system

#### 3. Create New API Endpoint
**File:** `frontend/src/app/api/user/mike-xp/award/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { xp, source } = await req.json() // source: 'task_completion' | 'pomodoro' | 'sustainable_task'

  // Get current XP data
  const { data: progress } = await supabase
    .from('user_progress')
    .select('mike_xp, mike_level, mike_xp_for_next_level')
    .eq('user_id', userId)
    .single()

  let currentXP = (progress?.mike_xp || 0) + xp
  let level = progress?.mike_level || 1
  let xpForNext = progress?.mike_xp_for_next_level || 100
  let leveledUp = false

  // Check for level up
  while (currentXP >= xpForNext) {
    level++
    currentXP -= xpForNext
    xpForNext = Math.floor(xpForNext * 1.5)
    leveledUp = true
  }

  // Update database
  await supabase
    .from('user_progress')
    .update({
      mike_xp: currentXP,
      mike_level: level,
      mike_xp_for_next_level: xpForNext,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  return NextResponse.json({
    success: true,
    xp: currentXP,
    level,
    xpForNext,
    leveledUp,
    xpGained: xp
  })
}
```

## 📊 Unified Leveling System

### XP Progression (same for website and extension):
- **Level 1 → 2**: 100 XP
  - 10 tasks OR 3-4 Pomodoro sessions
- **Level 2 → 3**: 150 XP
  - 15 tasks OR 5 Pomodoro sessions
- **Level 3 → 4**: 225 XP
  - 22 tasks OR 7-8 Pomodoro sessions
- **Level 4 → 5**: 337 XP
  - 33 tasks OR 11 Pomodoro sessions

### UI Display (Both Website and Extension):
- Show **Mike's Level** prominently
- Show **XP progress bar** (X / Y XP to next level)
- Show **XP gain animations** (+10 XP, +20 XP, +30 XP)
- Show **Level Up celebration** when leveling up

## 🎨 Mike's Mood System

### Mike's appearance changes based on LEVEL (not points):
- **Level 1-2**: Sad Mike (😢) - Just starting out
- **Level 3-5**: Neutral Mike (😐) - Making progress
- **Level 6+**: Happy Mike (😊) - Crushing it!

### Or keep it based on recent performance:
- **0-69% tasks completed recently**: Sad Mike
- **70-89% tasks completed**: Neutral Mike
- **90-100% tasks completed**: Happy Mike

## 🚀 Migration Steps

### 1. Database (Already Done ✅)
```sql
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_xp INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_level INTEGER DEFAULT 1;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_xp_for_next_level INTEGER DEFAULT 100;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_total_sessions INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mike_distraction_free_sessions INTEGER DEFAULT 0;
```

### 2. Create Award API Endpoint
- Create `frontend/src/app/api/user/mike-xp/award/route.ts`
- Handles XP awards from any source (tasks, Pomodoro, etc.)

### 3. Update Dashboard
- Replace points calculation with Mike XP
- Call `/api/user/mike-xp/award` when tasks complete
- Show Mike level and XP progress

### 4. Update Extension (Already Done ✅)
- Extension already awards 30 XP for Pomodoro
- Extension already syncs to `user_progress` table
- No changes needed

## 📝 Benefits of Unified System

1. **Consistency**: Same XP = Same rewards everywhere
2. **Motivation**: Users see Mike level up across website and extension
3. **Simplicity**: One system, one source of truth
4. **Flexibility**: Easy to add new XP sources (streaks, achievements, etc.)

## 🎯 Example User Journey

1. **Morning**: User completes 5 tasks on website → Gains 50 XP → Mike Level 1 (50/100 XP)
2. **Afternoon**: User does 2 Pomodoro sessions in extension → Gains 60 XP → Mike Level 2! (10/150 XP)
3. **Evening**: User completes 3 sustainable tasks on website → Gains 60 XP → Mike Level 2 (70/150 XP)

Both website and extension show **Mike Level 2** and **70/150 XP progress**!
