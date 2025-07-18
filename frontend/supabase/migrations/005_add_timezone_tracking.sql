-- Add timezone and last activity tracking to user_stats table
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on last_activity_at for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_stats_last_activity ON user_stats(last_activity_at);

-- Create index on timezone for filtering
CREATE INDEX IF NOT EXISTS idx_user_stats_timezone ON user_stats(timezone); 