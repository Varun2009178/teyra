-- Enable RLS for testing production behavior locally
-- This will help identify authentication issues

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_stats table
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for tasks
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid()::text = "userId");

-- Create basic RLS policies for user_stats
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own stats" ON user_stats
  FOR DELETE USING (auth.uid()::text = "userId"); 