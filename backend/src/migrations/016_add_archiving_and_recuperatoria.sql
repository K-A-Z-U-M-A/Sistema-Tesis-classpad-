-- ========================================
-- MIGRACIÓN: Agregar soporte de archivado y recuperatoria
-- ========================================

-- 1. AGREGAR CAMPOS DE ARCHIVADO A COURSES
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_courses_archived ON courses(archived);

COMMENT ON COLUMN courses.archived IS 'Indica si el curso está archivado (no visible para estudiantes)';
COMMENT ON COLUMN courses.archived_at IS 'Fecha y hora en que se archivó el curso';

-- 2. AGREGAR RECUPERATORIA A STUDENT_GRADES
ALTER TABLE student_grades 
ADD COLUMN IF NOT EXISTS recuperatoria DECIMAL(5,2);

COMMENT ON COLUMN student_grades.recuperatoria IS 'Calificación de examen recuperatorio (0-20 puntos)';

-- 3. ACTUALIZAR FUNCIÓN DE CÁLCULO AUTOMÁTICO
CREATE OR REPLACE FUNCTION calculate_grade_average() RETURNS TRIGGER AS $$
BEGIN
    -- Total = P1 + P2 + TP
    NEW.total := COALESCE(NEW.parcial_1, 0) + 
                 COALESCE(NEW.parcial_2, 0) + 
                 COALESCE(NEW.trabajos_practicos, 0);
    
    -- Promedio final
    -- Si tiene examen final, promedio = (Total + Final) / 2
    -- Si no, promedio = Total / 3
    IF NEW.examen_final IS NOT NULL AND NEW.examen_final > 0 THEN
        NEW.promedio := (NEW.total + NEW.examen_final) / 2.0;
    ELSE
        NEW.promedio := NEW.total / 3.0;
    END IF;
    
    -- Reglas de Habilitación
    -- Total >= 36: Habilita para examen final
    IF NEW.total >= 36 THEN
        NEW.habilitado_final := true;
        NEW.habilitado_recuperacion := false;
    -- Total >= 24 y < 36: Habilita para recuperación
    ELSIF NEW.total >= 24 THEN
        NEW.habilitado_final := false;
        NEW.habilitado_recuperacion := true;
    -- Total < 24: No habilita
    ELSE
        NEW.habilitado_final := false;
        NEW.habilitado_recuperacion := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar que el trigger existe
DROP TRIGGER IF EXISTS trigger_calculate_grade_average ON student_grades;
CREATE TRIGGER trigger_calculate_grade_average
    BEFORE INSERT OR UPDATE ON student_grades
    FOR EACH ROW
    EXECUTE FUNCTION calculate_grade_average();

-- 4. VERIFICAR ESTRUCTURA
DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada';
    RAISE NOTICE 'Campos agregados a courses: archived, archived_at';
    RAISE NOTICE 'Campos agregados a student_grades: recuperatoria';
    RAISE NOTICE 'Función de cálculo actualizada con reglas de habilitación';
END $$;
