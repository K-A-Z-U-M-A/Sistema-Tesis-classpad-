-- Migration to add description field to users table
-- Add description column for user profile

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Add index for better performance on description searches (optional)
-- CREATE INDEX IF NOT EXISTS idx_users_description ON users(description) WHERE description IS NOT NULL AND description != '';
