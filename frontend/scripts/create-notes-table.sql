-- Create notes table for storing user notes
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'untitled',
  content TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);

-- Create updated_at trigger function that handles both tables with and without last_edited_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Only set last_edited_at for the notes table (which has this column)
    IF TG_TABLE_NAME = 'notes' THEN
        NEW.last_edited_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger for notes table
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (if using RLS)
-- ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (uncomment if using Clerk + RLS)
-- CREATE POLICY "Users can view their own notes" ON notes
--   FOR SELECT USING (user_id = auth.jwt() ->> 'sub');
--
-- CREATE POLICY "Users can insert their own notes" ON notes
--   FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');
--
-- CREATE POLICY "Users can update their own notes" ON notes
--   FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');
--
-- CREATE POLICY "Users can delete their own notes" ON notes
--   FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

SELECT 'Notes table created successfully!' as status;
