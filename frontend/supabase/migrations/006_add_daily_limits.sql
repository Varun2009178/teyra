-- Add daily limits tracking to user_stats table
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS mood_checkins_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_splits_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on last_daily_reset for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_stats_last_daily_reset ON user_stats(last_daily_reset); 