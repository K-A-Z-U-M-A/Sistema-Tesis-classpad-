-- Add course_id column to notifications table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'course_id'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_notifications_course_id ON notifications(course_id);
    END IF;
END $$;

