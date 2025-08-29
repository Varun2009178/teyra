-- Add notification-related columns to user_progress table
-- Run this in your Supabase SQL editor

-- Add FCM token column for Firebase Cloud Messaging
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Add notification preferences column (JSONB for flexible preferences)
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "dailyReminders": true,
  "taskCompletion": true,
  "moodCheckins": true,
  "aiInsights": true,
  "milestones": true
}'::jsonb;

-- Add last notification sent timestamp
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_notification_sent TIMESTAMPTZ;

-- Add notification frequency preference
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'daily';

-- Create index on FCM token for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_fcm_token ON user_progress(fcm_token);

-- Create index on notification preferences for faster queries
CREATE INDEX IF NOT EXISTS idx_user_progress_notification_prefs ON user_progress USING GIN (notification_preferences);

-- Update existing users to have default notification preferences
UPDATE user_progress 
SET notification_preferences = '{
  "dailyReminders": true,
  "taskCompletion": true,
  "moodCheckins": true,
  "aiInsights": true,
  "milestones": true
}'::jsonb
WHERE notification_preferences IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
AND column_name IN ('fcm_token', 'notification_preferences', 'last_notification_sent', 'notification_frequency')
ORDER BY ordinal_position;

-- Success message
SELECT 'Notification columns added successfully! 🔔' as status;
