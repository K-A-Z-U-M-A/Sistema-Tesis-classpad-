-- Migration to fix materials table for assignment support
-- This migration adds assignment_id column and fixes the CHECK constraint

-- Add assignment_id column to materials table (UUID to match assignments.id)
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE;

-- Drop the existing CHECK constraint if it exists
ALTER TABLE materials 
DROP CONSTRAINT IF EXISTS materials_type_check;

-- Drop the existing CHECK constraint for unit_id/assignment_id if it exists
ALTER TABLE materials 
DROP CONSTRAINT IF EXISTS materials_unit_assignment_check;

-- Add new CHECK constraint to ensure either unit_id OR assignment_id is NOT NULL
ALTER TABLE materials 
ADD CONSTRAINT materials_unit_assignment_check 
CHECK (unit_id IS NOT NULL OR assignment_id IS NOT NULL);

-- Add new CHECK constraint for type values
ALTER TABLE materials 
ADD CONSTRAINT materials_type_check 
CHECK (type IN ('file', 'link', 'text', 'pdf', 'doc', 'docx', 'image', 'video', 'audio', 'document'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_materials_assignment_id ON materials(assignment_id);

-- Update existing materials to have proper type values
UPDATE materials 
SET type = CASE 
    WHEN mime_type LIKE 'application/pdf' THEN 'pdf'
    WHEN mime_type LIKE 'application/msword' OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' THEN 'doc'
    WHEN mime_type LIKE 'image/%' THEN 'image'
    WHEN mime_type LIKE 'video/%' THEN 'video'
    WHEN mime_type LIKE 'audio/%' THEN 'audio'
    WHEN type = 'file' THEN 'document'
    ELSE type
END
WHERE type = 'file' OR type IS NULL;
