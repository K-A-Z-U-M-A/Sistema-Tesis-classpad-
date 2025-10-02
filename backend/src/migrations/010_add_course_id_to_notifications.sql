-- Add course_id column to notifications table
ALTER TABLE notifications 
ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_course_id ON notifications(course_id);

-- Update existing notifications to set course_id based on related_id when related_type is 'course'
UPDATE notifications 
SET course_id = related_id 
WHERE related_type = 'course' AND related_id IS NOT NULL;

