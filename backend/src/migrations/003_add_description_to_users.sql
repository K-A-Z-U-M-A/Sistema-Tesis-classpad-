-- Migration: Add description column to users table
-- Date: 2025-09-15
-- Description: Add description field for user profiles

-- Add description column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Update existing users with empty description
UPDATE users SET description = '' WHERE description IS NULL;

-- Add comment to the column
COMMENT ON COLUMN users.description IS 'User profile description/bio';
