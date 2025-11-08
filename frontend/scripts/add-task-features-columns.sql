-- Migration: Add priority, due_date, and subtasks columns to tasks table
-- Run this in your Supabase SQL editor
-- Date: 2024

-- Add priority column (low, medium, high, urgent)
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS priority TEXT 
  CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high', 'urgent'));

-- Add due_date column (stores date and time)
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Add subtasks column (stores array of subtask objects as JSONB)
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

-- Create index for priority to speed up filtering
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority) WHERE priority IS NOT NULL;

-- Create index for due_date to speed up date-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Create GIN index for subtasks JSONB column for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_tasks_subtasks ON tasks USING GIN (subtasks);

-- Add comments for documentation
COMMENT ON COLUMN tasks.priority IS 'Task priority level: low, medium, high, or urgent';
COMMENT ON COLUMN tasks.due_date IS 'Due date and time for the task';
COMMENT ON COLUMN tasks.subtasks IS 'Array of subtasks stored as JSONB: [{"id": "string", "title": "string", "completed": boolean}]';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name IN ('priority', 'due_date', 'subtasks')
ORDER BY ordinal_position;

-- Success message
SELECT 'Task feature columns added successfully! 🎉' as status;

