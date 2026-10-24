-- Actualización de función de cálculo de calificaciones
-- Sistema de 100 puntos:
-- Parcial 1: 20 pts
-- Parcial 2: 20 pts
-- Trabajos Prácticos: 20 pts
-- Examen Final: 40 pts
-- Puntaje Final = Total Proceso (60) + Examen Final (40) = 100 puntos máx.

CREATE OR REPLACE FUNCTION calculate_grade_average() RETURNS TRIGGER AS $$
DECLARE
    v_p1 NUMERIC := COALESCE(NEW.parcial_1, 0);
    v_p2 NUMERIC := COALESCE(NEW.parcial_2, 0);
    v_tp NUMERIC := COALESCE(NEW.trabajos_practicos, 0);
    v_recup NUMERIC := COALESCE(NEW.recuperatoria, 0);
BEGIN
    -- Si rindió examen recuperatorio y su nota es mayor a la menor de las parciales, reemplaza
    IF NEW.recuperatoria IS NOT NULL AND v_recup > LEAST(v_p1, v_p2) THEN
        IF v_p1 <= v_p2 THEN
            v_p1 := v_recup;
        ELSE
            v_p2 := v_recup;
        END IF;
    END IF;

    -- Total acumulado de proceso (máx 60 puntos: P1(20) + P2(20) + TP(20))
    NEW.total := ROUND(v_p1 + v_p2 + v_tp);
    
    -- Puntaje Final (máximo 100 puntos: Total Proceso (60) + Examen Final (40))
    IF NEW.examen_final IS NOT NULL THEN
        NEW.promedio := ROUND(NEW.total + NEW.examen_final);
    ELSE
        NEW.promedio := NEW.total;
    END IF;
    
    -- Reglas de Habilitación sobre 60 puntos de proceso:
    -- Total >= 36 (60%): Habilita para examen final
    -- Total >= 24 y < 36 (40%-59%): Habilita para recuperación
    -- Total < 24 (< 40%): No habilita
    IF NEW.total >= 36 THEN
        NEW.habilitado_final := true;
        NEW.habilitado_recuperacion := false;
    ELSIF NEW.total >= 24 THEN
        NEW.habilitado_final := false;
        NEW.habilitado_recuperacion := true;
    ELSE
        NEW.habilitado_final := false;
        NEW.habilitado_recuperacion := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-asociar trigger
DROP TRIGGER IF EXISTS trigger_calculate_grade_average ON student_grades;
CREATE TRIGGER trigger_calculate_grade_average
    BEFORE INSERT OR UPDATE ON student_grades
    FOR EACH ROW
    EXECUTE FUNCTION calculate_grade_average();
