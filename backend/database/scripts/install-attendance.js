import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'classpad_bd',
  user: 'postgres',
  password: 'admin',
});

const sql = `
-- Migration to create attendance system tables
-- This migration creates tables for QR-based attendance tracking with geolocation

-- 1. Attendance Sessions table (QR sessions created by teachers)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id SERIAL PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    location_required BOOLEAN DEFAULT false,
    allowed_latitude DECIMAL(10, 8),
    allowed_longitude DECIMAL(11, 8),
    allowed_radius INTEGER DEFAULT 50,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Attendance Records table (individual attendance records)
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_type VARCHAR(20) DEFAULT 'qr',
    status VARCHAR(20) DEFAULT 'present',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    qr_token_used VARCHAR(255),
    recorded_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

-- 3. Attendance Holidays/Absences table
CREATE TABLE IF NOT EXISTS attendance_holidays (
    id SERIAL PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    reason VARCHAR(100),
    date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_course_id ON attendance_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_qr_token ON attendance_sessions(qr_token);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_active ON attendance_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_start_time ON attendance_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_course_id ON attendance_records(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_type ON attendance_records(record_type);
CREATE INDEX IF NOT EXISTS idx_attendance_records_recorded_at ON attendance_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_attendance_holidays_course_id ON attendance_holidays(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_holidays_date ON attendance_holidays(date);

-- Create trigger
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_attendance_sessions_updated_at'
    ) THEN
        CREATE TRIGGER trigger_attendance_sessions_updated_at
            BEFORE UPDATE ON attendance_sessions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
`;

async function install() {
  try {
    console.log('🔄 Creando tablas de asistencia...\n');
    await pool.query(sql);
    console.log('✅ Tablas creadas exitosamente\n');
    
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('attendance_sessions', 'attendance_records', 'attendance_holidays')
    `);
    
    console.log('📊 Tablas verificadas:');
    tables.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));
    console.log('\n🎉 ¡Listo! Reinicia el servidor backend.\n');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Las tablas ya existen\n');
    } else {
      console.error('❌ Error:', error.message);
      console.error('\nDetalles:', error);
    }
  } finally {
    await pool.end();
  }
}

install();

