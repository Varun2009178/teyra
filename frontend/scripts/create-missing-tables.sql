-- Create missing tables for daily check-ins and mood tracking

-- Daily check-ins table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  emotional_state TEXT NOT NULL,
  message TEXT,
  mike_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moods table for mood history/tracking
CREATE TABLE IF NOT EXISTS moods (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  mood TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to user_progress table if they don't exist
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_reset_email_sent TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_created_at ON daily_checkins(created_at);
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_created_at ON moods(created_at);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;
CREATE TRIGGER update_daily_checkins_updated_at
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_moods_updated_at ON moods;
CREATE TRIGGER update_moods_updated_at
    BEFORE UPDATE ON moods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS if needed (uncomment if using Row Level Security)
-- ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (uncomment if using Clerk + RLS)
-- CREATE POLICY "Users can manage their own daily check-ins" ON daily_checkins
--   FOR ALL USING (user_id = auth.jwt() ->> 'sub');

-- CREATE POLICY "Users can manage their own moods" ON moods
--   FOR ALL USING (user_id = auth.jwt() ->> 'sub');

SELECT 'Missing tables created successfully!' as status;