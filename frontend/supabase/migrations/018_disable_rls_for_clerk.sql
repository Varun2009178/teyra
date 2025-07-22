-- Disable RLS temporarily for Clerk authentication
-- This allows the service key to work without permission issues

-- Disable RLS on tasks table
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user_stats table
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY; 