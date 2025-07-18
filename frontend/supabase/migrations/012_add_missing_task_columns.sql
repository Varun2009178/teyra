-- Add missing columns to tasks table that the code expects
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS expired BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completedAt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assignedDate DATE;

-- Add comments to explain the columns
COMMENT ON COLUMN tasks.expired IS 'Whether the task has expired (past due date)';
COMMENT ON COLUMN tasks.completedAt IS 'When the task was completed';
COMMENT ON COLUMN tasks.assignedDate IS 'The date the task was assigned'; 