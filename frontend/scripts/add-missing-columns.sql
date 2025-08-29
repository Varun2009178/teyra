-- Add missing columns to user_progress table
-- Run this in your Supabase SQL editor

-- Add ai_splits_used column
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS ai_splits_used INTEGER DEFAULT 0;

-- Add other potentially missing columns
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS mood_selections INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Missing columns added successfully! 🎉' as status;



