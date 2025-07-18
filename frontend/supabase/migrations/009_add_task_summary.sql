-- Add last_task_summary column to user_stats table
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS last_task_summary TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN user_stats.last_task_summary IS 'JSON string containing task summary from last daily reset (completed tasks, missed tasks, counts)'; 