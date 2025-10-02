import pool from './src/config/database.js';

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database structure...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');
    
    // Add course_code column
    try {
      await pool.query('ALTER TABLE courses ADD COLUMN course_code VARCHAR(6) UNIQUE;');
      console.log('✅ Added course_code column to courses table');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✅ course_code column already exists');
      } else {
        console.error('❌ Error adding course_code column:', err.message);
      }
    }
    
    // Create enrollments table
    try {
      await pool.query(`
        CREATE TABLE enrollments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
          UNIQUE(course_id, student_id)
        );
      `);
      console.log('✅ Created enrollments table');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✅ enrollments table already exists');
      } else {
        console.error('❌ Error creating enrollments table:', err.message);
      }
    }
    
    // Create indexes
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_courses_course_code ON courses(course_code);');
      console.log('✅ Created indexes');
    } catch (err) {
      console.error('❌ Error creating indexes:', err.message);
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();
