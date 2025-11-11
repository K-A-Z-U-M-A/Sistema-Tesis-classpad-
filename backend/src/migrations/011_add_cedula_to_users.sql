-- Migration to add cedula field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);

-- Create index for faster lookups by cedula (without UNIQUE constraint to allow NULLs)
CREATE INDEX IF NOT EXISTS idx_users_cedula ON users(cedula);

