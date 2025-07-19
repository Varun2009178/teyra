-- Targeted fix for production database schema
-- Based on actual column names found in production

-- 1. Fix tasks table - rename user_id to userId
ALTER TABLE tasks RENAME COLUMN user_id TO "userId";

-- 2. Fix user_stats table - rename user_id to userId
ALTER TABLE user_stats RENAME COLUMN user_id TO "userId";

-- 3. Fix user_stats table - rename created_at to createdAt
ALTER TABLE user_stats RENAME COLUMN created_at TO "createdAt";

-- 4. Fix user_stats table - rename updated_at to updatedAt
ALTER TABLE user_stats RENAME COLUMN updated_at TO "updatedAt";

-- 5. Recreate the updatedAt trigger for tasks table (since tasks doesn't have updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updatedAt column to tasks if it doesn't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for tasks table
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Recreate the updatedAt trigger for user_stats table
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at 
    BEFORE UPDATE ON user_stats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable RLS policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 8. Create/update RLS policies for tasks
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

-- 9. Create/update RLS policies for user_stats
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
CREATE POLICY "Users can view their own stats" ON user_stats
    FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
CREATE POLICY "Users can insert their own stats" ON user_stats
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
CREATE POLICY "Users can update their own stats" ON user_stats
    FOR UPDATE USING (auth.uid()::text = "userId");

-- 10. Grant necessary permissions
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON user_stats TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 11. Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_stats' 
ORDER BY ordinal_position; 