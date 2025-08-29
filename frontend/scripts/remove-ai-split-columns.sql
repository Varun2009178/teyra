-- Remove AI split-related columns from database schema
-- This script removes fields related to AI task splitting functionality

-- Remove daily_ai_splits column from user_progress table
ALTER TABLE user_progress DROP COLUMN IF EXISTS daily_ai_splits;

-- Remove has_been_split column from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS has_been_split;

-- Log the changes
SELECT 'AI split columns removed successfully' as status;