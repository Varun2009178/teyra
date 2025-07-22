-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  completed_tasks INTEGER DEFAULT 0 NOT NULL,
  total_tasks INTEGER DEFAULT 0 NOT NULL,
  all_time_completed INTEGER DEFAULT 0 NOT NULL,
  mood VARCHAR(50) DEFAULT 'overwhelmed' NOT NULL,
  daily_completed_tasks INTEGER DEFAULT 0 NOT NULL,
  daily_mood_checks INTEGER DEFAULT 0 NOT NULL,
  daily_ai_splits INTEGER DEFAULT 0 NOT NULL,
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_progress
CREATE POLICY "Users can view their own progress" ON user_progress
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own progress" ON user_progress
  FOR DELETE USING (auth.uid()::text = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 