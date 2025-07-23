-- Add has_been_split column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS has_been_split BOOLEAN DEFAULT FALSE NOT NULL;

-- Update existing tasks to have has_been_split = false
UPDATE tasks SET has_been_split = FALSE WHERE has_been_split IS NULL; 