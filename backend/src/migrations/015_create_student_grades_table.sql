-- Migration to create student_grades table
-- This table stores academic grades for each student in each course

CREATE TABLE IF NOT EXISTS student_grades (
    id SERIAL PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Calificaciones individuales
    parcial_1 DECIMAL(5,2) DEFAULT NULL,
    parcial_2 DECIMAL(5,2) DEFAULT NULL,
    trabajos_practicos DECIMAL(5,2) DEFAULT NULL,
    examen_final DECIMAL(5,2) DEFAULT NULL,
    
    -- Cálculos automáticos
    promedio DECIMAL(5,2) DEFAULT NULL,
    total DECIMAL(5,2) DEFAULT NULL,
    
    -- Habilitaciones
    habilitado_final BOOLEAN DEFAULT false,
    habilitado_recuperacion BOOLEAN DEFAULT false,
    
    -- Control de publicación
    is_published BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: un estudiante solo puede tener un registro de calificaciones por curso
    UNIQUE(course_id, student_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_student_grades_course_id ON student_grades(course_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_student_id ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_published ON student_grades(is_published);

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_student_grades_updated_at
    BEFORE UPDATE ON student_grades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular promedio automáticamente
CREATE OR REPLACE FUNCTION calculate_grade_average() RETURNS TRIGGER AS $$
BEGIN
    -- Calcular promedio solo si hay al menos una calificación
    IF NEW.parcial_1 IS NOT NULL OR NEW.parcial_2 IS NOT NULL OR NEW.trabajos_practicos IS NOT NULL THEN
        -- Promedio = (P1 + P2 + TP) / 3
        NEW.promedio := (
            COALESCE(NEW.parcial_1, 0) + 
            COALESCE(NEW.parcial_2, 0) + 
            COALESCE(NEW.trabajos_practicos, 0)
        ) / 3.0;
        
        -- Total = P1 + P2 + TP
        NEW.total := COALESCE(NEW.parcial_1, 0) + 
                     COALESCE(NEW.parcial_2, 0) + 
                     COALESCE(NEW.trabajos_practicos, 0);
    END IF;
    
    -- Calcular habilitaciones
    -- Habilitado para final si promedio >= 6
    IF NEW.promedio IS NOT NULL AND NEW.promedio >= 6 THEN
        NEW.habilitado_final := true;
    ELSE
        NEW.habilitado_final := false;
    END IF;
    
    -- Habilitado para recuperación si promedio >= 4 y < 6
    IF NEW.promedio IS NOT NULL AND NEW.promedio >= 4 AND NEW.promedio < 6 THEN
        NEW.habilitado_recuperacion := true;
    ELSE
        NEW.habilitado_recuperacion := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular promedio automáticamente
CREATE TRIGGER trigger_calculate_grade_average
    BEFORE INSERT OR UPDATE ON student_grades
    FOR EACH ROW
    EXECUTE FUNCTION calculate_grade_average();

-- Comentarios para documentación
COMMENT ON TABLE student_grades IS 'Almacena las calificaciones académicas de cada estudiante por curso';
COMMENT ON COLUMN student_grades.parcial_1 IS 'Calificación del primer parcial';
COMMENT ON COLUMN student_grades.parcial_2 IS 'Calificación del segundo parcial';
COMMENT ON COLUMN student_grades.trabajos_practicos IS 'Calificación de trabajos prácticos';
COMMENT ON COLUMN student_grades.examen_final IS 'Calificación del examen final';
COMMENT ON COLUMN student_grades.promedio IS 'Promedio calculado automáticamente: (P1 + P2 + TP) / 3';
COMMENT ON COLUMN student_grades.total IS 'Total calculado automáticamente: P1 + P2 + TP';
COMMENT ON COLUMN student_grades.habilitado_final IS 'Habilitado para examen final (promedio >= 6)';
COMMENT ON COLUMN student_grades.habilitado_recuperacion IS 'Habilitado para recuperación (promedio >= 4 y < 6)';
COMMENT ON COLUMN student_grades.is_published IS 'Indica si las calificaciones están publicadas para el estudiante';
