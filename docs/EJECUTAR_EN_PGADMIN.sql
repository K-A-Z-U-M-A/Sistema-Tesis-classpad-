-- ============================================================================
-- PASO 1: ELIMINAR TABLAS INCORRECTAS (si existen)
-- ============================================================================

DROP TABLE IF EXISTS attendance_holidays CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;

-- ============================================================================
-- PASO 2: CREAR LAS TABLAS CORRECTAS CON TIPOS CORRECTOS
-- ============================================================================

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
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Attendance Records table (individual attendance records)
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_type VARCHAR(20) DEFAULT 'qr',
    status VARCHAR(20) DEFAULT 'present',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    qr_token_used VARCHAR(255),
    recorded_by INTEGER REFERENCES users(id),
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
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, date)
);

-- ============================================================================
-- PASO 3: CREAR ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================================================

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

-- ============================================================================
-- PASO 4: CREAR TRIGGER PARA ACTUALIZAR TIMESTAMP
-- ============================================================================

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

-- ============================================================================
-- ¡LISTO! Deberías ver "Query returned successfully"
-- ============================================================================
