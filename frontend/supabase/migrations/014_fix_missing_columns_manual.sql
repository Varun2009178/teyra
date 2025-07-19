-- Manually add missing columns that the code expects
-- This migration ensures all required columns exist

-- Add completedAt column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'completedAt'
    ) THEN
        ALTER TABLE tasks ADD COLUMN "completedAt" TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add assignedDate column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'assignedDate'
    ) THEN
        ALTER TABLE tasks ADD COLUMN "assignedDate" DATE;
    END IF;
END $$;

-- Add expired column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'expired'
    ) THEN
        ALTER TABLE tasks ADD COLUMN expired BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add comments to explain the columns
COMMENT ON COLUMN tasks."completedAt" IS 'When the task was completed';
COMMENT ON COLUMN tasks."assignedDate" IS 'The date the task was assigned';
COMMENT ON COLUMN tasks.expired IS 'Whether the task has expired (past due date)'; 