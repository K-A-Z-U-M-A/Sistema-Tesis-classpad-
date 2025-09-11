-- Migration to update users table for JWT authentication
-- Add new columns for local authentication and Google OAuth

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local';

-- Remove old firebase_ui column if it exists
ALTER TABLE users
  DROP COLUMN IF EXISTS firebase_ui;

-- Update existing records to have provider = 'local' if they have password_hash
UPDATE users 
SET provider = 'local' 
WHERE password_hash IS NOT NULL AND provider IS NULL;

-- Update existing records to have provider = 'google' if they don't have password_hash
UPDATE users 
SET provider = 'google' 
WHERE password_hash IS NULL AND provider IS NULL;
