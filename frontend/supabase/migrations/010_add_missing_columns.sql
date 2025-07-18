-- Add missing columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS has_been_split BOOLEAN DEFAULT FALSE;

-- Add missing columns to user_stats table
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS last_task_summary JSONB;

-- Update existing tasks to have has_been_split = false
UPDATE tasks SET has_been_split = FALSE WHERE has_been_split IS NULL; 