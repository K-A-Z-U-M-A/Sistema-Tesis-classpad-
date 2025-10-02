import pool from './src/config/database.js';

async function fixDatabase() {
  try {
    console.log('🔧 Fixing database...');
    
    // Test connection
    const testResult = await pool.query('SELECT 1 as test');
    console.log('✅ Database connected');
    
    // Add course_code column
    try {
      await pool.query('ALTER TABLE courses ADD COLUMN course_code VARCHAR(6) UNIQUE');
      console.log('✅ Added course_code column');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✅ course_code column already exists');
      } else {
        console.log('❌ Error adding course_code:', err.message);
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
        )
      `);
      console.log('✅ Created enrollments table');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✅ enrollments table already exists');
      } else {
        console.log('❌ Error creating enrollments:', err.message);
      }
    }
    
    console.log('🎉 Database fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixDatabase();
