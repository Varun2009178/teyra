-- Fix any existing tasks that have null IDs
-- This can happen if tasks were created before the schema was fixed

-- First, let's see what tasks have null IDs
SELECT id, "userId", title, completed, "createdAt"
FROM tasks 
WHERE id IS NULL OR id = 'null' OR id = '';

-- Update tasks with null IDs to have proper UUIDs
UPDATE tasks 
SET id = gen_random_uuid()::text
WHERE id IS NULL OR id = 'null' OR id = '';

-- Verify the fix
SELECT id, "userId", title, completed, "createdAt"
FROM tasks 
ORDER BY "createdAt" DESC
LIMIT 10;

-- Also check for any tasks with null userId
SELECT id, "userId", title, completed, "createdAt"
FROM tasks 
WHERE "userId" IS NULL OR "userId" = 'null' OR "userId" = '';

-- If there are tasks with null userId, we should delete them (they're orphaned)
DELETE FROM tasks 
WHERE "userId" IS NULL OR "userId" = 'null' OR "userId" = '';

-- Final verification
SELECT COUNT(*) as total_tasks,
       COUNT(CASE WHEN id IS NULL OR id = 'null' OR id = '' THEN 1 END) as null_ids,
       COUNT(CASE WHEN "userId" IS NULL OR "userId" = 'null' OR "userId" = '' THEN 1 END) as null_user_ids
FROM tasks; 