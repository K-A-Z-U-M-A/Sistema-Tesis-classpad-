import pool from './config/database.js';

/**
 * Asegura que existan las tablas/columnas del sistema de calendario escolar:
 *  - class_days (columna en courses)
 *  - school_calendars (tabla)
 *  - paraguay_holidays (tabla + seed de datos)
 *
 * Se ejecuta automáticamente al iniciar el servidor.
 */
async function ensureCalendarTables() {
  try {
    // ── 1. Columna class_days en courses ──────────────────────────────────────
    await pool.query(`
      ALTER TABLE courses
        ADD COLUMN IF NOT EXISTS class_days TEXT[] DEFAULT '{}';
    `);

    // ── 2. Tabla school_calendars ─────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS school_calendars (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id   UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        start_date  DATE        NOT NULL,
        end_date    DATE        NOT NULL,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT school_calendars_course_unique UNIQUE (course_id),
        CONSTRAINT school_calendars_date_order    CHECK  (end_date > start_date)
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_school_calendars_course_id
        ON school_calendars (course_id);
    `);

    // ── 3. Tabla paraguay_holidays ────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paraguay_holidays (
        id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        name            VARCHAR(200) NOT NULL,
        original_date   DATE         NOT NULL,
        effective_date  DATE         NOT NULL,
        year            INTEGER      NOT NULL,
        is_moved        BOOLEAN      NOT NULL DEFAULT FALSE,
        move_reason     TEXT,
        is_national     BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paraguay_holidays_year
        ON paraguay_holidays (year);
      CREATE INDEX IF NOT EXISTS idx_paraguay_holidays_eff_date
        ON paraguay_holidays (effective_date);
    `);

    // ── 3.1. Tabla course_calendar_classes (temas/unidades asignados a fechas de clase) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_calendar_classes (
        id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id   UUID         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        unit_id     UUID         REFERENCES units(id) ON DELETE SET NULL,
        unit_ids    JSONB        DEFAULT '[]'::jsonb,
        class_date  DATE         NOT NULL,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT course_calendar_classes_unique UNIQUE (course_id, class_date)
      );
    `);

    await pool.query(`
      ALTER TABLE course_calendar_classes 
      ADD COLUMN IF NOT EXISTS unit_ids JSONB DEFAULT '[]'::jsonb;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_calendar_classes_course_id
        ON course_calendar_classes (course_id);
      CREATE INDEX IF NOT EXISTS idx_calendar_classes_date
        ON course_calendar_classes (class_date);
    `);

    // ── 4. Trigger updated_at ─────────────────────────────────────────────────
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_school_calendars_updated_at'
        ) THEN
          CREATE TRIGGER trg_school_calendars_updated_at
            BEFORE UPDATE ON school_calendars
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_paraguay_holidays_updated_at'
        ) THEN
          CREATE TRIGGER trg_paraguay_holidays_updated_at
            BEFORE UPDATE ON paraguay_holidays
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);

    // ── 5. Seed feriados si la tabla está vacía ───────────────────────────────
    const countResult = await pool.query('SELECT COUNT(*) AS cnt FROM paraguay_holidays');
    const count = parseInt(countResult.rows[0].cnt, 10);

    if (count === 0) {
      console.log('📅 Cargando feriados de Paraguay (2025-2026)...');
      await seedHolidays();
      console.log('✅ Feriados de Paraguay cargados correctamente');
    }

    console.log('✅ Tablas de calendario escolar verificadas');
  } catch (error) {
    console.error('❌ Error asegurando tablas de calendario:', error.message);
  }
}

/**
 * Carga los feriados nacionales de Paraguay para 2025 y 2026.
 */
async function seedHolidays() {
  const holidays = [
    // ── 2025 ──────────────────────────────────────────────────────────────────
    { name: 'Año Nuevo',                          original: '2025-01-01', effective: '2025-01-01', year: 2025, moved: false },
    { name: 'Día de San Blas (Patrono)',          original: '2025-02-03', effective: '2025-02-03', year: 2025, moved: false },
    { name: 'Carnaval (Lunes)',                   original: '2025-03-03', effective: '2025-03-03', year: 2025, moved: false },
    { name: 'Carnaval (Martes)',                  original: '2025-03-04', effective: '2025-03-04', year: 2025, moved: false },
    { name: 'Día de los Héroes de la Patria',    original: '2025-03-01', effective: '2025-03-03', year: 2025, moved: true,  reason: 'Trasladado al lunes más próximo (Ley 3937/09)' },
    { name: 'Jueves Santo',                       original: '2025-04-17', effective: '2025-04-17', year: 2025, moved: false },
    { name: 'Viernes Santo',                      original: '2025-04-18', effective: '2025-04-18', year: 2025, moved: false },
    { name: 'Día del Trabajador',                 original: '2025-05-01', effective: '2025-05-01', year: 2025, moved: false },
    { name: 'Independencia Nacional (14 de Mayo)', original: '2025-05-14', effective: '2025-05-14', year: 2025, moved: false },
    { name: 'Independencia Nacional (15 de Mayo)', original: '2025-05-15', effective: '2025-05-15', year: 2025, moved: false },
    { name: 'Paz del Chaco',                      original: '2025-06-12', effective: '2025-06-12', year: 2025, moved: false },
    { name: 'Fundación de Asunción',              original: '2025-08-15', effective: '2025-08-15', year: 2025, moved: false },
    { name: 'Constitución Nacional',              original: '2025-08-25', effective: '2025-08-25', year: 2025, moved: false },
    { name: 'Victoria de Boquerón',               original: '2025-09-29', effective: '2025-09-29', year: 2025, moved: false },
    { name: 'Virgen de Caacupé',                  original: '2025-12-08', effective: '2025-12-08', year: 2025, moved: false },
    { name: 'Navidad',                            original: '2025-12-25', effective: '2025-12-25', year: 2025, moved: false },

    // ── 2026 ──────────────────────────────────────────────────────────────────
    { name: 'Año Nuevo',                          original: '2026-01-01', effective: '2026-01-01', year: 2026, moved: false },
    { name: 'Día de San Blas (Patrono)',          original: '2026-02-03', effective: '2026-02-03', year: 2026, moved: false },
    { name: 'Carnaval (Lunes)',                   original: '2026-02-16', effective: '2026-02-16', year: 2026, moved: false },
    { name: 'Carnaval (Martes)',                  original: '2026-02-17', effective: '2026-02-17', year: 2026, moved: false },
    { name: 'Día de los Héroes de la Patria',    original: '2026-03-01', effective: '2026-03-02', year: 2026, moved: true,  reason: 'Trasladado al lunes más próximo (Ley 3937/09)' },
    { name: 'Jueves Santo',                       original: '2026-04-02', effective: '2026-04-02', year: 2026, moved: false },
    { name: 'Viernes Santo',                      original: '2026-04-03', effective: '2026-04-03', year: 2026, moved: false },
    { name: 'Día del Trabajador',                 original: '2026-05-01', effective: '2026-05-01', year: 2026, moved: false },
    { name: 'Independencia Nacional (14 de Mayo)', original: '2026-05-14', effective: '2026-05-14', year: 2026, moved: false },
    { name: 'Independencia Nacional (15 de Mayo)', original: '2026-05-15', effective: '2026-05-15', year: 2026, moved: false },
    { name: 'Paz del Chaco',                      original: '2026-06-12', effective: '2026-06-12', year: 2026, moved: false },
    { name: 'Fundación de Asunción',              original: '2026-08-15', effective: '2026-08-17', year: 2026, moved: true,  reason: 'Trasladado al lunes más próximo (Ley 3937/09)' },
    { name: 'Constitución Nacional',              original: '2026-08-25', effective: '2026-08-25', year: 2026, moved: false },
    { name: 'Victoria de Boquerón',               original: '2026-09-29', effective: '2026-09-29', year: 2026, moved: false },
    { name: 'Virgen de Caacupé',                  original: '2026-12-08', effective: '2026-12-08', year: 2026, moved: false },
    { name: 'Navidad',                            original: '2026-12-25', effective: '2026-12-25', year: 2026, moved: false },
  ];

  for (const h of holidays) {
    await pool.query(
      `INSERT INTO paraguay_holidays
         (name, original_date, effective_date, year, is_moved, move_reason, is_national)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT DO NOTHING`,
      [h.name, h.original, h.effective, h.year, h.moved, h.reason || null]
    );
  }
}

export default ensureCalendarTables;
