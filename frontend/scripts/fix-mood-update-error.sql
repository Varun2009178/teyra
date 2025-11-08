-- Fix the update_updated_at_column() function to handle tables with and without last_edited_at
-- Run this in your Supabase SQL editor to fix the mood update error

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

SELECT 'Trigger function updated successfully! The mood update error should now be fixed.' as status;

