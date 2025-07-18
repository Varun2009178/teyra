-- Add email and notifications_enabled fields to user_stats table
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT FALSE;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_stats_email ON user_stats(email);

-- Create index on notifications_enabled for filtering
CREATE INDEX IF NOT EXISTS idx_user_stats_notifications ON user_stats(notifications_enabled); 