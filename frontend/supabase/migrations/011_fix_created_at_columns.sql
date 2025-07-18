-- Fix created_at column names to match code expectations
-- Rename created_at to createdAt in tasks table
ALTER TABLE tasks 
RENAME COLUMN created_at TO "createdAt";

-- Rename updated_at to updatedAt in tasks table
ALTER TABLE tasks 
RENAME COLUMN updated_at TO "updatedAt";

-- Rename created_at to createdAt in user_stats table
ALTER TABLE user_stats 
RENAME COLUMN created_at TO "createdAt";

-- Rename updated_at to updatedAt in user_stats table
ALTER TABLE user_stats 
RENAME COLUMN updated_at TO "updatedAt"; 