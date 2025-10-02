-- Migration to change subject column to turn in courses table
-- This migration updates the courses table to use turn instead of subject

-- Add turn column
ALTER TABLE courses ADD COLUMN IF NOT EXISTS turn VARCHAR(50);

-- Update existing records to have a default turn value
UPDATE courses SET turn = 'Mañana' WHERE turn IS NULL;

-- Make turn column NOT NULL
ALTER TABLE courses ALTER COLUMN turn SET NOT NULL;

-- Drop the subject column (optional - we can keep it for backward compatibility)
-- ALTER TABLE courses DROP COLUMN IF EXISTS subject;
