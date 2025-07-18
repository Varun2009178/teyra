-- Fix column name mismatch: rename 'text' to 'title' in tasks table
ALTER TABLE tasks 
RENAME COLUMN text TO title;

-- Also rename user_id to userId for consistency with the code
ALTER TABLE tasks 
RENAME COLUMN user_id TO "userId";

-- Rename user_id to userId in user_stats table for consistency
ALTER TABLE user_stats 
RENAME COLUMN user_id TO "userId"; 