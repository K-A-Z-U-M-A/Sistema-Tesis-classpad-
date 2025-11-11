-- Create assignment_students table with UUID support
-- This table stores which students are assigned to specific assignments
-- If an assignment has no records here, it means it's assigned to all students in the course

CREATE TABLE IF NOT EXISTS assignment_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_students_assignment_id ON assignment_students(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_students_student_id ON assignment_students(student_id);

-- Add comment to table
COMMENT ON TABLE assignment_students IS 'Stores which students are assigned to specific assignments. If an assignment has no records here, it is assigned to all students in the course.';

