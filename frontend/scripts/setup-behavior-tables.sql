-- Execute this SQL in your Supabase SQL Editor to enable behavior tracking

-- Create user behavior events table
CREATE TABLE IF NOT EXISTS user_behavior_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'task_created', 'task_completed', 'task_deleted', 'task_skipped',
    'mood_selected', 'session_start', 'session_end', 'notification_clicked',
    'daily_reset', 'milestone_achieved'
  )),
  event_data JSONB DEFAULT '{}',
  task_id INTEGER,
  mood TEXT,
  completion_time TIMESTAMPTZ,
  time_of_day INTEGER CHECK (time_of_day >= 0 AND time_of_day <= 23),
  device_type TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user behavior analysis table
CREATE TABLE IF NOT EXISTS user_behavior_analysis (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  task_completion_rate INTEGER DEFAULT 0,
  avg_completion_time INTERVAL,
  preferred_task_times INTEGER[] DEFAULT '{}',
  common_moods TEXT[] DEFAULT '{}',
  productive_hours INTEGER[] DEFAULT '{}',
  notification_responsiveness INTEGER DEFAULT 0,
  task_patterns JSONB DEFAULT '{}',
  behavioral_insights TEXT[] DEFAULT '{}',
  last_analyzed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_behavior_events_user_id ON user_behavior_events(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_event_type ON user_behavior_events(event_type);
CREATE INDEX IF NOT EXISTS idx_behavior_events_created_at ON user_behavior_events(created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_analysis_user_id ON user_behavior_analysis(user_id);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for behavior analysis
DROP TRIGGER IF EXISTS update_behavior_analysis_updated_at ON user_behavior_analysis;
CREATE TRIGGER update_behavior_analysis_updated_at
    BEFORE UPDATE ON user_behavior_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (optional, adjust based on your RLS setup)
-- ALTER TABLE user_behavior_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_behavior_analysis ENABLE ROW LEVEL SECURITY;

SELECT 'Behavior tracking tables created successfully!' as status;