-- Add AI usage tracking columns to user_progress table
-- Run this in your Supabase SQL editor

-- Add daily_mood_checks column (for mood AI feature - 1 per day for free users)
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_mood_checks INTEGER DEFAULT 0;

-- Add daily_parses column (for AI task parsing feature - 2 per day for free users)
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS daily_parses INTEGER DEFAULT 0;

-- Add ai_schedule_uses column (for AI auto-scheduling feature - 3 per day for free users)
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS ai_schedule_uses INTEGER DEFAULT 0;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_progress'
  AND column_name IN ('daily_mood_checks', 'daily_parses', 'ai_schedule_uses')
ORDER BY column_name;

-- Success message
SELECT 'AI usage tracking columns added successfully! 🎉' as status;
