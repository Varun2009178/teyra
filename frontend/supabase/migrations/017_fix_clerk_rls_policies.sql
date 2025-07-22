-- Fix RLS policies for Clerk authentication
-- Allow service role to bypass RLS for API operations

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can delete their own stats" ON user_stats;

-- Create new policies that work with Clerk user IDs
-- These policies will be used when the service role is not being used

CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
    OR "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
    OR "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
    OR "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
    OR "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
    OR "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
    OR "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
    OR "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can delete their own stats" ON user_stats
  FOR DELETE USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
    OR "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
  ); 