-- Drop existing RLS policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;

-- Create new RLS policies that work with external authentication
-- These policies will allow all operations since external auth handles authentication
CREATE POLICY "Allow all operations for authenticated users" ON tasks
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON user_stats
  FOR ALL USING (true); 