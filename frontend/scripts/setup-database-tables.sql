-- Setup script for Teyra AI Learning and Cron Job System
-- Run this in your Supabase SQL editor

-- 1. User Behavior Tracking Table
CREATE TABLE IF NOT EXISTS user_behavior (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  data JSONB,
  context JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User AI Patterns Table
CREATE TABLE IF NOT EXISTS user_ai_patterns (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  patterns JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  consistency_score INTEGER DEFAULT 0,
  productivity_peaks JSONB,
  mood_patterns JSONB,
  task_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Progress Table (if not exists)
CREATE TABLE IF NOT EXISTS user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  daily_start_time TIMESTAMPTZ DEFAULT NOW(),
  last_reset_date TIMESTAMPTZ,
  total_points INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  mood_selections INTEGER DEFAULT 0,
  ai_splits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks Table (if not exists)
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  is_sustainable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  archived BOOLEAN DEFAULT FALSE
);

-- 5. Archived Tasks Table (for daily reset)
CREATE TABLE IF NOT EXISTS archived_tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  original_task_id BIGINT,
  title TEXT NOT NULL,
  completed BOOLEAN,
  is_sustainable BOOLEAN,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  reset_cycle_date DATE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_action ON user_behavior(action);
CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp ON user_behavior(timestamp);

CREATE INDEX IF NOT EXISTS idx_user_ai_patterns_user_id ON user_ai_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_tasks_user_id ON archived_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_tasks_reset_cycle ON archived_tasks(reset_cycle_date);

-- Enable Row Level Security (RLS)
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own behavior data" ON user_behavior
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own behavior data" ON user_behavior
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own AI patterns" ON user_ai_patterns
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert/update their own AI patterns" ON user_ai_patterns
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own progress" ON user_progress
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert/update their own progress" ON user_progress
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert/update/delete their own tasks" ON tasks
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own archived tasks" ON archived_tasks
  FOR SELECT USING (auth.uid()::text = user_id);

-- Insert sample data for testing (optional)
-- INSERT INTO user_progress (user_id, daily_start_time) VALUES ('test_user', NOW());

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_progress table
CREATE TRIGGER update_user_progress_updated_at 
    BEFORE UPDATE ON user_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database tables created successfully! 🎉' as status;
