-- ============================================================
-- Migración: Sistema de Calendario Escolar
-- Fecha: 2026-08-21
-- Descripción: Agrega soporte para días de clase por curso,
--              calendario escolar semestral, y feriados de Paraguay
-- ============================================================

-- 1. Agregar columna class_days a la tabla courses
--    Almacena los días de la semana en que el curso tiene clases
--    Valores posibles: 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
ALTER TABLE courses ADD COLUMN IF NOT EXISTS class_days TEXT[] DEFAULT '{}';

-- 2. Tabla de calendarios escolares por curso
--    Una fila por curso (configuración del semestre)
CREATE TABLE IF NOT EXISTS school_calendars (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  start_date      DATE        NOT NULL,
  end_date        DATE        NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT school_calendars_course_unique UNIQUE (course_id),
  CONSTRAINT school_calendars_date_order CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_school_calendars_course_id ON school_calendars (course_id);

-- 3. Tabla de feriados nacionales de Paraguay
--    effective_date puede diferir de original_date cuando el feriado es trasladado
CREATE TABLE IF NOT EXISTS paraguay_holidays (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  original_date   DATE         NOT NULL,   -- Fecha oficial/legal del feriado
  effective_date  DATE         NOT NULL,   -- Fecha en que se observa (puede ser trasladada)
  year            INTEGER      NOT NULL,
  is_moved        BOOLEAN      NOT NULL DEFAULT FALSE,
  move_reason     TEXT,
  is_national     BOOLEAN      NOT NULL DEFAULT TRUE,  -- vs feriado regional
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paraguay_holidays_year         ON paraguay_holidays (year);
CREATE INDEX IF NOT EXISTS idx_paraguay_holidays_eff_date     ON paraguay_holidays (effective_date);

-- 4. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_school_calendars_updated_at ON school_calendars;
CREATE TRIGGER trg_school_calendars_updated_at
  BEFORE UPDATE ON school_calendars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_paraguay_holidays_updated_at ON paraguay_holidays;
CREATE TRIGGER trg_paraguay_holidays_updated_at
  BEFORE UPDATE ON paraguay_holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
