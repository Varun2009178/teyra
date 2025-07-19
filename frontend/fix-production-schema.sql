-- Fix production database schema to match the code expectations
-- Run this in your Supabase SQL Editor

-- 1. Rename columns in tasks table from snake_case to camelCase
ALTER TABLE tasks RENAME COLUMN user_id TO "userId";
ALTER TABLE tasks RENAME COLUMN created_at TO "createdAt";
ALTER TABLE tasks RENAME COLUMN updated_at TO "updatedAt";

-- 2. Rename columns in user_stats table from snake_case to camelCase
ALTER TABLE user_stats RENAME COLUMN user_id TO "userId";
ALTER TABLE user_stats RENAME COLUMN created_at TO "createdAt";
ALTER TABLE user_stats RENAME COLUMN updated_at TO "updatedAt";

-- 3. Add missing columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "expired" BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "assignedDate" DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "has_been_split" BOOLEAN DEFAULT FALSE;

-- 4. Add missing columns to user_stats table
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS "last_task_summary" JSONB;

-- 5. Update existing tasks to have default values
UPDATE tasks SET "expired" = FALSE WHERE "expired" IS NULL;
UPDATE tasks SET "has_been_split" = FALSE WHERE "has_been_split" IS NULL;

-- 6. Recreate the updatedAt trigger for tasks table
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Recreate the updatedAt trigger for user_stats table
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at 
    BEFORE UPDATE ON user_stats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable RLS policies (if they were disabled)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 9. Create/update RLS policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
CREATE POLICY "Users can insert their own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE USING (auth.uid()::text = "userId");

-- 10. Create/update RLS policies for user_stats
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
CREATE POLICY "Users can view their own stats" ON user_stats
    FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
CREATE POLICY "Users can insert their own stats" ON user_stats
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
CREATE POLICY "Users can update their own stats" ON user_stats
    FOR UPDATE USING (auth.uid()::text = "userId");

-- 11. Grant necessary permissions
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON user_stats TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_stats' 
ORDER BY ordinal_position; 